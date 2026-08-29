---
applyTo: "src/**/*.{ts,tsx,js,jsx}"
---

# PCMC BillPro Frontend Rules

Inspect existing components before creating new ones.

Reuse existing types and contexts.

Do not duplicate business logic inside UI components.

BOQ screens must preserve:

- Part A-D
- SSR Code
- Description
- Quantity
- Unit
- Rate
- Amount

MB screen:

- newest measurements first
- Date mandatory
- Location mandatory
- Remark mandatory

Do not modify unrelated screens.
