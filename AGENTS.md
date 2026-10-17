# Project Rules

- Fixed POP module checklists, catalogs and lookup lists live in `src/components/<module>/constants.ts`, and screens import them instead of keeping local copies — one source prevents drift; preserve separate module-specific variants when content differs.
