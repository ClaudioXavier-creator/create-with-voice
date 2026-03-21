export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  responsavelTecnico: string;
  crmv: string;
  tipoProducao: string[];
  capacidade: string;
}

export interface POP {
  id: string;
  codigo: string;
  nome: string;
  versao: string;
  dataRevisao: string;
  responsavel: string;
  status: "ativo" | "em_revisao" | "obsoleto";
}

export interface ChecklistItem {
  id: string;
  area: string;
  item: string;
  conforme: boolean | null;
  observacao: string;
}

export interface NaoConformidade {
  id: string;
  data: string;
  setor: string;
  descricao: string;
  causa: string;
  acaoCorretiva: string;
  responsavel: string;
  prazo: string;
  status: "aberta" | "em_andamento" | "fechada";
}

export interface RecebimentoMP {
  id: string;
  data: string;
  fornecedor: string;
  materiaPrima: string;
  lote: string;
  odor: "normal" | "anormal";
  umidade: string;
  insetos: "ausente" | "presente";
  aprovado: boolean;
}

export interface Producao {
  id: string;
  data: string;
  produto: string;
  lote: string;
  operador: string;
  tempoMistura: string;
  quantidade: string;
}

export interface Rastreabilidade {
  id: string;
  produto: string;
  loteProduto: string;
  materiaPrima: string;
  loteMP: string;
  fornecedor: string;
}

export interface Treinamento {
  id: string;
  funcionario: string;
  treinamento: string;
  data: string;
  instrutor: string;
  validade: string;
}

export interface ControlePraga {
  id: string;
  data: string;
  local: string;
  tipoPraga: string;
  acao: string;
  responsavel: string;
}
