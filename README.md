# Pace Pharmacy Account Setup Frontend

> Read this file before making changes. Update it when architecture, workflows, APIs, or development practices change.
> Derived from the repository as of the current codebase. Do not invent backend behavior that is not evidenced here.

---

## 1. What this project is

**Pace Pharmacy** (`pace-pharmacy`) is a **frontend-only React SPA** for professional account onboarding with Pace Pharmacy (compounding pharmacy, Toronto locations).

It solves two problems:

1. **New Account Setup** — multi-step wizard where a healthcare professional applies for a professional ordering account (location, account info, payment, acknowledgements, medical director, review/submit).
2. **Medical Director Authorization** — separate flow where a medical director opens a link with a **reference code** and authorizes an existing application (prescription requirements + consent).

There is **no backend, database, or auth system in this repo**. The UI talks to an external HTTP API via `VITE_API_URL`.
