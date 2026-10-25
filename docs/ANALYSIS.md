# CLM Academy — Source Analysis (Phase 0)

Sources reviewed

| Source | What it covers |
| --- | --- |
| 37 screenshots (design / staging) | Case Queue (table, kanban, drag, filters), EDD workspace: Overview, Ownership & Management, Activity License, Documents, Resolution, all dialogs |
| Screen recording, 117 s (staging `/admin/v2/clm`) | Queue search/filter behaviour, empty state, opening a case, Open → In Progress triggering integrations, Masdr retrieval, signing-authority editing, Entities list, client-name link to legacy admin |
| BRD "CLM BRD Phase I" (Confluence 4439572585) | UC001–UC014, case catalog, MVP scope, approval preconditions + messages, permission matrix |

Data handling: the screenshots and recording contain national-ID-style numbers and individuals' names. None of them are reused. All data in the training app is synthetic and generated in `src/mock/seed.ts`.

---

## 1. Screen inventory

| # | Screen / state | Source | Phase 1 |
| --- | --- | --- | --- |
| S1 | App shell: sidebar (Main, Sections, "soon" groups, user footer), header with sidebar toggle + breadcrumbs + bell | All | Built |
| S2 | Case Queue — Table view (sortable Created Date, inline Status / Priority / Assignee, pagination, rows-per-page) | Shot 1, rec 0–52 s | Built |
| S3 | Case Queue — Kanban view (Open / In Progress / Need Info / Closed with counts, cards, drag + drop-zone highlight) | Shots 2, 3, 6 | Built |
| S4 | Filters popover — picker → filter rows (Case Type, Case Status, Assignee, Priority, SLA Status, Date Range), per-row delete, Apply / Clear all, active-count badge on button | Shots 4, 5, rec 6–20 s | Built |
| S5 | Queue empty state "No cases yet — No cases match the current filters…" | Rec 24.5 s | Built |
| S6 | Workspace header: Case ID, case-type badge, Priority + Status dropdowns; breadcrumbs `CLM › Case Queue › CS-xxxx` | All workspace shots | Built |
| S7 | Overview: Entity Details, KYC, KYB (+ activities drawer), National Address, VAT & Zakat, AML screening, Workforce (Masdr), Comments & activity | Shots 7–14, rec 53–78 s | Built |
| S8 | National Address states: not retrieved (red helper text), retrieved, edit dialog (Short Address / Manual entry), Confirm Changes diff | Shots 10, 15–18 | Built |
| S9 | Masdr states: not retrieved (CTA), loading, retrieved, failed (page banner + Try again) | Shots 13–14, rec 74–78 s | Built |
| S10 | Ownership & Management: Owners & Executives, Ownership Hierarchy (recursive Retrieve Ownership), AOA unavailable banner + Upload, Signing Authority (default manager, per-document multiselect, product-specific documents), Bot Result dialog | Shots 19–26, rec 80–94 s | Built |
| S11 | Activity License: configured license cards, Add license, delete, category / authority / dates, file view / download / upload | Shot 27 | Built |
| S12 | Documents: table, upload dialog | Shots 28–29 | Built |
| S13 | Comments (composer with attach + mention, sort, edit menu, attachments) and Activity Log | Shots 30–31 | Built |
| S14 | Status menu, Need Info dialog, Required Before Closing card, "Case can't be closed yet" dialog, Mark-as-Closed dialog | Shots 32–36 | Built |
| S15 | Closed case: fixed Closed pill, Resolution tab, System Recorded card, SLA Time Tracking | Shot 37, rec 37–41 s | Built |
| S16 | Entities list (Client ID, Client Name, Client Type, CR, Unified Number, Status; search; filters) | Rec 102–110 s | Built (list only) |
| S17 | Legacy admin company profile (target of Client Name link) | Rec 105–115 s | Not replicated — the link opens an explanation dialog |
| S18 | Individuals, Dashboard, Lifecycle, AML & Compliance, Operations pages | Sidebar only | Not available — no source material |

## 2. Component inventory (`src/clm/components/ui`)

| Component | Variants / notes | Used by |
| --- | --- | --- |
| `Button` | primary (black), secondary (outline), ghost, danger-text, icon | Everywhere |
| `Badge` | neutral, blue (case type / "Manually completed"), green, red, orange, purple, gray; `pill` and `chip` sizes | Status, KYC, AML, consent, SLA |
| `StatusPill` / `PriorityPill` / `SlaChip` | inline dropdown triggers that match the queue look | Queue, Kanban, header |
| `Menu` / `Popover` | click-outside close, keyboard Esc | Dropdowns, filters, comment kebab |
| `Select` | single select with optional search | Filters, address, licenses, default manager |
| `MultiSelect` | tag chips with ✕, search, checkboxes | Filters, signatories |
| `Dialog` | header with title + optional transition chips, footer actions | All modals |
| `Drawer` | right side sheet | Entity activities |
| `Tabs` | underline tabs (workspace), segmented (Short Address / Manual entry), toggle (Table / Kanban) | Workspace, address dialog |
| `SectionCard` | grey header bar, title, sub-text (normal or red), header actions (edit / refresh / collapse) | All EDD sections |
| `RailCard` | right-rail collapsible card | SLA, Assignment, Consent, Required, System Recorded |
| `DataGrid` / `Field` | label + value pairs in a 4-column grid | KYB, address, VAT, Masdr |
| `Table` | bordered, grey header row | KYC, owners, documents, queue |
| `Avatar` | initials, "unassigned" dashed circle | Assignee, comments |
| `Toast` | success / error, top-right, auto-dismiss | Integrations, saves |
| `FileInput` | "Choose file / No file chosen" style | Upload dialogs, licenses |
| `DateInput` | "Pick a date" with calendar icon (native date picker) | Licenses, filters |
| `EmptyState` | icon + title + body + optional action | Queue, comments, Masdr |

## 3. Interaction → requirement mapping

| Interaction | Screens | BRD | Implementation note |
| --- | --- | --- | --- |
| Switch Table/Kanban, keep search & filters | S2, S3 | UC001 BR-2 | One `queueView` state shared by both views |
| Search by Case ID or client name | S2 | UC001 | Case-insensitive contains |
| Filters + Apply / Clear all | S4 | UC001 Available Filters | Draft vs applied filter sets |
| Sort Created Date | S2 | UC001 (Newest → Oldest) | Toggle asc / desc |
| Inline status / priority / assignee change, logged | S2, S3, S6 | UC001 BR-1, BR-4 | Single store action → activity log entry → reflected everywhere |
| Drag card between columns | S3 | UC001 (status change) | Same transition rules and dialogs as the dropdown |
| SLA chip and rail card | S2, S3, S7 | UC001 SLA rules | <75 % On Track, 75–<100 % At Risk, ≥100 % Breached; paused in Need Info; stops at Closed |
| Open → In Progress runs the EDD jobs | Rec 63–70 s | UC013 Main flow 1–2 | SPL, ZATCA, AML, AOA run with simulated latency |
| KYC table (read-only) | S7 | UC004 | Verified only when all criteria met |
| KYB retrieved / failed / retry | S7 | UC005 | Retry with cooldown |
| Address retrieve / retry / short address / manual / review / confirm | S8 | UC006 | Short-address format AAAA9999; required fields City, Street, District, Postal code; source recorded |
| VAT & Zakat retrieved / failed / manual VAT | S7 | UC007 | "Manually completed" badge |
| AML company + owners, pending review decisions | S7 | UC008 | Verified only when all Clear / Approved; Reject closes the EDD |
| Masdr on demand, never blocks | S9 | UC009 | Not part of preconditions |
| Owners & Executives, refresh with cooldown | S10 | UC012 | |
| Ownership hierarchy, recursive retrieval | S10 | UC012 | Each corporate node retrieved independently |
| AOA unavailable → upload → bot result → Apply / Edit manually | S10 | UC011 | |
| Signing authority per document, 1 = single, ≥2 = all must sign | S10 | UC012 | Default authorized manager mandatory |
| Activity licenses configure / add / remove | S11 | UC010 | Required only when borrower-uploaded licenses exist |
| Documents view / download / upload | S12 | UC013 Document Section | |
| Comments with mention / attachment; activity log | S13 | UC002 | |
| Need Info with required details | S14 | UC001, UC013 AF-1 | Details saved as a comment |
| Close: Approved validates preconditions; Rejected always allowed; reason mandatory | S14 | UC013 BR | Blocking dialog lists incomplete items, each links to its section |
| Required Before Closing card, live | S14 | UC013 AF-3 | Recomputed from state on every change |
| Closed case read-only + Resolution tab | S15 | UC002 | |

## 4. Discrepancies (screens vs BRD vs each other)

| # | Topic | What we see | Decision for the training build |
| --- | --- | --- | --- |
| D1 | Case-type label | "EDD" (queue design) vs "Due Diligence" (workspace, staging) | Use "Due Diligence" everywhere (staging) |
| D2 | Manual address form | "Additional number" appears twice; the second holds the short address | Single Additional number field; Short address field kept once |
| D3 | Status values | Queue design shows Approved / Rejected as statuses; Kanban and BRD use Closed + resolution | Status = Open / In Progress / Need Info / Closed; queue shows the resolution label for Closed cases (matches staging) |
| D4 | Typos | "changesbefore", "Upload a Documents", "Assignment of processed", "In-Progress" | Corrected |
| D5 | Facility Contract summary | Header says "3 signatories · all must sign" while 1 is selected | Summary is derived from the selection |
| D6 | Signing Authority messages | Card: "2 of 3 signatories are missing an ID document"; dialog: "not retrieved from the bot or entered manually"; BRD: "All required signing permissions must have at least one assigned signatory"; staging: "Still required: a signatory on …" | BRD rule; staging-style message listing the missing documents |
| D7 | Activity Log wording | "Resolution: In progress → Approve" vs badge "Approved" | "Approved" |
| D8 | Approval preconditions | Screenshots list 3 items; BRD lists 9 | BRD's 9 |
| D9 | License 2 data | Card says "no issuing authority" but authority is selected | Messages are computed from state |
| D10 | License dates | UI marks Issue / Expiry date required; BRD requires only category, authority and the document | Dates shown and optional — question Q4 |
| D11 | Signing Authority save | Screenshots: Save changes / Cancel; staging: auto-saves on each change | Save changes / Cancel |
| D12 | Closed case comments | BRD: closed cases read-only; screenshot: comment box still active | Comments allowed, all EDD edits locked — question Q6 |
| D13 | Entity activities | Design shows 2 rows + "View all 24"; BRD: "View all" when more than 7; staging shows 3 rows | First 3 rows, "View all" when there are more |
| D14 | Need Info sample text | Reads like an adjudication note | Example placeholder rewritten as an information request |
| D15 | Closed-case dates | Closed Date = Created Date with Time Tracking 3h | Computed from events |
| D16 | Approve outcome set | BRD §3.4: Approve / Escalate / Reject; UC002/UC013: Approved / Rejected | Approved / Rejected — question Q2 |
| D17 | Masdr permission | BRD matrix cites UC016 for Masdr, UC014 for ZATCA, UC015 for AML — numbering doesn't match the UC list | Noted only |

## 5. Open questions for Product / Operations

1. Allowed status transitions. Can a case go back to Open? Can Open go straight to Need Info or Closed? (Training build: Open → In Progress / Closed; In Progress → Need Info / Closed; Need Info → In Progress / Closed; Closed is final.)
2. Is "Escalate" a resolution in MVP (BRD §3.4)?
3. Which Signing Authority documents apply to which product (standard, CapEx, SCF), and are CapEx / SCF documents mandatory?
4. Are license Issue / Expiry dates mandatory?
5. AML Pending Review is resolved on the owner/company AML page, which is outside CLM MVP. Should training simulate that decision in place? (Training build: yes, in a dialog, clearly labelled.)
6. Is a closed case fully read-only, including comments?
7. Who can close a case (permission matrix has no "Close case" permission)?
8. What is the KYB / Wathq / SPL cooldown period?
9. Individuals page, Dashboard, Lifecycle, AML & Compliance, Operations — no screens available.

## 6. Missing source material

- Individuals list and any entity / individual profile inside CLM.
- KYB failed state, ZATCA failed state, AML Pending Review / Rejected / Failed states, AOA extraction-failed state.
- Assignment change UI in the workspace (only a chevron is visible).
- Document preview viewer.
- Notifications (bell) and the floating help (?) button behaviour.

## 7. Architecture

```
clm-academy/
  docs/ANALYSIS.md            this file
  src/
    app/                      App, router, providers
    clm/                      the CLM replica (no training code inside)
      components/ui/          design-system primitives
      components/layout/      Sidebar, Header, AppShell
      features/case-queue/    table, kanban, filters, inline editors
      features/case-workspace/ header, tabs, sections, rail cards, dialogs
      features/entities/      Entities list
    domain/                   types, SLA engine, status transitions, EDD validation (pure functions)
    mock/                     seed data + simulated integrations (SPL, ZATCA, AML, Masdr, Wathq, AOA bot)
    store/                    zustand store: cases, entities, users, actions, activity logging
    training/                 training layer (Phase 2+): mode bar, scenarios, walkthrough engine,
                              knowledge base, assistant contract
```

Rules:
- `domain/` is pure TypeScript and has no React imports. Business rules (SLA, preconditions, transitions, KYC verdict, AML roll-up) live here, so walkthroughs and the assistant can reuse them to explain validation errors.
- `mock/integrations.ts` is the only place that simulates external systems. Each case carries a `scenario` object that sets outcomes (succeed / fail / fail-then-succeed). Training scenarios set up exercises by editing this object.
- `store/` exposes intent-level actions (`changeStatus`, `confirmAddress`, `applyBotResult` …). Every action writes an activity-log entry, so the training engine can watch for those events to advance a walkthrough step.
- The training layer stays outside `clm/`. In Phase 1 it is limited to the mode bar with Reset. The CLM UI exposes stable `data-tour` anchors for the future spotlight engine.

### Assistant integration contract (Phase 3)

```ts
interface AssistantRequest {
  question: string;
  locale: 'en' | 'ar';
  context: { route: string; caseId?: string; tab?: string; incompleteItems?: string[]; lastError?: string };
}
interface AssistantAnswer {
  answer: string;
  status: 'answered' | 'not_found' | 'unverified';
  citations: { sourceId: string; title: string; section?: string; url?: string }[];
  suggestedActions?: { label: string; route?: string; walkthroughId?: string }[];
}
```

The frontend will call one `POST /assistant/answer` endpoint. Until a retrieval service exists, the UI will show "Assistant not connected" and will not generate answers.

## 8. Phase plan

| Phase | Scope |
| --- | --- |
| 1 (this build) | CLM replica: shell, Case Queue, EDD Case Workspace, Entities list, mock data and integrations, Reset |
| 2 | Training layer: Guided / Explore modes, spotlight walkthrough engine, the four walkthroughs, scenario presets |
| 3 | Knowledge base (BRD-derived articles) and Ask CLM Assistant shell against the contract above |
| 4 | Arabic UI strings (RTL chrome), remaining modules once screens exist |

---

## 9. Enhancement pass — audit findings and decisions

| # | Finding | Action |
| --- | --- | --- |
| A1 | The client-name link opened an explanation dialog instead of a profile | Now opens a read-only entity view (Summary, Stakeholders, Cases, Documents) built from data CLM holds. A banner states that the full Entity Profile is post-MVP (BRD 3.3 #10) |
| A2 | Activity License changes saved instantly; the BRD and screens call for an explicit save | Each license card keeps a draft with Save / Cancel. A new license is only added on Save, and a document is required |
| A3 | No KYB-failed, consent-pending or AML missing-information examples | Added case CS-1853 with all three |
| A4 | Primary-button colour overrides (red / indigo) lost to the base class | Added `danger` and `academy` button variants |
| A5 | Knowledge search matched unrelated questions on generic words | Whole-word matching; generic keywords removed; covered by a unit test |
| D18 | Need Info example text in the screens reads like an adjudication note | Placeholder rewritten as an information request (unchanged from D14) |
| D19 | Signing Authority: the screens show Save changes; staging auto-saves each selection | Kept Save changes / Cancel (screens are the primary UI reference) |

Training-only behaviours, labelled in the UI:
- The AML decision is made in a dialog on the case (live CLM uses the owner or company AML page).
- The entity view is assembled from case data.
- Ask CLM runs in knowledge-search mode.
