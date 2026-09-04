# Plano: Visualizar e Editar Arquivos/Dados da Supabase em Todos os Projetos

## Objetivo
Dar ao Cláudio uma forma segura e centralizada de:
1. Ver e editar **arquivos do Storage** (buckets, PDFs, documentos, modelos).
2. Ver e editar **dados das tabelas** do banco.
3. Fazer isso em **todos os projetos** do workspace (BPFConsult, Agro CRM, AUDITS_BPF, Agent Hub Pro, etc.).
4. Oferecer tanto **interface visual no app** quanto **acesso técnico/documentado**.

## Contexto Atual (confirmado)

### Projetos no workspace (11)
- Sweet Greetings App
- Agro CRM
- AUDITS_BPF
- Agro CRM Demo
- Agro RC Access
- BPF Site Sync
- Voice On High
- My Project Hub
- Agent Hub Pro
- My Program Hub
- Hello Friend

### Buckets de Storage no projeto atual (BPFConsult)
- `database_export_17_07_26`
- `database_export_24_07_26`
- `documentos_bpf`
- `documentos-bpf`
- `feed-bpf`
- `normas_legislacao`
- `relatorios`

### Tabelas públicas no projeto atual
Mais de 90 tabelas, incluindo `arquivos_bpf`, `documentos_bpf`, `empresas`, `profiles`, `user_roles`, etc.

## Decisões de Design

### 1. Acesso Técnico (imediato, sem código)
- Documentar os comandos seguros para consultar/listar arquivos e dados usando as ferramentas já disponíveis (`supabase--read_query`, `supabase--run_sql`, storage via Supabase client).
- Nunca expor `service_role` no frontend.
- Para Storage, usar a API do Supabase com `supabase.storage.from(bucket).list()` e `.upload()` — sempre dentro de rotas protegidas.

### 2. Painel Visual no App
Criar uma nova rota protegida `/admin/storage-db` (apenas para `admin`) com duas abas:
- **Storage**: listar buckets, navegar em pastas, fazer upload/download, deletar arquivos.
- **Banco de Dados**: selecionar tabela, listar registros, editar inline, deletar, inserir novo.

### 3. Cross-Project
Criar uma página `/admin/projetos` que lista todos os projetos do workspace com links diretos para cada um. Isso evita depender de URLs soltas.

## Implementação

### Fase 1 — Acesso Técnico Documentado
- Criar documento interno `/docs/acesso-supabase.md` com exemplos de:
  - Listar buckets e arquivos via Supabase client.
  - Consultar tabelas via SQL.
  - Atualizar/deletar dados via SQL (com RLS considerations).
  - Upload/download de arquivos.

### Fase 2 — Painel de Storage e Banco
- Criar componente `src/pages/admin/StorageDbAdmin.tsx`.
- Criar sub-componentes:
  - `StorageExplorer.tsx`: navegação de buckets/pastas, upload, delete.
  - `DbTableEditor.tsx`: seleção de tabela, paginação, edição inline.
- Adicionar rota em `src/App.tsx` dentro de `ProtectedRoute` + `LicenseGate`, restrita a `has_role(auth.uid(), 'admin')`.
- Usar `useEmpresa` para filtrar dados por `empresa_id` quando aplicável.

### Fase 3 — Central de Projetos
- Criar `src/pages/admin/ProjetosAdmin.tsx`.
- Consumir lista de projetos (mock inicial, depois integração com workspace API se disponível).
- Exibir cards com nome, descrição, URL publicado e link para abrir.

### Fase 4 — Segurança e Auditoria
- Garantir que apenas `admin` acesse o painel.
- Logar ações em `audit_log` (quem visualizou/editou/deletou o quê).
- Confirmar RLS em todas as tabelas tocadas.

## Escopo Fora deste Plano
- Não criar um CMS completo com permissões granulares por módulo.
- Não replicar o painel da Supabase.
- Não alterar RLS ou políticas existentes sem aprovação separada.

## Critérios de Aceitação
- [ ] Cláudio consegue abrir `/admin/storage-db` e ver buckets/arquivos.
- [ ] Cláudio consegue selecionar uma tabela e editar um registro.
- [ ] Apenas usuários com role `admin` acessam o painel.
- [ ] Ações de edição/deleção são logadas em `audit_log`.
- [ ] A página `/admin/projetos` lista todos os projetos do workspace.
