# Project Rules

- Remote MCP tools are read-only, verify delegated OAuth tokens and use a caller-scoped client; company record queries require explicit company authorization and an active product license to preserve app boundaries.
- OAuth consent uses the existing auth screen with canonical local return paths across all offered login and signup methods; browser tools stay in the screens owning their visible controls, separate from the remote MCP catalog.

- Fixed POP module checklists, catalogs and lookup lists live in `src/components/<module>/constants.ts`, and screens import them instead of keeping local copies — one source prevents drift; preserve separate module-specific variants when content differs.
- Every new legal citation must come from `src/config/baseLegal.ts` through its typed registry and citation helpers; preserve synchronous subject resolution for exports and the existing hook's company/global document lookup so citations remain centralized and network-independent.
- Screens show supported legal citations only through BaseLegalBadge; display-only neutralization must never change stored values, document templates, exports, or the legislation library.
- Medicated production orders are gated both in the PCP screen and by a database trigger on ordens_producao; keep both in sync so the rule holds even outside the UI.
