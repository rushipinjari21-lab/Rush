# PCMC BillPro

## Repository layout

- `frontend/`: Vite + React web application and Capacitor Android wrapper.
- `backend/`: Express API, MySQL access, billing calculations, document and PDF services.

## Frontend commands

Run commands from `frontend/`:

```powershell
npm run dev
npm run build
npm run preview
```

The Vite development server uses port `5173` and proxies `/api` to `http://localhost:5000`.

## Backend commands

Run commands from `backend/`:

```powershell
npm run dev
npm start
npm test
```

The backend requires its environment variables and MySQL configuration before starting.

## Android APK

The Android project is `frontend/android/` and uses Capacitor app ID `com.pcmc.billpro`.

After installing Android Studio, Android SDK tools, and JDK 17:

```powershell
cd frontend
$env:VITE_API_URL = "http://<computer-ip>:5000/api"
npm run build
npx cap sync android
npx cap build android
```

Use the computer's LAN IP, not `localhost`, when the APK must connect to a
backend running on the development computer. The backend port must also be
allowed through Windows Firewall.

The debug APK is written to:

```text
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

Keep `base: './'` in `frontend/vite.config.js`; the relative asset paths are required when the Vite build runs inside the Android WebView.

## Change guidelines

- Keep frontend and backend changes scoped to their owning application.
- Reuse existing React, Material UI, Express, validation, and calculation patterns.
- Run the narrowest relevant build or test after changes.
- Do not commit generated build output unless explicitly requested.

## Required Task Workflow

For every implementation task, follow this order:

```text
READ FILE
	↓
SEARCH CODE
	↓
UNDERSTAND DEPENDENCIES
	↓
PLAN
	↓
EDIT FILE
	↓
RUN TERMINAL
	↓
RUN TESTS
	↓
CHECK BUILD
	↓
REVIEW CHANGES
	↓
REPORT
```

Do not skip repository inspection, focused verification, or review of the
resulting changes. Record actual command results in the final report.

## Agent Approval Workflow

```text
USER
			    │
			    ▼
		 ┌─────────────────┐
		 │ PCMC PLANNER    │
		 │ Read-only       │
		 └────────┬────────┘
			    │
		     Plan approved
			    │
			    ▼
		 ┌─────────────────┐
		 │ PCMC ENGINEER   │
		 │ Edit + Execute  │
		 └────────┬────────┘
			    │
		    Implementation
			    │
			    ▼
		 ┌─────────────────┐
		 │ PCMC REVIEWER   │
		 │ Verify + Test   │
		 └────────┬────────┘
			    │
			PASS / FAIL
```

The Planner must remain read-only. The Engineer implements only the approved
scope. The Reviewer independently verifies correctness, regressions, security,
data integrity, and test evidence before the task is considered complete.

## AI Engineering Rules

PCMC BillPro is an existing production-oriented municipal civil-work billing
system for Pimpri Chinchwad Municipal Corporation (PCMC). Do not rebuild it
from scratch, create a demo application, or replace working modules without
proving that replacement is necessary.

### Inspect Before Modifying

Before changing code:

1. Inspect the repository structure.
2. Identify the relevant module.
3. Search references to affected functions, types, database tables, routes, and screens.
4. Understand dependencies and determine whether the implementation works.
5. Make the smallest safe change.
6. Run appropriate tests and build checks.

### Scope

Every task must have an explicit scope. Keep changes limited to the affected
module and related types or tests. Do not change MB, RA Bills, authentication,
projects, or the database for an unrelated BOQ task unless the dependency is
explained first.

### BOQ and Schedule-B

BOQ is the master source for billing. Preserve Part A, Part B, Part C, Part D,
SSR Code, Description, Additional Specification Number, Quantity, Unit, SSR
Rate, and Amount.

- Treat SSR codes as structured identifiers; never sort them with `Number()`.
- Preserve uncertain extracted text and mark it for review instead of inventing values.
- Join multi-page descriptions correctly.
- Do not turn continuation text into a new item unless the PDF structure proves it is new.

### Project Isolation

Project data must remain isolated. Verify `projectId` filtering whenever
changing queries. This applies to BOQ, MB, RA Bills, contractors, documents,
reports, and quantity variations.

### Measurement Books

MB belongs to a project and BOQ item. Valid records require Date, Location,
Remark, BOQ Item, and Measurement. Measurements must support engineering
expressions such as `1 x 0.1 x 0.6` and respect the BOQ unit.

- For CUM, quantity is `N x L x B x H`.
- Do not force irrelevant dimensions for units that do not use them.
- Screen display order is newest first by measurement date.
- Export order is Part A through Part D, SSR Code ascending, then measurement date ascending.

### RA Bills

RA Bills are generated from MB progression: MB-1 to RA Bill-1, MB-2 to RA
Bill-2, and so on. Do not duplicate quantities between bills. Calculate current
and cumulative quantities according to the existing billing design. Do not
redesign Dakhala templates unless explicitly requested.

### Database and API Safety

Before modifying models or schema, inspect foreign keys, MB references, RA Bill
references, project references, existing records, and migrations. Before
changing an API, find frontend callers, backend routes, controllers, services,
and model usage. Maintain backward compatibility where practical.

### Security

Never expose or commit passwords, JWT secrets, database credentials, API keys,
encryption keys, Android signing keys, or private certificates. Never print
secrets in logs or hard-code credentials. Validate input and respect role-based
authorization.

### PDF Parsing

PDF parsing must be evidence-driven; extraction order is not necessarily visual
order. For Schedule-B, identify page, Part, SSR code, description, quantity,
unit, rate, amount, continuation lines, and validate the resulting row. Mark
uncertain fields for review instead of guessing.

Trace the complete PDF-to-screen flow:

```text
PDF
 ↓
pdfParser.ts
 ↓
ParsedBoqItem
 ↓
BOQ storage
 ↓
Database
 ↓
BoqScreen
```

Map each conceptual step to the repository's actual file, type, model, route,
service, and screen before modifying parser behavior.

### Error Handling and UI

- Never use empty catch blocks, silent fallbacks, arbitrary defaults, or fake data to hide errors.
- Errors must identify the module, operation, affected record, and root cause.
- Preserve the existing architecture and keep the UI responsive, accessible, professional, consistent, and suitable for municipal engineering workflows.
- Do not redesign unrelated screens during a bug fix.

### Testing

After meaningful changes, run relevant unit tests, compiler checks where
applicable, the production build, backend checks where applicable, and the
affected workflow. For BOQ changes verify SSR Code, Description, Quantity,
Unit, Rate, Amount, and Part. For MB changes verify Date, Location, Remark,
BOQ item, Measurement, and calculated quantity. For RA Bill changes verify MB
mapping, current quantity, cumulative quantity, and bill number. Use real
Schedule-B PDFs for parser changes whenever available.

### Git Safety

Before major modifications, inspect git status. Do not overwrite unrelated
user changes, reset the repository, delete files unless explicitly required,
or use destructive git commands.

### Completion Report

After completing a task, report:

#### Changed

- File and what changed.
- Reason for the change.

#### Not Changed

- Important modules deliberately left untouched.

#### Verification

- Tests, build, and lint/typecheck actually executed.

#### Risks

- Remaining uncertainty, parser review items, or migration concerns.

Never claim a test passed unless it was actually executed.
