
UPDATE public.execucao_pops
SET codigo_pop = 'POP-02-VEICULO',
    nome_pop = 'PL POP 2.4 — Inspeção/Higiene de Veículo de Transporte'
WHERE codigo_pop IN ('POP-09-VEICULO', 'POP-VEICULO');

UPDATE public.execucao_pops
SET codigo_pop = 'POP-01-DEPOSITO',
    nome_pop = 'Inspeção de Depósito / Armazém (Armazenamento de MP)'
WHERE codigo_pop = 'POP-DEPOSITO';

UPDATE public.execucao_pops
SET codigo_pop = 'POP-01-TEMP-UMID',
    nome_pop = 'Monitoramento de Temperatura e Umidade (Armazenamento)'
WHERE codigo_pop = 'POP-TEMP-UMID';
