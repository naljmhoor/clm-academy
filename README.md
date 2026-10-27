# CLM Academy

CLM Academy is an interactive training environment for Manafa's Client Lifecycle Management (CLM) platform. It combines a realistic CLM simulator with a training layer: guided tours, practice scenarios, a knowledge base and the Ask CLM assistant.

Everything is simulated. The app never calls a Manafa system, and every company, person, ID and document in it is fictional.

## Run, test, build

```bash
npm install
npm run dev          # http://localhost:5180 (opens CLM Academy home)
npm test             # 24 unit tests: domain rules, seed, tours, practice, knowledge search, Ask CLM
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

Tours and scenarios reset their own cases when started or restarted.

## Structure

```
src/domain       pure business rules (SLA, transitions, EDD preconditions)
src/mock         fictional seed data + simulated integrations (SPL, ZATCA, Mozn, Masdr, Wathq, AOA bot)
src/store        CLM simulator state; every action writes the activity log
src/clm          the CLM replica UI
src/training     the Academy layer
  tours/           walkthrough engine (TourHost) + 6 tour configs
  practice/        8 scenario configs + practice panel
  knowledge/       25 sourced articles + search (EN/AR)
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
