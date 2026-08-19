# CONTEXT.md — Pace Pharmacy Account Setup Frontend

> Read this file before making changes. Update it when architecture, workflows, APIs, or development practices change.
> Derived from the repository as of the current codebase. Do not invent backend behavior that is not evidenced here.

---

## 1. What this project is

**Pace Pharmacy** (`pace-pharmacy`) is a **frontend-only React SPA** for professional account onboarding with Pace Pharmacy (compounding pharmacy, Toronto locations).

It solves two problems:

1. **New Account Setup** — multi-step wizard where a healthcare professional applies for a professional ordering account (location, account info, payment, acknowledgements, medical director, review/submit).
2. **Medical Director Authorization** — separate flow where a medical director opens a link with a **reference code** and authorizes an existing application (prescription requirements + consent).

There is **no backend, database, or auth system in this repo**. The UI talks to an external HTTP API via `VITE_API_URL`.

App version meta tag in `index.html` may lag git tags/commits (e.g. commits reference `v1.1.0` while `index.html` may still say `1.0.8`).

---

## 2. Architecture overview

```
Browser (Vite/React SPA)
  ├─ TanStack Router (file-based routes → routeTree.gen.ts)
  ├─ TanStack Query (API fetch/mutate for account + application)
  ├─ sessionStorage (wizard form drafts via useSessionStorage)
  ├─ Zustand (uploaded File[] — not serializable to sessionStorage)
  └─ Axios → VITE_API_URL (default http://localhost:3000/api)
        ├─ POST /account          (multipart FormData)
        ├─ GET  /application?referenceCode=...
        └─ POST /application      (JSON authorization submit)
```

**Layout pattern**

| Layer | Role |
|--------|------|
| `src/routes/*` | Thin TanStack Router file routes; usually import a view |
| `src/views/*` | Page UI, forms, Zod schemas, submit logic |
| `src/views/_api.ts`, `src/views/account-setup/_api.ts` | API client functions |
| `src/components/*` | Shared UI (sidebar stepper, footer buttons, shadcn/ui) |
| `src/lib/Axios.ts` | Shared Axios instance |
| `src/constants` | `sessionStorage` key names |

**Path layouts (underscore prefixes = pathless layout routes)**

- `/_form` — wizard chrome (sidebar + scroll area) for `/location`, `/account`, `/payment`, `/acknowledgements`, `/medical-director`, `/review`
- `/_account` — simpler chrome for `/account-setup/...`
- `/` redirects to `/location`
- `/submitted` — post-submit success for new accounts
- `/account-setup/$code/submitted` — post-submit success for medical director auth

---

## 3. Project structure

```
pace-pharmacy/
├── public/                 # Static assets (logo, favicon, Enzyme.otf font)
├── src/
│   ├── main.tsx            # App bootstrap, RouterProvider
│   ├── index.css           # Tailwind v4 + theme tokens (theme-green, Enzyme)
│   ├── routeTree.gen.ts    # AUTO-GENERATED — do not edit
│   ├── assets/
│   ├── components/
│   │   ├── ui/             # shadcn/ui primitives (new-york style)
│   │   ├── sidebar/        # Wizard step indicator
│   │   ├── footer-buttons.tsx
│   │   ├── head-title.tsx
│   │   └── input-with-mask.tsx  # react-imask wrappers (phone, card, etc.)
│   ├── constants/index.ts  # SESSION_KEYS
│   ├── hooks/use-session-storage.tsx
│   ├── lib/Axios.ts, utils.ts (cn)
│   ├── routes/             # File-based routing only
│   ├── types/common.api.ts # ApiResponse success/error union
│   └── views/              # Feature screens + schemas + APIs
│       ├── _api.ts         # createAccount, getErrorMessage, buildErrorReport
│       ├── _types.ts       # Aggregated AccountRequest types
│       ├── location.tsx
│       ├── account/        # Account step + _components/*
│       ├── payment.tsx
│       ├── acknowledgements.tsx
│       ├── medical-director.tsx
│       ├── review.tsx      # Assembles payload + submits
│       └── account-setup/  # Medical director authorization flow
├── Dockerfile              # Multi-stage: npm build → nginx:alpine
├── docker-compose.yml      # Serves on host port 4001
├── default.conf            # nginx SPA try_files
├── vercel.json             # Vercel SPA rewrite to index.html
├── vite.config.ts          # Port 4001, @ alias, TanStack Router plugin
├── components.json         # shadcn config
├── package.json
├── pnpm-lock.yaml          # Present locally; also listed in .gitignore
└── README.md               # Still default Vite template (not product docs)
```

**Important files**

| File | Purpose |
|------|---------|
| `src/routeTree.gen.ts` | Generated route tree; overwritten by TanStack Router |
| `src/lib/Axios.ts` | API base URL + 30s timeout |
| `src/constants/index.ts` | Session key contract for the wizard |
| `src/views/account/_components/form-schema.tsx` | Zod schema for account step |
| `src/views/account/_components/documents-store.ts` | Zustand store for upload Files |
| `src/views/review.tsx` | Final submit orchestration |
| `src/views/account-setup/*` | Authorization by reference code |

---

## 4. Technologies and tools

| Area | Choice |
|------|--------|
| Language | TypeScript (~5.9), `strict` |
| UI | React 19, Vite 7 |
| Routing | `@tanstack/react-router` + `@tanstack/router-plugin` / `router-cli` |
| Data fetching | `@tanstack/react-query` |
| Forms | `react-hook-form` + `@hookform/resolvers` + **Zod v4** |
| HTTP | `axios` |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), `tw-animate-css` |
| Components | shadcn/ui (Radix primitives), `class-variance-authority`, `clsx`, `tailwind-merge` |
| Icons | `lucide-react` |
| Toasts | `sonner` (+ `next-themes` imported by sonner wrapper; no full theme switcher app-wide) |
| Masked inputs | `react-imask` |
| Client state | `zustand` (documents only); `sessionStorage` for wizard drafts |
| Lint | ESLint 9 flat config (`eslint.config.js`) — recommended JS/TS + react-hooks + react-refresh |
| Package managers | **pnpm lockfile present**; Docker/Vercel configs use **npm** |
| Deploy | Docker/nginx, Vercel SPA |

**Not present in this repo:** tests (no Vitest/Jest/Playwright), Prettier config, backend, ORM/DB, auth library.

---

## 5. Configuration and environment

### Environment variables

Only one env var is used by application code:

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_API_URL` | Recommended | Axios `baseURL`. Fallback: `http://localhost:3000/api` |

- Loaded via Vite `import.meta.env` in `src/lib/Axios.ts`.
- `.env` is gitignored (`.env`, `.env.*`). Do not commit secrets or real API URLs with credentials.
- Vite only exposes vars prefixed with `VITE_`.

### Other config

- **Dev server:** `vite.config.ts` → port **4001**, host `0.0.0.0`
- **Path alias:** `@` → `./src` (Vite + `tsconfig`)
- **TanStack Router plugin:** ignores files/folders matching `_components` so they are not treated as routes
- **Build output:** `dist/`
- **App title:** “Pace Pharmacy” (`index.html`)

---

## 6. Install and run locally

### Prerequisites

- Node.js (repo environment observed with Node 24.x; use a current LTS if unsure)
- Package manager: **pnpm preferred** if using `pnpm-lock.yaml`; Docker/Vercel assume **npm**

### Setup

```bash
# clone, then from repo root:
pnpm install
# or: npm install

# create .env (not committed)
echo VITE_API_URL=http://localhost:3000/api > .env

pnpm dev
# or: npm run dev
```

Open `http://localhost:4001` (or the host Vite prints).

### Production-like local run

```bash
pnpm build && pnpm preview
```

### Docker

```bash
docker compose up --build
# maps host 4001 → container nginx :80
```

Dockerfile runs `npm install` + `npm run build`, then serves `dist` with nginx (`default.conf` SPA fallback).

**Note:** Docker build does not automatically bake in a local `.env` unless you adjust the build. Ensure `VITE_API_URL` is available at **build time** for production images (Vite inlines env at build).

---

## 7. Scripts and common commands

From `package.json`:

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | Local HMR server (port 4001) |
| `build` | `tsc -b && vite build` | Typecheck project references + production bundle |
| `lint` | `eslint .` | Lint TS/TSX |
| `preview` | `vite preview` | Serve production build |
| `generate-routes` | `tsr generate` | Regenerate TanStack route tree |

Typical agent workflow:

```bash
pnpm lint
pnpm build
```

There is no `test` script.

---

## 8. APIs, data, and integrations

### Backend

External REST API under `VITE_API_URL`. Expected envelope (`src/types/common.api.ts`):

```ts
// Success
{ success: true, data: T, message?: string, timestamp?: string }

// Error (flat — matches backend createErrorResponse)
{
  success: false,
  code: string,
  message: string,
  field?: string,
  fields?: Record<string, string>,
  timestamp?: string
}
```

Helpers: `isSuccessResponse`, `isErrorResponse`. Prefer `getErrorMessage` for user-facing copy (reads top-level `message`).

### Endpoints used by this frontend

| Method | Path | Body | Used by |
|--------|------|------|---------|
| `POST` | `/account` | `multipart/form-data` | New account submit (`createAccount`) |
| `GET` | `/application` | query `referenceCode` | Load auth application |
| `POST` | `/application` | JSON (`referenceCode`, `accountAuthorization`, `prescriptionRequirement`, `medicalDirectorEmail`) | Submit medical director auth |

**POST `/account` FormData shape (from `review.tsx`):**

- File fields: `documents` (one or more files appended)
- Text field `json`: stringified object:

```ts
{
  account: AccountFormSchema,
  payment: PaymentFormSchema,
  medical: MedicalFormSchema,
  acknowledgements: ACKFormSchema,
  preferredLocation: number, // Number(session location id)
  documents: FormData // nested reference in JSON (implementation quirk; files also appended separately)
}
```

On success, UI expects `data.data.referenceCode`, clears `sessionStorage`, stores `referenceCode` in session, navigates to `/submitted?code=...`.

**GET `/application` response `data` shape** (`ApplicationResponse`):

- `application`: `{ id, accountId, referenceCode, expiryDate, isActive, isExpired, isSubmitted, submittedDate, prescriptionRequirement }`
- `accountHolder`, `organizationName`, `medicalDirectorName`, `medicalDirectorEmail`

### Hardcoded business data (frontend)

**Locations** (`views/location.tsx`):

| id | Name | Address |
|----|------|---------|
| `1` (default) | Leaside Location (Pick-up or Delivery) | 40 Laird Drive, Toronto, ON, M4G 3T2 |
| `2` | Downtown Location (Pick-up Only) | 14 Isabella Street, Toronto, ON, M4Y 1N1 |

**Clinic types:** `general-medical`, `aesthetics`, `naturopathic`, `other` (+ free-text when other).

**Payment methods:** `visa`, `mastercard`, `amex`, `bank_transfer` (E-Transfer). Card fields skipped for `bank_transfer`. Amex CVV length 4; others 3.

**Canadian provinces** (enum-like snake_case values) in account address UI / review labels.

### External integrations

- External Pace Pharmacy API only (via Axios).
- Error “Report this problem” in review copies a text report to clipboard; support email constant is still placeholder `support@yourapp.com` and mailto is commented out.

### Database

**None in this repository.** Persistence is:

1. Browser `sessionStorage` for wizard drafts
2. Backend (out of repo) after submit

---

## 9. Important business workflows

### A. New Account Setup (primary)

Order of steps (sidebar + navigation):

1. `/location` → preferred location id in `SESSION_KEYS.LOCATION_KEY` (`preferredLocation`)
2. `/account` → account, billing/shipping, documents (Zustand), delivery hours, phone/email
3. `/payment` → method + card fields (unless e-transfer) + payment authorization
4. `/acknowledgements` → typed name + consent to financial/compounding terms
5. `/medical-director` → director identity; if “I am also the Medical Director”, email/license optional
6. `/review` → validates prior steps present, builds FormData, `POST /account`
7. `/submitted` → requires search `code` matching session `referenceCode`

**Documents:** required (≥1), max **10MB** per file. Stored in Zustand because `File` cannot live in `sessionStorage` (account session persists other fields with `documents: []`). Leaving the tab/refresh loses uploads even if other fields restore. **Review** and **Account** both require `documents.length > 0`; Review redirects to `/account` with a toast if files are missing. RHF `documents` must stay in sync with the Zustand list (accumulate on upload).

**Shipping:** if `sameAsBilling`, shipping is copied from billing at submit time in review.

**Medical director not self:** UI messaging says the director will authorize separately (link/code). That authorization is flow B.

### B. Medical Director Authorization

- Entry: `/account-setup?code=REF` → redirects to `/account-setup/$code/`
- Loads application via GET; if already submitted / inactive / expired, shows completed state (no resubmit)
- Submit: POST `/application` with prescription requirement enum:
  - `withoutPrescription` — order under director name without signed Rx each time
  - `withPrescription` — require signed Rx per order
- Success → session `AuthorizationSubmitted` + `/account-setup/$code/submitted`

### Session keys (`src/constants/index.ts`)

```ts
LOCATION_KEY: "preferredLocation"
ACCOUNT_KEY: "accountInformation"
PAYMENT_KEY: "paymentInformation"
ACK_KEY: "acknowledgements"
MEDICAL_DIRECTOR_KEY: "medicalDirectorInformation"
```

Additional ad-hoc keys: `referenceCode`, `AuthorizationSubmitted`.

Sidebar marks steps complete when session JSON is non-empty; completed steps become navigable links.

---

## 10. Coding conventions and patterns

- **Routes stay thin:** `createFileRoute(...)` + import view component.
- **Views own Zod schemas** and often `export type FormSchema = z.infer<typeof formSchema>`.
- **react-hook-form** with `Controller` / `FormProvider`; resolvers often cast `zodResolver(formSchema as any)` (Zod v4 interop workaround).
- **UI:** shadcn-style components under `components/ui`; brand color classes `theme-green`, `bg-theme-green-50`, font `font-enzyme`.
- **Imports:** prefer `@/` alias.
- **API errors:** prefer `getErrorMessage` / `isErrorResponse`. Envelope is flat (`code`, `message`, optional `field`/`fields`) — do not read nested `error.message`.
- **Naming:** feature folders under `views/`; private UI under `_components/` (ignored by router).
- **Do not hand-edit** `routeTree.gen.ts`. Add/change files under `src/routes/` and run `pnpm generate-routes` or rely on the Vite plugin in dev.

---

## 11. Testing, linting, formatting, build

| Concern | Status |
|---------|--------|
| Unit/E2E tests | **None** |
| Lint | `pnpm lint` / `npm run lint` |
| Format | No Prettier project config |
| Typecheck | Part of `build` via `tsc -b` |
| Build | `vite build` → `dist/` |

CI is not defined in this repo (no `.github/workflows` observed in the project root docs/config set used for this file).

---

## 12. Constraints, assumptions, and what agents should avoid

### Do not

- Edit `src/routeTree.gen.ts` manually.
- Commit `.env` or secrets.
- Assume a database or auth layer exists here.
- Treat `README.md` as product documentation (it is still the Vite starter text).
- Break the `_components` naming convention for folders that must not become routes.
- Remove session key names without updating sidebar, all step views, and review.
- Store `File` objects in `sessionStorage` (use Zustand documents store).
- Change API contract paths/payload shapes without coordinating with the backend that serves `VITE_API_URL`.

### Assume

- Backend implements `/account` and `/application` with the success/error envelope above.
- Users are Canadian professional accounts (province list, Toronto locations, compounding acknowledgements).
- Payment card data is collected in the browser and sent to the API; treat as **sensitive** (also currently persisted in `sessionStorage` and shown on review).

### Sensitive / compliance caution

- Card number, expiry, and CVV are held in session and rendered on the review page. Agents should not expand logging of payment fields, and should be careful with any analytics or error-reporting that might include form state.

---

## 13. Known issues, debt, and caution areas

Documented from code (not speculation beyond what the source shows):

1. **Documents + refresh:** uploads live only in Zustand memory; refresh loses files while other steps may restore from session. Mitigated: Review/Account gate on `documents.length > 0` and toast + redirect to `/account` when missing.
2. **Review FormData quirk:** `json` payload includes `documents: formData` (the FormData object itself) while files are also appended as `documents` parts — backend must match this client behavior; do not “clean up” without verifying API expectations.
3. **Support reporting incomplete:** `SUPPORT_EMAIL = "support@yourapp.com"`; mailto navigation commented; report mainly copies to clipboard / `console.log`.
4. **Query invalidation leftover:** on successful account create, `invalidateQueries({ queryKey: ["todos"] })` appears unused/leftover.
5. **Package manager split:** pnpm lockfile vs npm in Docker/`vercel.json`; lockfile is also listed in `.gitignore` — installs may drift between environments.
6. **Account-setup guard bug risk:** `if (!code || code === undefined) <Navigate to={'/'} />` does not `return` the Navigate element.
7. **FooterButtons + forms:** Next button may use `type` button + `onClick` that calls `onSubmit`; account step passes `onSubmit={() => null}` and relies on native form submit — be careful when changing button types.
8. **Zod resolver casts:** `as any` on resolvers — type errors may be masked.
9. **Payment data in sessionStorage:** security/privacy risk if shared machines or XSS.
10. **No automated tests** — regressions rely on manual wizard runs through both flows.
11. **Uncommitted work may exist** on `src/views/_api.ts` and `src/views/review.tsx` (error-handling UX); check `git status` before overlapping edits.

---

## 14. How an AI agent should approach changes

1. **Identify the flow** — wizard (`/_form`) vs medical director (`/_account`) vs shared API/types.
2. **Match existing patterns** — thin route → view; Zod beside form; session keys from `constants`; Axios helpers from `_api` files.
3. **Preserve API contracts** unless the task explicitly includes backend coordination.
4. **After adding/renaming routes under `src/routes/`**, ensure the route tree regenerates (`dev` plugin or `pnpm generate-routes`).
5. **Run** `pnpm lint` and `pnpm build` before considering the change done.
6. **Manual smoke** when touching submit:
   - Wizard: location → account (with file) → payment → ack → medical → review → submitted
   - Auth: `/account-setup/$code/` load + submit + submitted page
7. **UI:** keep Pace branding (`theme-green`, Enzyme font, existing layout). Prefer existing shadcn components over new design systems.
8. **Scope:** change only what the task requires; avoid drive-by refactors of payment handling, FormData shape, or session key names.
9. **Update this `CONTEXT.md`** when you change architecture, env vars, scripts, API usage, workflows, or agent constraints.

---

## 15. Quick reference — agent checklist

- [ ] Backend URL set via `VITE_API_URL` for the target environment
- [ ] New wizard fields: Zod schema + session persistence + review display + submit payload
- [ ] New uploads: Zustand documents store + FormData append in `review.tsx`
- [ ] New routes: under `src/routes/`, not under `_components`
- [ ] Do not commit `.env`
- [ ] Lint + build pass
- [ ] Update `CONTEXT.md` if the change affects how future agents should work

---

## 16. Related reading in-repo

- `package.json` — scripts and dependencies
- `vite.config.ts` — port, aliases, router plugin
- `src/types/common.api.ts` — API envelope
- `src/views/_api.ts` / `src/views/account-setup/_api.ts` — HTTP calls
- `src/constants/index.ts` — session key contract
- `docker-compose.yml` / `Dockerfile` / `vercel.json` — deploy shapes
)
