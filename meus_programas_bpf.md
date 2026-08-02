# Relatório de Programas, Nomes Genéricos e Repositórios

Este documento lista todos os programas desenvolvidos sob a marca **BPF_Consult**, seus nomes genéricos (usados internamente no banco de dados e URLs) e os respectivos repositórios GitHub conectados (quando aplicável).

## 1. Programas e Nomes Genéricos

| Nome Comercial | Nome Genérico (ID) | Descrição / Objetivo |
| :--- | :--- | :--- |
| **Feed_BPF** | `feedbpf` | Gestão completa de BPF (IN 04/2007) para fábricas de ração. |
| **Feed_BPF Custom** | `feedbpfcustom` | Versão customizável do Feed_BPF para consultores e indústrias. |
| **Audits_BPF** | `auditsbpf` | Sistema de auditorias, checklists e planos de ação (5W2H). |
| **Agro RC CRM** | `agrorc` | CRM especializado para Representantes Comerciais do Agronegócio. |
| **NutriCRM** | `nutricrm` | CRM técnico e comercial focado em Nutrição Animal e Especialidades. |
| **AgroGestão CRM** | `agrogestao` | Gestão comercial e técnica robusta para canais de distribuição agro. |
| **Nutri_Agro Labels** | `nutriagro_labels` | Gerador técnico de rótulos e Fichas Técnicas (RTPI). |
| **Portal de Gestão** | `superadmin` | Painel administrativo central da BPF_Consult. |

## 2. Repositórios GitHub

Os projetos estão conectados a repositórios no GitHub através da integração com o Lovable.

- **Repositório Principal (Monorepo):** `https://github.com/clxn/bpf-consult-main`
  - *Contém:* A interface principal unificada, lógica de licenciamento central, Portal de Gestão e os módulos `Feed_BPF` e `Feed_BPF Custom`.
- **Repositórios de Projetos Externos (Micro-frontends):**
  - **NutriCRM:** `https://github.com/clxn/nutricrm-app`
  - **Agro RC CRM:** `https://github.com/clxn/agro-rc-crm`
  - **Audits_BPF:** `https://github.com/clxn/audits-bpf-v2`
  - **AgroGestão CRM:** `https://github.com/clxn/agrogestao-crm-core`

## 3. Estrutura de Licenciamento

Internamente, a tabela `public.licencas` utiliza os **Nomes Genéricos (ID)** para controlar o acesso. Sempre que for liberar um acesso manual, utilize os códigos da coluna "Nome Genérico (ID)" acima para evitar erros de permissão.

---
*Gerado automaticamente para Cláudio Luiz Xavier Nunes em 02/08/2026.*
