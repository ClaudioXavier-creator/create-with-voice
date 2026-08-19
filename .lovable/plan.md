# Plano de Implementação: Gestão de POPs e Versionamento por IA

Este plano descreve as melhorias na gestão de POPs e Manual, incluindo a integração de geração por IA, versionamento real e fluxos diferenciados por plano de licenciamento.

## Alterações Propostas

### 1. Banco de Dados e Versionamento
- **Nova Coluna de Versão:** Adicionar coluna `versao` (INTEGER ou TEXT) na tabela `arquivos_bpf`. Isso permitirá filtrar e ordenar versões de forma eficiente, evitando o uso de JSON para metadados críticos.
- **Histórico no Storage:** Ajustar a lógica de `storagePath` para garantir que o versionamento não sobrescreva arquivos anteriores. Embora o timestamp já ajude, garantiremos que cada versão tenha um identificador único no path (ex: `.../v1/...`, `.../v2/...`).
- **Padrão de Nomenclatura:** Refinar o `nomenclaturaDoc.ts` para incluir o sufixo de versão.

### 2. Gestão de POPs e Manual (IA)
- **Salvamento por POP:** Todo POP ou Manual gerado por IA será salvo automaticamente no acervo do respectivo POP (`pop_codigo`).
- **Fluxo de Atualização:** Ao gerar uma nova versão via IA, o sistema incrementará a coluna `versao` e manterá a anterior como "histórico".

### 3. Fluxos por Tier de Licença (TierGate)
- **Plano Entrada:**
  - Lançamento digital desabilitado.
  - Apenas download de planilhas em branco e upload de documentos escaneados.
- **Plano Intermediário:**
  - **Modo Híbrido Flexível:** O RT ou Proprietário pode escolher quais POPs (entre 50% a 60% do total) terão preenchimento digital habilitado. Os demais seguem o fluxo de upload.
  - Adicionar configuração de `modo_preenchimento` por POP na tabela `empresas`.
- **Plano Avançado:**
  - Acesso total e irrestrito a todos os recursos digitais e IA.

### 4. Interface e UI
- **Central de Documentos:** Integrar a visualização de versões na aba de cada POP em `PlanilhasPop.tsx`.
- **Seletor de Modo (Intermediário):** Interface administrativa para o RT configurar o modo de preenchimento de cada POP.

## Detalhes Técnicos

### Migrações SQL
1. `ALTER TABLE public.arquivos_bpf ADD COLUMN versao INTEGER DEFAULT 1;`
2. `ALTER TABLE public.empresas ADD COLUMN config_modos_preenchimento JSONB DEFAULT '{}';`

### Componentes Afetados
- `src/utils/nomenclaturaDoc.ts`: Incluir versão no path.
- `src/components/TierGate.tsx`: Lógica de 50-60% para plano intermediário.
- `src/pages/PlanilhasPop.tsx`: Exibição de histórico e botões de ação diferenciados.

## Próximos Passos
1. Executar a migração para a nova coluna de versão.
2. Atualizar a lógica de upload para respeitar o versionamento.
3. Implementar a restrição de 50-60% no `TierGate`.
