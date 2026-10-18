# Fase 1B — Citações nas telas

- [ ] Criar botão único de base legal e neutralizar citações na apresentação, preservando documentos e dados.
- [ ] Conferir telas, popover, build e listar referências preservadas.

Sem banco, Edge Functions ou publicação.

# Fase 1 — Fonte única de legislação

- [x] Criar base legal tipada e hook com reserva síncrona (14 assuntos).
- [x] Substituir citações dos assuntos autorizados nos arquivos indicados, preservando outras normas e lógica (ControleSubstancias sem mudança: apenas normas fora da lista).
- [x] Rodar testes existentes, verificar build e listar arquivos e citações fora do escopo (22 testes unitários passaram; 3 testes antigos de rótulos falharam; suíte E2E bloqueada por Chromium incompatível; verificação com sessão real passou em rotulagem, relatório mensal e fornecedores).

Sem banco, Edge Functions ou publicação.

# Revisão dos textos de identificação e integridade

- [x] Corrigir as alegações nos nove arquivos solicitados, sem mudar campos, registros ou hashes (34 substituições).
- [x] Listar cada texto antes/depois, conferir o conteúdo imprimível do PDF e confirmar build (build OK; relatório com sessão ativa, sem erros; hashes idênticos); não publicar.

---

# Normalização dos códigos de POP (DocumentosBPF)

- [x] Mover `normalizarPopCodigo()` para util compartilhado e reaproveitar no checklist e em DocumentosBPF.
- [x] Trocar a lista `POP_CODIGOS` de `POP-001…POP-010` para `POP-01…POP-10` e normalizar o filtro por código.
- [x] Confirmar build, tipos e teste; listar arquivos alterados (build OK, tsgo limpo, 3 testes).

Não alterar banco, registros salvos nem publicar.

---

# Unificação das listas dos POPs

- [x] Identificar listas fixas locais e eventuais diferenças, preservando o conteúdo das telas.
- [x] Centralizar listas nos arquivos de constantes de cada módulo e remover cópias/imports sem uso.
- [x] Verificar preservação do conteúdo, conferir build e listar os arquivos alterados (32 declarações idênticas; build OK; formulários de Pragas e Resíduos abertos sem erros).

Não alterar banco, registros, regras de negócio nem publicar.