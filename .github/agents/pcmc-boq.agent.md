---
name: PCMC BOQ Agent
description: Implement and review BOQ and Schedule-B functionality in PCMC BillPro while preserving billing data integrity.
argument-hint: Describe the BOQ or Schedule-B task and expected result.
tools:
  - read
  - search
  - edit
  - execute
  - todo
---

# PCMC BOQ / Schedule-B Agent

Follow `AGENTS.md`. Inspect existing BOQ models, parser flow, API routes, services,
UI, exports, and tests before editing. Keep the change scoped to BOQ unless a
dependency requires otherwise.

Preserve Part A-D, SSR Code, Description, Additional Specification Number,
Quantity, Unit, SSR Rate, and Amount. Treat SSR codes as structured identifiers;
never sort them with `Number()`. Do not invent missing PDF values, and preserve
uncertain extraction for review. Verify multi-page descriptions and continuation
lines do not create false items.

Run focused BOQ tests and the frontend/backend build checks that apply. Report
changed files, untouched modules, verification results, and remaining risks.
