/**
 * Helpers de PCP — sequenciamento de ordens de produção respeitando
 * a matriz de sensibilidade (carry-over / IN 15/2009).
 */

export interface MatrizItem {
  produto_anterior: string;
  produto_seguinte: string;
  requer_flushing: boolean;
}

export interface OrdemSeq {
  id: string;
  produto: string;
  prioridade?: string | null;
  data_programada?: string;
}

/**
 * Verifica se a transição entre dois produtos exige flushing/limpeza
 * de acordo com a matriz cadastrada.
 */
export function requerFlushing(
  produtoAnterior: string,
  produtoSeguinte: string,
  matriz: MatrizItem[],
): boolean {
  if (!produtoAnterior || !produtoSeguinte) return false;
  const item = matriz.find(
    m =>
      m.produto_anterior.trim().toLowerCase() === produtoAnterior.trim().toLowerCase() &&
      m.produto_seguinte.trim().toLowerCase() === produtoSeguinte.trim().toLowerCase(),
  );
  return !!item?.requer_flushing;
}

/**
 * Reordena uma lista de ordens minimizando a quantidade de transições
 * que exigem flushing. Estratégia gulosa:
 *  1) Começa pela ordem de maior prioridade (urgente > alta > normal > baixa).
 *  2) A cada passo escolhe a próxima ordem que NÃO requer flushing após a atual;
 *     se não houver, escolhe a de maior prioridade restante (com flag flushing=true).
 */
const PRIORIDADE_PESO: Record<string, number> = {
  urgente: 4,
  alta: 3,
  normal: 2,
  baixa: 1,
};

export interface OrdemReordenada<T extends OrdemSeq> {
  ordem: T;
  flushingAntes: boolean;
  produtoAnterior: string | null;
}

export function reordenarPorMatriz<T extends OrdemSeq>(
  ordens: T[],
  matriz: MatrizItem[],
): OrdemReordenada<T>[] {
  if (ordens.length === 0) return [];
  const restantes = [...ordens].sort(
    (a, b) => (PRIORIDADE_PESO[b.prioridade || "normal"] || 2) - (PRIORIDADE_PESO[a.prioridade || "normal"] || 2),
  );

  const resultado: OrdemReordenada<T>[] = [];
  let atual = restantes.shift()!;
  resultado.push({ ordem: atual, flushingAntes: false, produtoAnterior: null });

  while (restantes.length > 0) {
    // procura próxima sem necessidade de flushing
    let idxLimpo = restantes.findIndex(o => !requerFlushing(atual.produto, o.produto, matriz));
    let proxima: T;
    let flushing = false;
    if (idxLimpo >= 0) {
      proxima = restantes.splice(idxLimpo, 1)[0];
    } else {
      // todas exigem flushing — pega a de maior prioridade
      proxima = restantes.shift()!;
      flushing = true;
    }
    resultado.push({ ordem: proxima, flushingAntes: flushing, produtoAnterior: atual.produto });
    atual = proxima;
  }
  return resultado;
}

/**
 * Conta quantas transições da sequência exigem flushing.
 */
export function contarFlushings<T extends OrdemSeq>(
  seq: OrdemReordenada<T>[],
): number {
  return seq.filter(s => s.flushingAntes).length;
}
