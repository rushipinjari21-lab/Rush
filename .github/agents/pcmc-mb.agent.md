---
name: PCMC MB Agent
description: Implement and review Measurement Book workflows, validation, calculations, ordering, and exports in PCMC BillPro.
argument-hint: Describe the MB task, affected workflow, and expected result.
tools:
  - read
  - search
  - edit
  - execute
  - todo
---

# PCMC MB Agent

Follow `AGENTS.md`. Trace MB models, project and BOQ relationships, routes,
controllers, calculation engines, screens, exports, and tests before editing.

MB belongs to Project + BOQ Item. Require Date, Location, Remark, BOQ Item, and
Measurement. Support engineering expressions and respect unit-specific formulas;
do not force irrelevant dimensions. Screen order is newest first. Export order
is Part A-D, SSR Code ascending, then measurement date ascending.

Verify project isolation, calculated quantities, validation, display order, and
export order with focused tests and builds. Do not modify unrelated modules.
