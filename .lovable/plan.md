# Plano de Implementação: Gestão de POPs e Versionamento por IA

Este plano descreve as melhorias na gestão de POPs e Manual, incluindo a integração de geração por IA, versionamento e fluxos diferenciados por plano de licenciamento.

## Alterações Propostas

### 1. Versionamento e Gestão de Documentos
- **Versionamento Automático:** Implementar lógica para que cada POP e o Manual gerado pela IA sejam salvos com controle de versão (v1, v2, etc.) na tabela `arquivos_bpf`.
- **Organização por POP:** Garantir que uploads de planilhas e documentos gerados fiquem estritamente vinculados ao seu respectivo código de POP (`pop_codigo`).
- **Histórico de Revisões:** Adicionar visualização de histórico na aba de cada POP na tela de Planilhas de POPs.

### 2. Fluxos por Plano de Licenciamento (TierGate)
- **Plano Entrada:**
  - Desabilitar preenchimento digital de formulários (Registros Digitais Customizados).
  - Manter apenas download de planilhas em branco e upload de documentos escaneados.
- **Plano Intermediário:**
  - Implementar seletor de "Modo de Preenchimento" (Digital ou Upload) configurável por POP.
  - Limite sugerido: 50-60% dos POPs configurados para preenchimento digital, o restante via upload, conforme preferência do RT.
- **Plano Avançado:**
  - Acesso total a preenchimento digital em todos os POPs e geração via IA.

### 3. Interface de Geração por IA
- **Assistente de Geração:** Criar/Refinar a interface de geração de POPs via IA, permitindo salvar o resultado diretamente no acervo do POP correspondente como uma nova versão.

## Detalhes Técnicos

### Banco de Dados
- **Tabela `arquivos_bpf`:** Usar o campo `versao` (se existir) ou adicionar metadado de versão no JSON de metadados.
- **Tabela `empresas` / `configuracoes_bpf`:** Adicionar campo para armazenar a preferência de modo de preenchimento por POP (ex: `config_modos_preenchimento: Record<string, 'digital' | 'upload'>`).

### Componentes
- **`PlanilhasPop.tsx`:** Atualizar para exibir o seletor de modo e a lista de versões/histórico.
- **`AnexarPlanilhaPop.tsx`:** Ajustar para facilitar o upload direto vinculado ao POP selecionado.
- **`TierGate.tsx`:** Refinar a lógica de `hybrid` para suportar as novas regras de 50-60%.

## Próximos Passos
1. Criar migração para campos de configuração de preenchimento.
2. Atualizar `TierGate.tsx` com as novas restrições de planos.
3. Implementar a interface de versionamento em `PlanilhasPop.tsx`.
