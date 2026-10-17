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