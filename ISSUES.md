# issues.md — Pace Pharmacy Frontend Audit

> Project-wide issue audit based on inspection of source, configs, and dependencies in this repository.
> This is a **frontend-only** app; there is no database in-repo. Database findings are limited to N/A / out-of-scope notes.
> Each item is either **confirmed** from code evidence or labeled as a **potential risk** where behavior depends on backend/environment.

---

## Critical

### ISSUE-001 — Payment card data (including CVV) stored in sessionStorage and shown on Review

| Field | Detail |
|--------|--------|
| **Category** | Security |
| **Severity** | Critical |
| **Location** | `src/views/payment.tsx` (persist via `useSessionStorage` + `SESSION_KEYS.PAYMENT_KEY`); `src/views/review.tsx` (~L261–285 display of `cardNumber`, `cardExpiryDate`, `cvv`); `src/hooks/use-session-storage.tsx` |
| **Description** | Full payment details including **CVV** are serialized into `sessionStorage` and rendered in clear text on the Review step. |
| **Impact** | Violates common PCI-DSS expectations (CVV must not be stored after authorization). Shared/kiosk machines, XSS, browser extensions, or support screen-shares can expose card data. |
| **How to reproduce/detect** | Complete Payment step → DevTools → Application → Session Storage → `paymentInformation`. Open `/review` and observe CVV on screen. |
| **Recommended fix** | Do not persist raw PAN/CVV in `sessionStorage`. Prefer a tokenization/payment provider flow, or collect card details only at submit time and never display CVV on Review. At minimum, omit CVV from persistence and mask PAN on Review. |
| **Confidence** | High |

---

### ISSUE-002 — Docker production builds omit `VITE_API_URL` (API base baked as localhost)

| Field | Detail |
|--------|--------|
| **Category** | Build/deployment / Configuration |
| **Severity** | Critical |
| **Location** | `Dockerfile` (build stage has no `ARG`/`ENV` for `VITE_API_URL`); `src/lib/Axios.ts` (fallback `http://localhost:3000/api`) |
| **Description** | Vite inlines `import.meta.env.VITE_API_URL` at **build** time. The Docker image build never injects this variable, so the client bundle likely ships with the localhost fallback. |
| **Impact** | Production users’ browsers call `http://localhost:3000/api`, so account/application submit fails for everyone using the Docker image (unless they happen to run that API locally). |
| **How to reproduce/detect** | `docker compose build` without build-args; open built app, inspect network requests for `localhost:3000`. |
| **Recommended fix** | Add Docker `ARG VITE_API_URL` + `ENV VITE_API_URL=...` before `npm run build`, document required build-arg, and fail the build if unset in production pipelines. Align Vercel env with the same variable. |
| **Confidence** | High (for any deploy that uses this Dockerfile without extra build wiring) |

---

## High

### ISSUE-003 — Success navigation can lose `referenceCode` after `sessionStorage.clear()`

| Field | Detail |
|--------|--------|
| **Category** | Functional / State management / Runtime |
| **Severity** | High |
| **Location** | `src/views/review.tsx` `onSuccess` (~L69–79); `src/routes/submitted.tsx` (~L12–20); `src/hooks/use-session-storage.tsx` (async write in `useEffect`) |
| **Description** | On successful create, code calls `sessionStorage.clear()`, then `setCode(referenceCode)` (React state), then navigates to `/submitted`. The hook only writes to `sessionStorage` in a later `useEffect`. `/submitted` immediately requires URL `code` **and** session `referenceCode` to match, else redirects to `/location`. |
| **Impact** | Users can successfully submit an application but never see the success/reference-code screen (bounce back to wizard). Support confusion; possible duplicate resubmits. |
| **How to reproduce/detect** | Submit a successful `/account` response; observe whether `/submitted` flashes then redirects. Add logging around clear/set/navigate timing. |
| **Recommended fix** | Write `referenceCode` with `sessionStorage.setItem` **synchronously** before navigate; or pass code only via URL/search and stop requiring session mirror; or clear only wizard keys, not the new reference key; avoid `clear()` + async hook write. |
| **Confidence** | High (race is real; failure depends on React commit/unmount timing) |

---

### ISSUE-004 — Manual `Content-Type: multipart/form-data` can break document uploads

| Field | Detail |
|--------|--------|
| **Category** | API/backend / Functional |
| **Severity** | High |
| **Location** | `src/views/_api.ts` `createAccount` (~L12–18) |
| **Description** | Request sets `Content-Type: multipart/form-data` explicitly. For multipart, the client must set the **boundary**; setting the header manually often omits it. |
| **Impact** | Backend may reject or mis-parse FormData (documents/json). Intermittent or total upload/submit failures. |
| **How to reproduce/detect** | Inspect the outgoing request headers for missing `boundary=`; submit with files and check API logs. |
| **Recommended fix** | Remove the manual `Content-Type` header and let Axios set it (including boundary) when `data` is `FormData`. |
| **Confidence** | High |

---

### ISSUE-005 — Documents live only in Zustand; Review does not gate on files; session restore drops Files

| Field | Detail |
|--------|--------|
| **Category** | Functional / State management |
| **Severity** | High |
| **Location** | `src/views/account/_components/documents-store.ts`; `documents.tsx`; `account/index.tsx` (session persist); `review.tsx` `checkForData` / `onFormSubmit` (~L139–207) |
| **Description** | Uploaded `File`s are kept in Zustand (correct for non-serializable data), but account session JSON cannot restore real `File`s. Review’s completeness check does **not** verify documents. Submit only appends files if Zustand still has them. |
| **Impact** | After refresh or revisiting Review from another session tab state, users can submit **without** license documents while believing the Account step was completed. Backend may accept incomplete applications or reject opaquely. |
| **How to reproduce/detect** | Upload docs → leave Account → refresh page → complete other steps → Review → submit; Network tab shows no `documents` parts. |
| **Recommended fix** | On Review (and Account), require `documents.length > 0`; if missing, redirect to `/account` with a clear message. Optionally warn when session account exists but Zustand files are empty. |
| **Confidence** | High |

---

### ISSUE-006 — RHF `documents` field overwritten with only the latest upload batch

| Field | Detail |
|--------|--------|
| **Category** | Functional / State management |
| **Severity** | High |
| **Location** | `src/views/account/_components/documents.tsx` `handleFileChange` (~L46–47): `setDocuments([...documents, ...fileArray])` vs `onChange(fileArray)` |
| **Description** | Zustand accumulates files, but `react-hook-form` `onChange` receives **only** the new `fileArray`, replacing prior field value. |
| **Impact** | Validation/`getValues('documents')` disagree with UI/Zustand. Edge cases around remove/re-validate can allow inconsistent state; future refactors that submit from RHF instead of Zustand would drop files. |
| **How to reproduce/detect** | Upload file A, then “Upload more” file B; compare Zustand length vs `form.getValues('documents')`. |
| **Recommended fix** | `onChange([...documents, ...fileArray])` (or single source of truth: either RHF or Zustand, not divergent). |
| **Confidence** | High |

---

### ISSUE-007 — Payment step can double-invoke `handleSubmit`

| Field | Detail |
|--------|--------|
| **Category** | Functional / Runtime |
| **Severity** | High |
| **Location** | `src/views/payment.tsx` (`<form onSubmit={methods.handleSubmit(onSubmit)}>` + `<FooterButtons onSubmit={methods.handleSubmit(onSubmit)} />`); `src/components/footer-buttons.tsx` (~L43–49 Button **without** `type="button"`) |
| **Description** | Inside a form, a `<button>` defaults to `type="submit"`. Footer Next both fires `onClick` → `handleSubmit` **and** native submit → form `onSubmit` → `handleSubmit` again. |
| **Impact** | Double navigation attempts, duplicate session writes, harder-to-reason race conditions; similar footguns on any form that passes `onSubmit` into `FooterButtons`. |
| **How to reproduce/detect** | Add a counter/log inside payment `onSubmit`; click Next once; observe two calls. |
| **Recommended fix** | Always set Footer primary button `type="button"` when using `onClick`, **or** remove `onSubmit` prop and rely solely on native form submit (and use `type="submit"`). Prefer one path only. |
| **Confidence** | High |

---

### ISSUE-008 — API error messages often not surfaced (`data.message` vs `error.message`; thrown envelope objects)

| Field | Detail |
|--------|--------|
| **Category** | API/backend / UX |
| **Severity** | High |
| **Location** | `src/views/_api.ts` `getErrorMessage` (~L41); `src/types/common.api.ts` (`error.message`); `review.tsx` `postAccount` throws `res.error` plain object |
| **Description** | Typed API errors use `{ success:false, error:{ message } }`, but `getErrorMessage` reads `err.response.data?.message`. When `postAccount` throws `res.error` (`{code,message}`), it is neither `AxiosError` nor `Error`, so users get a generic fallback. |
| **Impact** | Users see vague errors instead of backend messages (e.g. duplicate email 409 body shape, validation details). Harder support debugging. |
| **How to reproduce/detect** | Force API 409/422 with envelope body; compare dialog text to raw response. |
| **Recommended fix** | Parse `data.error?.message` and `data.message`; if thrown value has `.message`, use it; `throw new Error(res.error.message)` from `postAccount`. |
| **Confidence** | High |

---

### ISSUE-009 — Medical Director authorization submit has no error handling UI

| Field | Detail |
|--------|--------|
| **Category** | Functional / UX / API |
| **Severity** | High |
| **Location** | `src/views/account-setup/index.tsx` `useMutation` (~L57–67) — `onSuccess` only; no `onError` |
| **Description** | Failed `POST /application` leaves the user on the form with no dialog/toast; only the spinner stops. |
| **Impact** | Directors believe nothing happened or click repeatedly; unclear whether authorization succeeded. |
| **How to reproduce/detect** | Open `/account-setup/$code/` with API down or 500; submit; observe no error UI. |
| **Recommended fix** | Add `onError` with toast/dialog using shared `getErrorMessage`; disable double-submit; optionally surface mutation `isError`. |
| **Confidence** | High |

---

### ISSUE-010 — `POST /application` success path ignores `success: false` envelope

| Field | Detail |
|--------|--------|
| **Category** | API/backend / Functional |
| **Severity** | High |
| **Location** | `src/views/account-setup/_api.ts` `submitApplication`; `account-setup/index.tsx` mutation `onSuccess` |
| **Description** | Unlike `postAccount` in Review (which checks `isErrorResponse`), authorization submit treats any resolved Axios response as success. |
| **Impact** | If the API returns HTTP 200 with `{ success: false, ... }` (as the shared types allow), UI still navigates to the success page. |
| **How to reproduce/detect** | Mock 200 + `success:false`; submit authorization; observe redirect to submitted. |
| **Recommended fix** | Mirror Review: if `isErrorResponse(res) throw ...` before `onSuccess`. |
| **Confidence** | Medium–High (confirmed gap; exploitation depends on backend using 200+envelope) |

---

### ISSUE-011 — Wizard step sidebar hidden on all viewports below `lg`

| Field | Detail |
|--------|--------|
| **Category** | UI/UX |
| **Severity** | High |
| **Location** | `src/components/sidebar/index.tsx` (~L69 `hidden lg:block`) |
| **Description** | Multi-step progress UI is completely hidden on mobile/tablet widths. |
| **Impact** | Mobile users lack progress context and cannot jump to completed steps via sidebar links. Higher abandonment / wrong-step confusion. |
| **How to reproduce/detect** | Resize &lt;1024px on `/account` or `/payment`. |
| **Recommended fix** | Add a compact horizontal stepper or step label for `sm/md` (current step N of 6 + title). |
| **Confidence** | High |

---

### ISSUE-012 — Sensitive payment fields logged/reportable via console on failure

| Field | Detail |
|--------|--------|
| **Category** | Security |
| **Severity** | High |
| **Location** | `src/views/review.tsx` `onError` `console.error("Request failed:", res)` (~L91); `createAccount` `console.error` in `_api.ts` |
| **Description** | Full Axios errors (may include request payload config) are logged to the browser console. |
| **Impact** | Card/PII leakage via console on shared machines or session recordings. |
| **How to reproduce/detect** | Fail submit; inspect console error object/`config.data`. |
| **Recommended fix** | Log status/url only; never log FormData/body containing payment fields. |
| **Confidence** | Medium–High (payload presence depends on Axios error shape) |

---

## Medium

### ISSUE-013 — `Navigate` for missing code is not returned (dead statement)

| Field | Detail |
|--------|--------|
| **Category** | Runtime / Functional |
| **Severity** | Medium |
| **Location** | `src/views/account-setup/index.tsx` ~L85: `if (!code \|\| code === undefined) <Navigate to={'/'} />` |
| **Description** | JSX is created but **not returned**; execution continues. |
| **Impact** | Missing/`undefined` param does not redirect as intended (router usually still provides `code` when matched). Dead/incorrect guard. |
| **How to reproduce/detect** | Static review; force render without param if possible. |
| **Recommended fix** | `if (!code) return <Navigate to="/" />` |
| **Confidence** | High |

---

### ISSUE-014 — Review mutates session state object in place for shipping address

| Field | Detail |
|--------|--------|
| **Category** | State management / Code quality |
| **Severity** | Medium |
| **Location** | `src/views/review.tsx` ~L180–182: `accountInformation.shippingAddress = accountInformation.billingAddress` |
| **Description** | Direct mutation of the object held in React/`sessionStorage`-backed state. |
| **Impact** | Unexpected shared references; shipping permanently overwritten in memory/session after submit attempt; harder debugging. |
| **How to reproduce/detect** | Enable `sameAsBilling`, submit (or attempt), inspect session account object identity of billing vs shipping. |
| **Recommended fix** | Build a shallow-copied payload: `{ ...accountInformation, shippingAddress: { ...billingAddress } }`. |
| **Confidence** | High |

---

### ISSUE-015 — `JSON.stringify` embeds `documents: formData` (nonsensical JSON)

| Field | Detail |
|--------|--------|
| **Category** | API/backend / Code quality |
| **Severity** | Medium |
| **Location** | `src/views/review.tsx` ~L195–202 |
| **Description** | The `json` field stringifies an object that includes `documents: formData`. `JSON.stringify(FormData)` becomes `{}`. Files are separately appended (correct channel). |
| **Impact** | Confusing contract; backends that trust `json.documents` get empty object; accidental “cleanup” could break uploads. |
| **How to reproduce/detect** | Decode `json` part of multipart request; observe `"documents":{}`. |
| **Recommended fix** | Omit `documents` from the JSON blob; keep only file parts named `documents`. Confirm with backend. |
| **Confidence** | High |

---

### ISSUE-016 — Preferred location not required on Review gate

| Field | Detail |
|--------|--------|
| **Category** | Functional / Business logic |
| **Severity** | Medium |
| **Location** | `src/views/review.tsx` `checkForData` (~L141 commented location check); `onFormSubmit` still requires `preferredLocation` |
| **Description** | Deep-link users who never visit `/location` are not redirected by the gate; submit fails only with `console.error`. |
| **Impact** | Dead-end on Review with no user-visible reason; location may be missing entirely. |
| **How to reproduce/detect** | Clear session; open `/review` after filling other keys manually without `preferredLocation`. |
| **Recommended fix** | Re-enable location in `checkForData` or default location when absent; show user-facing error if submit blocked. |
| **Confidence** | High |

---

### ISSUE-017 — Clinic type `"other"` can be submitted without a custom value

| Field | Detail |
|--------|--------|
| **Category** | Functional / Validation |
| **Severity** | Medium |
| **Location** | `src/views/account/_components/account-information.tsx` (~L152–200); `form-schema.tsx` `clinicType` |
| **Description** | Selecting “Other” sets value `"other"`. Schema only requires non-empty string; free-text field is optional in practice. |
| **Impact** | Applications stored with useless clinic type `"other"`. |
| **How to reproduce/detect** | Choose Other, leave specify blank, proceed. |
| **Recommended fix** | Zod refine: if value is `"other"` or reserved, require a distinct custom string; disable Next until specified. |
| **Confidence** | High |

---

### ISSUE-018 — Single-person Medical Director copy promises an in-app authorization step that does not exist

| Field | Detail |
|--------|--------|
| **Category** | UI/UX / Business logic |
| **Severity** | Medium |
| **Location** | `src/views/medical-director.tsx` (~L111–116) |
| **Description** | Copy says if the user is also MD, they will “complete the authorization in the next step” without a link/code. Next step is Review/submit only—no separate authorization UI for self-MD. |
| **Impact** | Misleading expectations; possible compliance confusion about when authorization occurs. |
| **How to reproduce/detect** | Check “I am also the Medical Director” and read alert; proceed to Review. |
| **Recommended fix** | Align copy with actual backend behavior (authorization implied at account create vs later email). |
| **Confidence** | High (UI mismatch); Medium on backend implications |

---

### ISSUE-019 — Medical Director license marked required in UI even when optional

| Field | Detail |
|--------|--------|
| **Category** | UI/UX / Validation |
| **Severity** | Medium |
| **Location** | `src/views/medical-director.tsx` (~L181–184 asterisk always); schema requires `licenseNo` only when `isAlsoMedicalDirector === false` |
| **Description** | Asterisk always shown; validation skips license when self-MD. |
| **Impact** | Confusing required-field UX; users may think validation is broken. |
| **Recommended fix** | Conditionally render asterisk / hide license when self-MD if truly optional. |
| **Confidence** | High |

---

### ISSUE-020 — Duplicate / incorrect input IDs and placeholders (a11y)

| Field | Detail |
|--------|--------|
| **Category** | UI/UX / Accessibility |
| **Severity** | Medium |
| **Location** | `account-information.tsx` both names use `id="account-holder-name"`; `medical-director.tsx` both names use `id="medical-director-name"`; email/license placeholders `"eg., John Mark"` |
| **Description** | Duplicate IDs break label association; placeholders for email/license are name-like. |
| **Impact** | Screen reader / click-label confusion; weaker form usability. |
| **Recommended fix** | Unique ids (`…-first-name`, `…-last-name`); placeholders like `license #`, `name@clinic.com`. |
| **Confidence** | High |

---

### ISSUE-021 — Address Line 2 marked required but schema allows empty string

| Field | Detail |
|--------|--------|
| **Category** | UI/UX / Validation |
| **Severity** | Medium |
| **Location** | `address.tsx` (~L122–123 asterisk); `form-schema.tsx` `addressLine_2: z.string()` (no `.min(1)`) |
| **Description** | UI indicates required; validation does not. |
| **Impact** | Inconsistent required semantics; optional field looks mandatory. |
| **Recommended fix** | Remove asterisk or add `.min(1)` / `.optional()` consistently for billing and shipping. |
| **Confidence** | High |

---

### ISSUE-022 — Amex card number mask forces 16 digits; CVV rules differ

| Field | Detail |
|--------|--------|
| **Category** | Functional / UX |
| **Severity** | Medium |
| **Location** | `src/views/payment.tsx` card mask `0000 0000 0000 0000` (~L201); CVV amex length 4 (~L73–78) |
| **Description** | Amex PANs are typically 15 digits; UI mask is 16 for all brands. |
| **Impact** | Amex users may enter wrong length or fail later server validation. |
| **Recommended fix** | Brand-specific masks (Amex `0000 000000 00000`) and length checks. |
| **Confidence** | High |

---

### ISSUE-023 — Weak payment field validation (no expiry format/Luhn)

| Field | Detail |
|--------|--------|
| **Category** | Functional / Validation |
| **Severity** | Medium |
| **Location** | `src/views/payment.tsx` `formSchema` `superRefine` |
| **Description** | Card fields only checked for non-empty (and CVV length). No MM/YY validity, no Luhn, no brand length. |
| **Impact** | Invalid cards reach Review/API; more failed charges/support load. |
| **Recommended fix** | Validate expiry in future; optional Luhn; lengths by brand—or use a payment SDK. |
| **Confidence** | High |

---

### ISSUE-024 — Delivery hours required even for pick-up-only Downtown location

| Field | Detail |
|--------|--------|
| **Category** | Business logic / UX |
| **Severity** | Medium |
| **Location** | `location.tsx` Downtown “Pick-up Only”; `form-schema.tsx` / `delivery.tsx` Mon–Fri required |
| **Description** | Location 2 is pick-up only, but Account still requires delivery/operating hours. |
| **Impact** | Extra friction; possible nonsensical data for pick-up accounts. |
| **Recommended fix** | Make hours conditional on location/delivery preference, or mark clearly as clinic operating hours only (copy already partially does). |
| **Confidence** | Medium (may be intentional OCP policy) |

---

### ISSUE-025 — File type only enforced via `accept` attribute

| Field | Detail |
|--------|--------|
| **Category** | Security / Validation |
| **Severity** | Medium |
| **Location** | `documents.tsx` (~L128 `accept=...`; size check only in JS) |
| **Description** | Users/tools can bypass `accept` and upload other types; no MIME/extension check in code. |
| **Impact** | Unexpected files sent to API; relies entirely on backend scanning. |
| **Recommended fix** | Validate extension + `file.type` client-side; keep strong backend checks. |
| **Confidence** | High |

---

### ISSUE-026 — “Report this problem” is non-functional for users

| Field | Detail |
|--------|--------|
| **Category** | UX / Functional |
| **Severity** | Medium |
| **Location** | `src/views/review.tsx` `handleReportProblem` (~L95–110); placeholder `support@yourapp.com`; mailto commented; `console.log` instead |
| **Description** | Button copies report (maybe) but does not open mail or show confirmation; support address is a stub. |
| **Impact** | Users think they reported an issue; nothing reaches support. |
| **Recommended fix** | Real support email via env; restore mailto or ticket API; toast “copied + email opened”. |
| **Confidence** | High |

---

### ISSUE-027 — `useSessionStorage` writes `initialValue` on mount even when key was absent

| Field | Detail |
|--------|--------|
| **Category** | State management |
| **Severity** | Medium |
| **Location** | `src/hooks/use-session-storage.tsx` |
| **Description** | After reading miss → `initialValue`, `useEffect` always `setItem`s current value (including intentional `null`). |
| **Impact** | Pollutes session with null keys; can interact badly with guards (e.g. submitted flow). Location defaults to `"1"` even before explicit choice (may be OK). |
| **Recommended fix** | Only write when value is intentionally set / dirty; skip writing `null` unless clearing. |
| **Confidence** | Medium |

---

### ISSUE-028 — No React error boundary; unhandled render errors white-screen the app

| Field | Detail |
|--------|--------|
| **Category** | Runtime / UX |
| **Severity** | Medium |
| **Location** | `src/main.tsx`, `src/routes/__root.tsx` — no error boundary |
| **Description** | Any render throw takes down the tree with no recovery UI. |
| **Impact** | Poor production failure mode on unexpected data shapes. |
| **Recommended fix** | Add route-level or root error boundary with retry + support message. |
| **Confidence** | High |

---

### ISSUE-029 — Sonner toaster uses `next-themes` without a `ThemeProvider`

| Field | Detail |
|--------|--------|
| **Category** | Configuration / Code quality |
| **Severity** | Medium |
| **Location** | `src/components/ui/sonner.tsx`; root does not wrap `ThemeProvider` |
| **Description** | `useTheme()` runs without provider (dependency still installed). |
| **Impact** | Theme defaults only; unnecessary dependency; possible future warnings. |
| **Recommended fix** | Provide `ThemeProvider`, or hardcode `theme="light"` and drop `next-themes` if unused. |
| **Confidence** | High |

---

### ISSUE-030 — Axios has no interceptors; envelope/`success:false` inconsistent across calls

| Field | Detail |
|--------|--------|
| **Category** | API/backend / Code quality |
| **Severity** | Medium |
| **Location** | `src/lib/Axios.ts`; compare `createAccount`/`postAccount` vs `submitApplication` |
| **Description** | Shared client is bare; each call handles errors differently. |
| **Impact** | Easy to miss envelope checks (see ISSUE-010); duplicated logic. |
| **Recommended fix** | Central response interceptor or small `apiRequest` helper that normalizes errors. |
| **Confidence** | High |

---

### ISSUE-031 — 404 page offers no navigation back into the app

| Field | Detail |
|--------|--------|
| **Category** | UI/UX |
| **Severity** | Medium |
| **Location** | `src/routes/__root.tsx` `notFoundComponent` |
| **Description** | Text mentions “home page” but provides no link; `/` only redirects to `/location`. |
| **Impact** | Dead-end for bad URLs. |
| **Recommended fix** | Add `Link` to `/location` (or `/`). |
| **Confidence** | High |

---

### ISSUE-032 — Submitted success layout uses large fixed heights / negative margins poorly on mobile

| Field | Detail |
|--------|--------|
| **Category** | UI/UX |
| **Severity** | Medium |
| **Location** | `src/routes/submitted.tsx` (~L28–30 `p-[50px]`, `h-[calc(100dvh-350px)]`, `-mr-14`); similar in `_form`/`_account` layouts |
| **Description** | Desktop-oriented spacing/scroll chrome applied on small screens. |
| **Impact** | Cramped/overflow/odd scroll regions on phones. |
| **Recommended fix** | Responsive padding and drop negative margins below `md`. |
| **Confidence** | Medium |

---

### ISSUE-033 — `console.log` left in Clinic Type render path

| Field | Detail |
|--------|--------|
| **Category** | Performance / Code quality |
| **Severity** | Medium |
| **Location** | `src/views/account/_components/account-information.tsx` ~L160 |
| **Description** | `console.log('fieldState.invalid', ...)` runs during render. |
| **Impact** | Console noise; minor perf cost; looks unfinished for production. |
| **Recommended fix** | Remove. |
| **Confidence** | High |

---

### ISSUE-034 — Dead / leftover React Query invalidation for `["todos"]`

| Field | Detail |
|--------|--------|
| **Category** | Code quality |
| **Severity** | Medium |
| **Location** | `src/views/review.tsx` ~L71 |
| **Description** | `invalidateQueries({ queryKey: ["todos"] })` after account create; no todos queries exist. |
| **Impact** | Noise; suggests copy-paste; confuses maintainers. |
| **Recommended fix** | Remove. |
| **Confidence** | High |

---

### ISSUE-035 — Lockfile gitignored; Docker/Vercel install without deterministic lock

| Field | Detail |
|--------|--------|
| **Category** | Dependency / Build/deployment |
| **Severity** | Medium |
| **Location** | `.gitignore` (`pnpm-lock.yaml`, `pnpm-workspace.yaml`); `Dockerfile` `npm install` without copying lock; `vercel.json` `npm install` |
| **Description** | Reproducible installs undermined; pnpm vs npm split. |
| **Impact** | “Works on my machine” / sudden breaking upgrades in CI/Docker/Vercel. |
| **Recommended fix** | Commit one lockfile; use the same package manager everywhere (`pnpm fetch`/`npm ci`). |
| **Confidence** | High |

---

### ISSUE-036 — README is still Vite template; does not document real app

| Field | Detail |
|--------|--------|
| **Category** | Documentation |
| **Severity** | Medium |
| **Location** | `README.md` |
| **Description** | Unrelated React Compiler / ESLint template text; no Pace flows, env, or API notes (CONTEXT.md helps but README is what most tools/humans open first). |
| **Impact** | Onboarding mistakes; wrong assumptions about the project. |
| **Recommended fix** | Replace README with short product + setup pointing at `CONTEXT.md` / `VITE_API_URL`. |
| **Confidence** | High |

---

### ISSUE-037 — No automated tests of any kind

| Field | Detail |
|--------|--------|
| **Category** | Testing |
| **Severity** | Medium |
| **Location** | Repo-wide (no `*.test.*` / `*.spec.*`; no test script in `package.json`) |
| **Description** | Zero unit/integration/E2E coverage for wizard, FormData submit, or authorization flow. |
| **Impact** | Regressions (especially ISSUES 003–007) ship unnoticed. |
| **Recommended fix** | Start with Vitest for schemas/`getErrorMessage`/`isErrorResponse`, plus one Playwright path for happy-path submit (mocked API). |
| **Confidence** | High |

---

### ISSUE-038 — `index.html` version meta lags release commits

| Field | Detail |
|--------|--------|
| **Category** | Configuration / Documentation |
| **Severity** | Low–Medium |
| **Location** | `index.html` `meta name="version" content="1.0.8"` vs git history through `v1.1.0` |
| **Description** | Version stamp not updated with releases. |
| **Impact** | Support cannot trust client version from HTML. |
| **Recommended fix** | Bump on release or inject from `package.json` at build. |
| **Confidence** | High |

---

## Low

### ISSUE-039 — FooterButtons pattern is inconsistent and easy to misuse

| Field | Detail |
|--------|--------|
| **Category** | Code quality / Functional |
| **Severity** | Low |
| **Location** | `src/components/footer-buttons.tsx`; usages in account (`onSubmit={() => null}`), payment (dual submit), medical/ack (native submit only) |
| **Description** | Three different integration styles; default button type unclear. |
| **Impact** | Future steps likely reintroduce double-submit or non-working Next buttons. |
| **Recommended fix** | Document one pattern; set explicit `type`; simplify API (`type="submit"` vs link-only). |
| **Confidence** | High |

---

### ISSUE-040 — Zod resolvers cast with `as any`

| Field | Detail |
|--------|--------|
| **Category** | Code quality |
| **Severity** | Low |
| **Location** | Multiple views: `zodResolver(formSchema as any)` |
| **Description** | Hides Zod v4 / RHF typing mismatches. |
| **Impact** | Weaker compile-time safety for form values. |
| **Recommended fix** | Align `@hookform/resolvers` usage with Zod 4 types or shared helper. |
| **Confidence** | High |

---

### ISSUE-041 — Logo `alt="logo"` is non-descriptive

| Field | Detail |
|--------|--------|
| **Category** | Accessibility |
| **Severity** | Low |
| **Location** | `src/routes/__root.tsx` ~L39 |
| **Recommended fix** | `alt="Pace Pharmacy"`. |
| **Confidence** | High |

---

### ISSUE-042 — Review queryClient / mutation leftovers and empty `useEffect` cleanup

| Field | Detail |
|--------|--------|
| **Category** | Code quality |
| **Severity** | Low |
| **Location** | `src/views/review.tsx` empty effect cleanup; unused axios import if only used in helpers elsewhere |
| **Description** | Minor clutter. |
| **Recommended fix** | Clean unused code when touching the file. |
| **Confidence** | Medium |

---

### ISSUE-043 — No Prettier / format standard; ESLint not type-aware

| Field | Detail |
|--------|--------|
| **Category** | Code quality / Configuration |
| **Severity** | Low |
| **Location** | `eslint.config.js` (recommended only); no Prettier config |
| **Impact** | Style drift; fewer catchable TS-in-ESLint issues. |
| **Recommended fix** | Optional: type-checked ESLint + Prettier if the team wants it. |
| **Confidence** | High |

---

### ISSUE-044 — `baseline-browser-mapping` appears as a direct/dev dependency without app usage

| Field | Detail |
|--------|--------|
| **Category** | Dependency |
| **Severity** | Low |
| **Location** | `package.json` `devDependencies` |
| **Description** | No references in `src`. Likely accidental or transitive promotion. |
| **Impact** | Install noise. |
| **Recommended fix** | Remove if unused; rely on transitive deps as needed. |
| **Confidence** | Medium |

---

### ISSUE-045 — Input mask component spreads `field` after `onAccept` (event handler conflict risk)

| Field | Detail |
|--------|--------|
| **Category** | Functional / Code quality |
| **Severity** | Low |
| **Location** | `src/components/input-with-mask.tsx` |
| **Description** | `{...field}` may override carefully set IMask handlers depending on prop order/library version. |
| **Impact** | Occasional masked value sync bugs with RHF. |
| **Recommended fix** | Destructure `value`/`ref` from field; wire `onAccept`/`onBlur` explicitly without spreading full field. |
| **Confidence** | Medium |

---

### ISSUE-046 — No CI workflow in repository

| Field | Detail |
|--------|--------|
| **Category** | Build/deployment / Testing |
| **Severity** | Low |
| **Location** | No `.github/workflows` (or similar) observed in project root configs |
| **Impact** | Lint/build regressions merge unchecked (if GitHub used without external CI). |
| **Recommended fix** | Add workflow: install, `lint`, `build` on PR. |
| **Confidence** | Medium (CI might live outside repo) |

---

### ISSUE-047 — Database category: not applicable in this repo

| Field | Detail |
|--------|--------|
| **Category** | Database |
| **Severity** | N/A (informational) |
| **Location** | — |
| **Description** | No schema, ORM, migrations, or queries exist here. Data durability depends on the external API and browser session only. |
| **Impact** | Agents should not invent DB migrations in this project; data-loss risks are client session + API-side. |
| **Confidence** | High |

---

### ISSUE-048 — Potential risk: public unauthenticated account creation endpoint from browser

| Field | Detail |
|--------|--------|
| **Category** | Security |
| **Severity** | Medium (potential risk) |
| **Location** | `src/lib/Axios.ts` — no auth headers; `POST /account`, `POST /application` |
| **Description** | Frontend correctly has no auth for a public form, but this implies the backend must enforce rate limiting, abuse controls, and malware scanning on uploads. |
| **Impact** | Spam/fraudulent applications or malicious file uploads if backend is weak. |
| **How to detect** | Backend/security review (out of scope of this repo alone). |
| **Recommended fix** | Confirm backend rate limits, CAPTCHA/bot controls, file scanning; document assumptions in CONTEXT.md. |
| **Confidence** | Medium (risk; not a confirmed frontend bug) |

---

### ISSUE-049 — Potential risk: payment data transmitted to custom API without visible tokenization

| Field | Detail |
|--------|--------|
| **Category** | Security |
| **Severity** | High (potential risk) |
| **Location** | `review.tsx` FormData JSON includes full `payment` object |
| **Description** | Card data is sent to `VITE_API_URL` as part of account create. No Stripe/Adyen/etc. in frontend. |
| **Impact** | Entire PCI scope expands to Pace API + this SPA; misconfiguration is high severity. |
| **Recommended fix** | Confirm backend PCI approach; prefer hosted fields/tokenization so SPA never handles raw PAN/CVV. |
| **Confidence** | Medium (architecture risk evidenced by payload shape; compliance status unknown) |

---

## Summary

### Totals

| Metric | Count |
|--------|--------|
| **Total issues filed** | **49** (includes 1 N/A informational + 2 explicit potential risks) |
| **Critical** | **2** (ISSUE-001, ISSUE-002) |
| **High** | **12** (ISSUE-003–012; plus treat ISSUE-049 as high potential risk) |
| **Medium** | **26** (ISSUE-013–038, ISSUE-048) |
| **Low** | **8** (ISSUE-039–046) |
| **Informational** | **1** (ISSUE-047 Database N/A) |

*Counting note: ISSUE-038 listed as Low–Medium; tallied under Medium. ISSUE-048/049 are potential risks called out separately from confirmed defects.*

### Critical issues

1. **ISSUE-001** — CVV/PAN in `sessionStorage` + Review UI  
2. **ISSUE-002** — Docker build missing `VITE_API_URL` → localhost API in production bundles  

### High-priority issues (confirmed)

- **ISSUE-003** — Success page race after `sessionStorage.clear()`  
- **ISSUE-004** — Multipart `Content-Type` header breaks boundary  
- **ISSUE-005** — Documents missing after refresh; Review doesn’t require files  
- **ISSUE-006** — RHF documents field not accumulated  
- **ISSUE-007** — Payment double `handleSubmit`  
- **ISSUE-008** — Error message parsing mismatch  
- **ISSUE-009** — Authorization flow silent failures  
- **ISSUE-010** — `success:false` ignored on application submit  
- **ISSUE-011** — No mobile step indicator  
- **ISSUE-012** — Console logging of failed requests possibly containing PII  

### Medium-priority issues

ISSUE-013 through ISSUE-038, ISSUE-048 (see list above): validation/UX inconsistencies, FormData JSON quirk, state mutation, missing tests, lockfile/deploy drift, misleading MD copy, a11y IDs, etc.

### Low-priority issues

ISSUE-039 through ISSUE-046: FooterButtons footguns, `as any` resolvers, alt text, dependency cleanup, mask prop spread, missing CI.

---

### Top 10 issues that should be fixed first

1. **ISSUE-001** — Stop storing/displaying CVV (and minimize PAN retention)  
2. **ISSUE-002** — Inject `VITE_API_URL` into Docker/production builds  
3. **ISSUE-003** — Make post-submit `referenceCode` persistence synchronous/reliable  
4. **ISSUE-004** — Remove manual multipart `Content-Type`  
5. **ISSUE-005** — Block Review/submit without documents; handle refresh  
6. **ISSUE-007** — Fix FooterButtons/`type` to prevent double submit  
7. **ISSUE-008** — Correct API error message extraction  
8. **ISSUE-009** + **ISSUE-010** — Authorization error + envelope handling  
9. **ISSUE-006** — Sync documents field with Zustand  
10. **ISSUE-011** — Mobile stepper / progress UX  

---

### Notes for fix agents

- Prefer fixing **submit integrity** and **security** before cosmetic refactors.  
- When changing FormData shape (`documents` in JSON), coordinate with the backend that consumes `POST /account`.  
- Update `CONTEXT.md` after changing env/build/submit contracts.  
- Database issues are out of scope here; validate retention/PCI on the API service separately (ISSUE-048/049).
)
