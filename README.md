# CLM Academy

CLM Academy is an interactive training environment for Manafa's Client Lifecycle Management (CLM) platform. It combines a realistic CLM simulator with a training layer: guided tours, practice scenarios, a knowledge base and the Ask CLM assistant.

Everything is simulated. The app never calls a Manafa system, and every company, person, ID and document in it is fictional.

## Run, test, build

```bash
npm install
npm run dev          # http://localhost:5180 (opens CLM Academy home)
npm test             # 45 unit tests: domain rules, Phase II rules, seed, tours, practice, knowledge search, Ask CLM
npm run build        # static web build in dist/ — deploy to any static host
npm run build:html   # single self-contained file: dist-single/clm-academy.html
```

- **Persistence:** cases and learning progress are kept in the browser's localStorage.
- **Reset data** (Academy bar) restores the cases. **Reset progress** (Academy home or Guided learning) clears tours and scenarios.
- **Routing:** the app uses hash routing (`#/cases/...`), so it works from any static host and from a file on disk.

## What's in it

| Area | Where |
| --- | --- |
| Academy home, Guided learning, Practice, Knowledge Base | `#/academy`, `#/academy/learn`, `#/academy/practice`, `#/academy/kb` |
| CLM simulator: Case Queue, Case Workspace, Entities, Entity view | `#/cases`, `#/cases/:id`, `#/entities`, `#/entities/:id` |
| Ask CLM assistant | "Ask CLM" in the Academy bar; available on every page |
| Contextual help | indigo **?** icons beside complex controls; toggle with "Help hints" |

### Training cases

| Case | Used by |
| --- | --- |
| CS-1847 | Tours 1–2 (Open, unassigned; SPL fails after starting work) |
| CS-1845 | Tour 3 (SPL failure, missing VAT, AML pending, licenses) |
| CS-1849 | Tour 4 (signing authority with AOA result, corporate owner, CapEx) |
| CS-1851 | Tour 5 (one unconfigured license) |
| CS-1843 | Tour 6 (signing + license remain, then close) |
| CS-1853 | Explore: KYB failed, Bayan consent pending, AML missing information |
| CS-1901 – CS-1908 | Practice scenarios 1–8 |
| CS-2001 | Tour: Change of Circumstance (a signatory left) |
| CS-2011 | Tour: ZATCA Certificate Expiry (first retry fails, second succeeds) |
| CS-2021 | Tour: Activity License Expiry with the borrower side |
| CS-2031 / CS-2041 / CS-2051 | Tours: Authorization, Delegation, IBAN Review |
| CS-1863 | Tour: Request compliance documents |
| CS-1861 | Tour: Reactivate an On Hold EDD case |
| CS-1869 / CS-1871 | SCF companies: matrix disabled / enabled |
| CS-2002, 2003, 2012, 2013, 2022, 2023, 2032, 2052, 1865, 1867 | Explore: other variants (review-only and ownership CoC, ZATCA no renewal, decided and closed requests, On Hold) |
| CS-2101 – CS-2108 | Practice scenarios 9–16 |

Tours and scenarios reset their own cases when started or restarted.

## Structure

```
src/domain       pure business rules (SLA, transitions incl. On Hold, requirements for every case type)
src/mock         fictional seed data (seed.ts, seedLifecycle.ts), master data (license mapping, permissions),
                 simulated integrations (SPL, ZATCA, Mozn, Masdr, Wathq, AOA bot, Yakeen, borrower tasks)
src/store        CLM simulator state; every action writes the activity log
src/clm          the CLM replica UI
  features/case-workspace/lifecycle/   CoC, ZATCA, License Expiry, Authorization, Delegation, IBAN sections
  features/compliance/                 Request compliance documents (UC008)
  features/borrower/                   simulated borrower-side view (UC008, UC009)
src/training     the Academy layer
  tours/           walkthrough engine (TourHost) + 14 tour configs (tours.ts, toursPhase2.ts)
  practice/        16 scenario configs + practice panel
  knowledge/       35 sourced articles + search (EN/AR)
  assistant/       Ask CLM: knowledge-search engine, API client, panel
  help/            contextual help tips
server/          ASSISTANT_INTEGRATION.md — contract for a real AI backend
docs/ANALYSIS.md source analysis, discrepancy log, open questions
```

### Guided walkthroughs

- **Structure and logic** live in `src/training/tours/tours.ts`: targets (`data-tour` anchors), routes, and `done(ctx)` / `wrong(ctx)` checks evaluated against live state.
- **Wording** lives in `src/training/tours/content/en.ts` and `content/ar.ts`, keyed by the same tour and step ids. Shared controls (Back, Next, Skip, etc.) are in `i18n.ts`.
- **Language:** trainees choose English or العربية in the tour card or on the Guided learning page. The choice is saved, and it changes the walkthrough text only; the CLM screens always stay in English. Arabic text keeps CLM labels such as Status and In Progress in English so they match the screen.
- **Missing translations** fall back to English with a console warning in development. A unit test fails if any step lacks Arabic text.
- **Card placement** is handled by `placement.ts`. The card never covers the highlighted control, an open dropdown, a dialog or the Ask CLM panel. When no space fits, it docks to a screen corner, then narrows or collapses. The dim overlay never captures clicks on the highlighted control, and dropdowns and dialogs open above it.
- **Adding a tour:** add anchors to the components, a config in `tours.ts`, and entries in both content files.

## Case types (Phase II)

| Case type | What the trainee does | Blocks closing |
| --- | --- | --- |
| Change of Circumstance | Review Detected Changes; when a signatory left, update and save Signing Authority | Any resolution, while a document lists the departed signatory |
| ZATCA Certificate Expiry | Retry retrieval (success, no renewal, service failure) | Approval, until a renewed certificate is saved |
| Activity License Expiry | Follow the borrower task, view the borrower side, configure and approve, or reject with a reason | Any resolution, until uploaded and decided |
| Authorization Request | Adjust permissions, approve with confirmation, or reject with a reason | Any resolution, until decided |
| Delegation Request | Select or add (Yakeen-verified) delegators, approve, or reject with a reason | Any resolution, until decided |
| IBAN Review | Approve, or reject with a reason | Any resolution, until decided |
| Request compliance documents (action) | Request documents; rows show Pending → Uploaded; one borrower task | — |

Other changes: optional approval reason ("-" when empty), searchable dependent license dropdowns, mandatory license dates, SCF authorization matrix (SCF + enabled only, OR signing), Facility signing limit (empty = No Limit), On Hold status (migration only, SLA paused, Kanban column and filter). Decisions and retries require the case to be In Progress.

## Implementation status

**Fully implemented and tested (unit tests + browser run-through)**
- Tours 1–6 run end to end in the browser: spotlight, navigation, dialogs, action detection, auto-advance, completion card, next-tour chaining.
- Practice: "Pending AML review" scenario in the browser, covering mistake detection, restart, completion and progress. The task checks for the "Need Info" scenario are unit-tested.
- Ask CLM knowledge-search mode, verified in the browser:
  - case-aware "why can't I approve" answers with links to the blocking sections;
  - Arabic questions answered in Arabic;
  - an honest "not found" for questions outside the documentation;
  - citations on every answer.
- Knowledge Base search and article pages; entity view from the client name link; persistence across refresh; Activity License Save/Cancel with validation; closed-case read-only.

**Phase II — fully implemented and tested (unit tests + browser run-through)**
- All six new case workspaces, each run end to end in the browser: Change of Circumstance (signatory left → update signing → close), ZATCA expiry (fail → retry → renewed → close), Activity License Expiry (borrower upload → configure → approve → close), Authorization (adjust → confirm → close), Delegation (Yakeen add → approve → close), IBAN (reject with reason → close).
- Request compliance documents: Pending rows, no duplicates, one borrower task, simulated borrower upload → Uploaded.
- On Hold: migration-only status, SLA pause/resume, Kanban column, status filter, reactivation.
- Optional approval reason ("-"), dependent searchable license dropdowns, mandatory license dates, SCF matrix (enabled vs disabled company), Facility signing limit field.
- All 8 new tours run to completion in the browser (License Expiry in Arabic, the rest in English); the License and Close EDD tours re-run with the new license rules. One practice scenario (IBAN) run to completion; the others are unit-tested for starting state.

**Phase II — implemented, not browser-verified**
- Practice scenarios other than "Decide an IBAN review".
- New tours in Arabic other than Activity License Expiry (content is unit-tested for completeness).
- CoC review-only and ownership variants (CS-2002, CS-2003), ZATCA "no renewal" (CS-2013) beyond rendering.

**Implemented, not browser-verified in this pass**
- Practice scenarios other than "Pending AML review" (their checks are unit-tested for starting state).
- Exiting a tour midway and resuming with Continue.
- Kanban drag and drop.
- Help tips' "Read more", the KYB failed retry on CS-1853, comment edit/delete.

**Partially implemented**
- Arabic: questions and knowledge search are bilingual, and every article has an Arabic summary. The CLM interface labels are English only, as in the reference screens.

**Requires external integration**
- A real AI model behind Ask CLM. The contract and client are ready; the server is not built (see `server/ASSISTANT_INTEGRATION.md`).

**Deferred — no confirmed requirements or screens**
- Dashboard, Individuals, Lifecycle / AML / Operations modules and the full Entity Profile (users, timeline, group structure).
- Notifications content, case reopening, escalation outcome. See the open questions in `docs/ANALYSIS.md`.

## GitHub Pages deployment

In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. Do not publish the `main` branch directly: its `index.html` is Vite's source entry and cannot run without compilation. A branch-based Pages build can overwrite a successful production deployment with this source HTML, resulting in a white screen.

The `Deploy to GitHub Pages` workflow runs the tests, builds the app, validates the compiled entry, and publishes only `dist/`. Hash routing and relative asset URLs support the `/clm-academy/` project path without changing application behavior.
