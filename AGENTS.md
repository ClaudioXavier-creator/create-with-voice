# Project Rules

- Fixed POP module checklists, catalogs and lookup lists live in `src/components/<module>/constants.ts`, and screens import them instead of keeping local copies — one source prevents drift; preserve separate module-specific variants when content differs.
- Legal references for supported subjects resolve through the typed synchronous baseLegal registry; the hook delegates to it until slug-based merging is implemented, keeping exports independent of React and network availability.
- Screens show supported legal citations only through BaseLegalBadge; display-only neutralization must never change stored values, document templates, exports, or the legislation library.
