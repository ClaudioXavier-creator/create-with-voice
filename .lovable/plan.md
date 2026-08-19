# Plano: Modelo de Manual BPF (Boas Práticas de Fabricação)

Este plano visa criar um modelo estruturado e digital do Manual de BPF para o sistema **Feed_BPF Custom**, baseado nas normas do MAPA (IN 04/2007 e Decreto 12.031/2024).

## 1. Estrutura do Modelo
O modelo será composto por 12 seções principais, mapeadas para os 10 POPs oficiais e os requisitos de identificação da empresa.

### Seções do Manual
1.  **Identificação e Objetivo:** Dados da empresa, responsáveis técnicos e escopo.
2.  **POP-01 - Qualificação de Fornecedores:** Critérios de seleção e recepção de MP.
3.  **POP-02 - Higiene e Sanitização:** Cronogramas de limpeza e produtos utilizados.
4.  **POP-03 - Higiene e Saúde Pessoal:** Regras de conduta, EPIs e exames médicos.
5.  **POP-04 - Potabilidade da Água:** Controle de cloro, pH e limpeza de caixas d'água.
6.  **POP-05 - Controle da Produção:** Sequenciamento, flushing e prevenção de contaminação.
7.  **POP-06 - Manutenção e Calibração:** Plano de manutenção e aferição de balanças.
8.  **POP-07 - Controle de Pragas:** Mapa de iscas e registros de aplicação.
9.  **POP-08 - Gestão de Resíduos:** Coleta, segregação e descarte ambiental.
10. **POP-09 - Rastreabilidade e Recall:** Fluxo de rastreio e plano de recolhimento.
11. **POP-10 - PAC (Programa de Autocontrole):** Monitoramento contínuo e verificações.
12. **Integridade Digital:** Selo SHA-256 conforme Decreto 12.031/2024.

## 2. Implementação Técnica

### Backend (Lovable Cloud)
*   Inserir o modelo base na tabela `public.modelos_empresa` para servir de template.
*   Garantir que os campos tenham tipos adequados (texto, data, assinatura, checklist).

### Frontend (React)
*   Criar um componente `ExemploManualBPF.tsx` que exibe a estrutura visual do manual.
*   Adicionar um botão "Importar Template de Manual" na área de modelos do Feed_BPF Custom.
*   Integrar a lógica de selo digital de `src/utils/integridade.ts` na geração do documento final.

### User Experience
*   O usuário poderá editar cada seção, anexar fotos da fábrica e assinar digitalmente.
*   O sistema alertará se algum POP obrigatório estiver faltando no manual.

## Detalhes Técnicos
*   **Arquivos impactados:**
    *   `src/config/manualBpfContent.ts` (definição dos textos padrão).
    *   `src/pages/feedbpfcustom/MeusModelos.tsx` (interface de criação).
    *   `src/utils/integridade.ts` (selo digital).
*   **Segurança:** RLS garante que cada empresa acesse apenas seu próprio manual customizado.
