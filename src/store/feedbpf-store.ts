import { useState } from "react";
import type {
  Empresa, POP, ChecklistItem, NaoConformidade, RecebimentoMP,
  Producao, Rastreabilidade, Treinamento, ControlePraga
} from "@/types/feedbpf";

const SETORES = [
  "Recebimento", "Armazenamento", "Moagem", "Mistura",
  "Peletização", "Ensacamento", "Expedição", "Laboratório",
  "Área externa", "Manutenção"
];

const CHECKLIST_PADRAO: ChecklistItem[] = [
  { id: "1", area: "Estrutura", item: "Piso íntegro e lavável", conforme: null, observacao: "" },
  { id: "2", area: "Estrutura", item: "Paredes sem rachaduras", conforme: null, observacao: "" },
  { id: "3", area: "Estrutura", item: "Iluminação adequada", conforme: null, observacao: "" },
  { id: "4", area: "Estrutura", item: "Ventilação suficiente", conforme: null, observacao: "" },
  { id: "5", area: "Estrutura", item: "Telas em aberturas", conforme: null, observacao: "" },
  { id: "6", area: "Higiene", item: "Equipamentos limpos", conforme: null, observacao: "" },
  { id: "7", area: "Higiene", item: "Ausência de resíduos no chão", conforme: null, observacao: "" },
  { id: "8", area: "Higiene", item: "Uso de EPIs pelos colaboradores", conforme: null, observacao: "" },
  { id: "9", area: "Higiene", item: "Lixeiras identificadas e tampadas", conforme: null, observacao: "" },
  { id: "10", area: "Higiene", item: "Sanitários limpos e abastecidos", conforme: null, observacao: "" },
  { id: "11", area: "Controle de Pragas", item: "Armadilhas instaladas e identificadas", conforme: null, observacao: "" },
  { id: "12", area: "Controle de Pragas", item: "Monitoramento registrado", conforme: null, observacao: "" },
  { id: "13", area: "Controle de Pragas", item: "Ausência de sinais de roedores", conforme: null, observacao: "" },
  { id: "14", area: "Controle de Pragas", item: "Ausência de aves na fábrica", conforme: null, observacao: "" },
  { id: "15", area: "Armazenamento", item: "Matérias-primas identificadas", conforme: null, observacao: "" },
  { id: "16", area: "Armazenamento", item: "Sistema FIFO implementado", conforme: null, observacao: "" },
  { id: "17", area: "Armazenamento", item: "Estrados em bom estado", conforme: null, observacao: "" },
  { id: "18", area: "Armazenamento", item: "Produtos afastados das paredes", conforme: null, observacao: "" },
  { id: "19", area: "Produção", item: "Sequência de produção correta", conforme: null, observacao: "" },
  { id: "20", area: "Produção", item: "Controle de tempo de mistura", conforme: null, observacao: "" },
  { id: "21", area: "Produção", item: "Flushing realizado quando necessário", conforme: null, observacao: "" },
  { id: "22", area: "Produção", item: "Registros de produção preenchidos", conforme: null, observacao: "" },
  { id: "23", area: "Rastreabilidade", item: "Lotes identificados corretamente", conforme: null, observacao: "" },
  { id: "24", area: "Rastreabilidade", item: "Registro de origem de MP", conforme: null, observacao: "" },
  { id: "25", area: "Documentação", item: "POPs atualizados e acessíveis", conforme: null, observacao: "" },
  { id: "26", area: "Documentação", item: "Manual BPF disponível", conforme: null, observacao: "" },
  { id: "27", area: "Documentação", item: "Treinamentos registrados", conforme: null, observacao: "" },
];

const DEMO_NCS: NaoConformidade[] = [
  { id: "1", data: "2026-03-15", setor: "Moagem", descricao: "Presença de resíduos no moinho", causa: "Falta de limpeza pós-turno", acaoCorretiva: "Limpeza imediata e reciclagem do POP", responsavel: "João Silva", prazo: "2026-03-17", status: "fechada" },
  { id: "2", data: "2026-03-18", setor: "Armazenamento", descricao: "Sacos sem identificação de lote", causa: "Falha no processo de recebimento", acaoCorretiva: "Identificação retroativa e treinamento", responsavel: "Maria Santos", prazo: "2026-03-22", status: "em_andamento" },
  { id: "3", data: "2026-03-20", setor: "Área externa", descricao: "Armadilha de roedores danificada", causa: "Desgaste natural", acaoCorretiva: "Substituição da armadilha", responsavel: "Pedro Oliveira", prazo: "2026-03-25", status: "aberta" },
];

export function useChecklistItems() {
  return useState<ChecklistItem[]>(CHECKLIST_PADRAO);
}

export function useNaoConformidades() {
  return useState<NaoConformidade[]>(DEMO_NCS);
}

export function useRecebimentos() {
  return useState<RecebimentoMP[]>([
    { id: "1", data: "2026-03-19", fornecedor: "AgroCorp", materiaPrima: "Milho grão", lote: "MC-2026-041", odor: "normal", umidade: "12.5%", insetos: "ausente", aprovado: true },
    { id: "2", data: "2026-03-20", fornecedor: "NutriMax", materiaPrima: "Farelo de soja", lote: "FS-2026-088", odor: "normal", umidade: "11.2%", insetos: "ausente", aprovado: true },
  ]);
}

export function useProducao() {
  return useState<Producao[]>([
    { id: "1", data: "2026-03-20", produto: "Ração Bovino Engorda", lote: "RBE-0320-01", operador: "Carlos Ferreira", tempoMistura: "8 min", quantidade: "5.000 kg" },
    { id: "2", data: "2026-03-20", produto: "Suplemento Mineral", lote: "SM-0320-01", operador: "Ana Costa", tempoMistura: "12 min", quantidade: "2.000 kg" },
  ]);
}

export function useTreinamentos() {
  return useState<Treinamento[]>([
    { id: "1", funcionario: "João Silva", treinamento: "BPF - Boas Práticas", data: "2026-01-15", instrutor: "Dr. Cláudio", validade: "2027-01-15" },
    { id: "2", funcionario: "Maria Santos", treinamento: "Segurança do Trabalho", data: "2026-02-10", instrutor: "Eng. Roberto", validade: "2027-02-10" },
    { id: "3", funcionario: "Pedro Oliveira", treinamento: "Operação de Misturador", data: "2025-06-20", instrutor: "Dr. Cláudio", validade: "2026-06-20" },
  ]);
}

export { SETORES, CHECKLIST_PADRAO };
