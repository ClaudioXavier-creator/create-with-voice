-- Add columns to recebimento_mp
ALTER TABLE public.recebimento_mp 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'bloqueado',
ADD COLUMN IF NOT EXISTS saldo NUMERIC(12,3);

-- Initialize saldo with the original quantidade
UPDATE public.recebimento_mp 
SET saldo = CAST(REPLACE(REPLACE(quantidade, '.', ''), ',', '.') AS NUMERIC(12,3))
WHERE saldo IS NULL AND quantidade IS NOT NULL AND quantidade ~ '^[0-9.,]+$';

-- Ensure status is set correctly for existing records
UPDATE public.recebimento_mp SET status = 'liberado' WHERE status = 'bloqueado' AND aprovado = true;

-- Function to update saldo and handle FIFO
CREATE OR REPLACE FUNCTION public.fn_atualizar_saldo_mp()
RETURNS TRIGGER AS $$
DECLARE
    v_recebimento_id UUID;
    v_total_consumido NUMERIC(12,3);
    v_quantidade_inicial NUMERIC(12,3);
    v_materia_prima TEXT;
    v_lote_mp TEXT;
    v_empresa_id UUID;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_materia_prima := OLD.materia_prima;
        v_lote_mp := OLD.lote_mp;
        v_empresa_id := OLD.empresa_id;
    ELSE
        v_materia_prima := NEW.materia_prima;
        v_lote_mp := NEW.lote_mp;
        v_empresa_id := NEW.empresa_id;
    END IF;

    -- Find the corresponding receipt
    SELECT id, CAST(REPLACE(REPLACE(quantidade, '.', ''), ',', '.') AS NUMERIC(12,3)) 
    INTO v_recebimento_id, v_quantidade_inicial
    FROM public.recebimento_mp
    WHERE materia_prima = v_materia_prima 
      AND lote = v_lote_mp 
      AND (empresa_id = v_empresa_id OR (empresa_id IS NULL AND v_empresa_id IS NULL))
    LIMIT 1;

    IF v_recebimento_id IS NOT NULL THEN
        -- Calculate total consumed for this batch
        SELECT COALESCE(SUM(quantidade_kg), 0)
        INTO v_total_consumido
        FROM public.batida_lotes
        WHERE materia_prima = v_materia_prima 
          AND lote_mp = v_lote_mp
          AND (empresa_id = v_empresa_id OR (empresa_id IS NULL AND v_empresa_id IS NULL));

        -- Update saldo
        UPDATE public.recebimento_mp
        SET saldo = v_quantidade_inicial - v_total_consumido,
            status = CASE 
                WHEN (v_quantidade_inicial - v_total_consumido) <= 0 THEN 'esgotado'
                ELSE status -- keep current status if not finished
            END
        WHERE id = v_recebimento_id;

        -- FIFO: If a batch was just exhausted, liberate the next one
        IF (v_quantidade_inicial - v_total_consumido) <= 0 THEN
            UPDATE public.recebimento_mp
            SET status = 'liberado'
            WHERE id = (
                SELECT id 
                FROM public.recebimento_mp 
                WHERE materia_prima = v_materia_prima 
                  AND status = 'bloqueado' 
                  AND aprovado = true
                  AND (empresa_id = v_empresa_id OR (empresa_id IS NULL AND v_empresa_id IS NULL))
                ORDER BY data ASC, created_at ASC
                LIMIT 1
            );
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on batida_lotes
DROP TRIGGER IF EXISTS trg_atualizar_saldo_mp ON public.batida_lotes;
CREATE TRIGGER trg_atualizar_saldo_mp
AFTER INSERT OR UPDATE OR DELETE ON public.batida_lotes
FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_saldo_mp();

-- Initial liberation of the first batch for each MP
UPDATE public.recebimento_mp rm
SET status = 'liberado'
WHERE id IN (
    SELECT DISTINCT ON (materia_prima, empresa_id) id
    FROM public.recebimento_mp
    WHERE aprovado = true AND status = 'bloqueado'
    ORDER BY materia_prima, empresa_id, data ASC, created_at ASC
);
