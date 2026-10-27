// English walkthrough content. Keys match tour and step ids in ../tours.ts.
import type { TourContent } from "../i18n";

export const EN: TourContent = {
  "intro": {
    "title": "Introduction to CLM",
    "summary": "What CLM is, how cases arrive, and how to read the Case Queue: statuses, priorities, SLA and assignment.",
    "steps": {
      "welcome": {
        "title": "Welcome to CLM",
        "body": "Client Lifecycle Management (CLM) is the single workspace where Operations receive, investigate and resolve client cases — from onboarding reviews to final decisions. It replaces several disconnected admin screens."
      },
      "why": {
        "title": "Why Manafa introduced CLM",
        "body": "Client information was spread across pages, compliance reviews ran in separate tools and work was allocated manually. In CLM every case has one owner, a status, a timeline and an auditable decision record."
      },
      "nav": {
        "title": "The Case Queue",
        "body": "Your work starts here. The Case Queue lists every case you have access to. Other menu items marked \"soon\" are not part of this release."
      },
      "intake": {
        "title": "How cases enter CLM",
        "body": "Cases are created by the system, not by hand. In this release the case type is Enhanced Due Diligence (EDD): CLM opens one automatically when a company completes registration, or for an existing company that never reached Compliance Done."
      },
      "status": {
        "title": "Statuses",
        "body": "Open — waiting to start. In Progress — someone is working on it. Need Info — waiting for information (the SLA pauses). Closed — decided as Approved or Rejected. Click a status to change it; the same rules apply everywhere."
      },
      "priority": {
        "title": "Priority",
        "body": "High, Medium or Low. Use it to order your work. Priority can be changed inline and every change is recorded in the case Activity Log."
      },
      "sla": {
        "title": "SLA status",
        "body": "Green = under 75 % of the SLA used, orange = At Risk (75 % to under 100 %), red = Breached. The chip shows time left or time overdue. Closed cases show \"SLA met\" or how late they were."
      },
      "assignee": {
        "title": "Assignment",
        "body": "Each case should have one owner. Click the assignee to assign or reassign. Unassigned cases show a dashed circle."
      },
      "views": {
        "title": "Table and Kanban",
        "body": "Switch to Kanban to see cases grouped by status; you can drag a card to another column. Your search and filters stay applied when you switch."
      },
      "filters": {
        "title": "Search and filters",
        "body": "Search by Case ID or client name. Filters cover Case Type, Status, Assignee, Priority, SLA Status and Date Range — pick the filters, then Apply Filter."
      },
      "open": {
        "title": "Open a case",
        "body": "We filtered the queue to CS-1847. Clicking the Case ID opens the Case Workspace; clicking the client name opens the client profile.",
        "action": "Click CS-1847 to open the case."
      },
      "workspace": {
        "title": "The Case Workspace",
        "body": "Everything about the case is here: the header (ID, type, priority, status), tabs for each part of the review, comments and activity at the bottom, and SLA, assignment and consents on the right. Continue with \"Process your first EDD case\" to work this case."
      }
    }
  },
  "first-edd": {
    "title": "Process your first EDD case",
    "summary": "Take an Open EDD case, assign it, start work and read the verification results and remaining requirements.",
    "steps": {
      "pick": {
        "title": "Select an Open EDD case",
        "body": "CS-1847 is a new Due Diligence case that nobody has picked up yet.",
        "action": "Open CS-1847."
      },
      "summary": {
        "title": "Review the case summary",
        "body": "The header shows the Case ID, the case type (Due Diligence), the priority and the current status: Open. Nothing has run yet — the automated checks start when you begin work."
      },
      "assign": {
        "title": "Assign the case to yourself",
        "body": "Take ownership before you start so the team knows who is working on it.",
        "action": "Open the assignee list and choose Training User."
      },
      "start": {
        "title": "Move the case to In Progress",
        "body": "Starting work runs the EDD jobs: SPL national address, ZATCA, AML screening (Mozn) and the Articles of Association retrieval (Amaly).",
        "action": "Open the Status menu and choose In Progress.",
        "wrong": "The case was closed instead. Restart the tour to try again."
      },
      "client": {
        "title": "Client information",
        "body": "Entity Details identifies the client: name, CR number, unified number and client type. Use them to confirm you are reviewing the right company."
      },
      "kyc": {
        "title": "KYC — stakeholders",
        "body": "Each stakeholder is Verified only if name, ID/Iqama, date of birth, nationality and phone are captured and Yakeen succeeded. Hover the info icon on \"Not verified\" to see the gap. At least one verified stakeholder is required."
      },
      "kyb": {
        "title": "KYB — company record",
        "body": "Company information comes from Wathq. If it fails, the reason is shown and you can retry after the cooldown."
      },
      "address": {
        "title": "Verification results arrive",
        "body": "For this company SPL could not return the national address — the section shows the failure and asks you to complete it. A failed integration never blocks you: you can retry, use the short address, or enter it manually (\"Handle missing information\" covers this)."
      },
      "aml": {
        "title": "AML screening",
        "body": "The company and every owner are screened separately. All must be Clear or Approved before the case can be approved."
      },
      "required": {
        "title": "Identify what is incomplete",
        "body": "Required Before Closing lists every mandatory item still open on this case. It updates as soon as you complete something. Click an item to jump to its section."
      },
      "prepare": {
        "title": "Preparing for resolution",
        "body": "When the list is empty you can close the case as Approved with a reason. You can reject at any time. Next tours show how to fix missing information, signing authority and licenses, and how to close the case."
      }
    }
  },
  "missing-info": {
    "title": "Handle missing information",
    "summary": "Read a failed SPL retrieval, retry it, then complete the national address manually through Review Changes and Confirm.",
    "steps": {
      "missing": {
        "title": "Identify the missing requirements",
        "body": "CS-1845 has several open items. We will fix the National Address first."
      },
      "failed": {
        "title": "A failed integration",
        "body": "SPL could not return the address. The red text tells you to complete the fields manually; the error code from SPL is shown underneath."
      },
      "retry": {
        "title": "Retry the SPL request",
        "body": "Retrying is the first step — SPL outages are often temporary. Every attempt is recorded in the activity log.",
        "action": "Click the refresh icon on National address."
      },
      "still-failing": {
        "title": "Still failing",
        "body": "SPL failed again (see the error message). Don’t wait — complete the address yourself."
      },
      "edit": {
        "title": "Open the address editor",
        "body": "The pencil opens Edit National Address with two options: look up by Short Address, or Manual entry.",
        "action": "Click the pencil icon."
      },
      "manual": {
        "title": "Choose Manual entry",
        "body": "Short Address must be 4 letters + 4 digits (e.g. RAGI2929). Here we use Manual entry.",
        "action": "Select the Manual entry tab."
      },
      "fill": {
        "title": "Fill in the address and review",
        "body": "City, District, Street name and Postal code (5 digits) are mandatory. Building and additional number are 4 digits when given. Invalid fields are highlighted when you continue.",
        "action": "Complete the mandatory fields and click Review Changes."
      },
      "confirm": {
        "title": "Review and confirm",
        "body": "Confirm Changes compares the previous and new values. Nothing is saved until you confirm; Edit takes you back.",
        "action": "Click Confirm."
      },
      "recheck": {
        "title": "Recheck completion",
        "body": "National Address is no longer in Required Before Closing, and the section shows Source: Manual entry. The same pattern — retry, then complete manually — applies to VAT (pencil on VAT & Zakat)."
      }
    }
  },
  "signing": {
    "title": "Ownership & signing authority",
    "summary": "Review owners and the ownership hierarchy, read the AOA bot suggestion, and configure individual and joint signing.",
    "steps": {
      "owners": {
        "title": "Owners & Executives",
        "body": "Retrieved from Wathq: who owns the company and who manages it. Executives have no ownership % (\"-\")."
      },
      "hierarchy": {
        "title": "Ownership hierarchy",
        "body": "One owner here is a company. Retrieve its owners to see who stands behind it; you can keep going level by level.",
        "action": "Click Retrieve Ownership on the corporate owner."
      },
      "authority": {
        "title": "Signing authority",
        "body": "For each legal document you choose who may sign. The Company Promissory Note, Facility Contract, Assignment of Proceeds and Non-objection Letter each need at least one signatory, and a default authorized manager is required."
      },
      "bot": {
        "title": "The AOA bot suggestion",
        "body": "CLM read the Articles of Association from Amaly. The bot suggests who signs each document — it is only a suggestion until you accept it.",
        "action": "Click View Bot Result."
      },
      "joint": {
        "title": "Individual vs joint",
        "body": "\"Signs individually\" = one signatory signs alone. \"Signs jointly\" = all listed signatories must sign — here the Facility Contract needs both managers.",
        "action": "Click Apply AOA result."
      },
      "docs": {
        "title": "Check the configuration",
        "body": "Each document now shows its rule, for example \"2 signatories · all must sign\". You can still open a document and change the signatories, then Save changes. CapEx documents are optional in this release (open question flagged to Product)."
      },
      "resolved": {
        "title": "Requirement resolved",
        "body": "Signing Authority has left Required Before Closing. If the AOA had been unavailable you would upload it, or configure every document manually."
      }
    }
  },
  "license": {
    "title": "Activity license",
    "summary": "Configure a borrower-uploaded license, add a new one, and see how licenses affect closing.",
    "steps": {
      "list": {
        "title": "Configured licenses",
        "body": "Each activity license links one document to a License Category and an Issuing Authority. A company can have none, one or several."
      },
      "existing": {
        "title": "Configure the borrower’s license",
        "body": "The borrower uploaded this document. View or download it, then classify it. Changes are kept as a draft until you Save.",
        "action": "Select a License category and an Issuing authority, then click Save."
      },
      "add": {
        "title": "Add a license",
        "body": "Use Add license when the company holds a license that is not on file yet.",
        "action": "Click Add license."
      },
      "new": {
        "title": "A new license needs a document",
        "body": "For a license you add, the document upload is mandatory, together with category and issuing authority. Save adds it to the case; Cancel discards the card. You can do either now."
      },
      "effect": {
        "title": "How licenses affect closing",
        "body": "If any license exists, every license must have its category and issuing authority (and a document for added ones) before the case can be approved. With no licenses, the section does not block closing. The category also drives funder eligibility (e.g. Industrial for SIDF)."
      }
    }
  },
  "close-edd": {
    "title": "Complete and close an EDD case",
    "summary": "Try to approve an incomplete case, follow the validation to fix it, close it as Approved and review the result.",
    "steps": {
      "review": {
        "title": "Review mandatory requirements",
        "body": "CS-1843 is almost done: Signing Authority and one Activity License are still incomplete."
      },
      "attempt": {
        "title": "Attempt approval",
        "body": "Let’s see what CLM does if you try to approve anyway.",
        "action": "Choose Closed, select Approved, type a reason and click Done."
      },
      "feedback": {
        "title": "Validation feedback",
        "body": "Approval is blocked and every incomplete item is listed. Each one links straight to its section. Rejecting would still be possible.",
        "action": "Click Review to go to the first item."
      },
      "signing": {
        "title": "Resolve signing authority",
        "body": "Use the AOA bot result: View Bot Result → Apply AOA result.",
        "action": "Apply the AOA result."
      },
      "license": {
        "title": "Resolve the activity license",
        "body": "Classify License 1 with a category and an issuing authority, then Save.",
        "action": "Complete License 1 and click Save."
      },
      "close": {
        "title": "Complete the resolution",
        "body": "Required Before Closing is gone — every mandatory item is complete.",
        "action": "Close the case as Approved with a resolution reason.",
        "wrong": "The case was closed as Rejected. That is allowed, but this tour expected Approved — Restart to practise again."
      },
      "resolution": {
        "title": "The closed case",
        "body": "The Resolution tab shows the outcome and your reason. The case is now read-only: edit and retry actions are gone."
      },
      "recorded": {
        "title": "System Recorded and SLA",
        "body": "Who created and closed the case and when. The SLA card now shows Time Tracking — the working time, excluding Need Info pauses."
      },
      "history": {
        "title": "Activity history",
        "body": "Every change you made — assignment, status, signing authority, license, resolution — is in the Activity Log.",
        "action": "Open the Activity Log tab."
      }
    }
  }
};
