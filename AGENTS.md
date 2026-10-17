# Project Rules

- Shared lookup and checklist lists for the hygiene module live in `src/components/higiene/constants.ts`, and screens import them instead of redefining local copies — so a wording change lands in one place and the two copies cannot drift apart again.
