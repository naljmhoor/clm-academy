// English wording for the Phase II walkthroughs. Keys match ../toursPhase2.ts.
import type { TourContent } from '../i18n';

const START = {
  title: 'Start work on the case',
  body: 'Decisions and retries only work while the case is In Progress. If you try earlier, CLM tells you to move it to In Progress first.',
  action: 'Change the Status to In Progress.',
};

export const EN_PHASE2: TourContent = {
  coc: {
    title: 'Change of Circumstance',
    summary: 'Read detected changes, find the required action, update signing authority after a signatory leaves, and close the case.',
    steps: {
      changes: {
        title: 'Detected Changes',
        body: 'CLM compared the company’s latest registered data with what it holds. Each row shows the changed field, the previous and new value, and the Required action: Review only, Review ownership or Update configuration.',
      },
      required: {
        title: 'What blocks closing',
        body: 'A signatory has left the company, and some signing documents still list them. Until the signing authority is updated and saved, this case can’t be closed with any resolution.',
      },
      start: START,
      'open-signing': {
        title: 'Go to the signing authority',
        body: 'Update Signing Authority opens the Ownership & Management tab at the Signing Authority section.',
        action: 'Click Update Signing Authority.',
      },
      ownership: {
        title: 'Ownership & Management Changes',
        body: 'Here you can see who was removed and whose percentage changed. The remaining owner now holds 100%.',
      },
      fix: {
        title: 'Replace the departed signatory',
        body: 'Documents marked Impacted still list a person who is not active (shown struck through in red). Remove them from each impacted document; keep at least one active signatory. The Facility Contract also has an optional Facility signing limit — empty means No Limit.',
        action: 'Remove the not-active signatory from every impacted document, then click Save changes.',
      },
      confirm: {
        title: 'Confirm the changes',
        body: 'CLM summarises what changes before saving.',
        action: 'Click Confirm.',
      },
      close: {
        title: 'Close the case',
        body: 'The Required Before Closing card is gone. Close the case as Approved. The approval reason is optional; if you leave it empty, "-" is recorded.',
        action: 'Change the Status to Closed, select Approved and click Done.',
      },
      resolution: {
        title: 'Resolution',
        body: 'The Resolution tab shows the outcome and reason ("-" when no approval reason was entered). The case is now read-only.',
      },
    },
  },
  'zatca-expiry': {
    title: 'ZATCA Certificate Expiry',
    summary: 'Retry the ZATCA retrieval, handle a failed call, and resolve the case once a renewed certificate is found.',
    steps: {
      banner: {
        title: 'The certificate expired',
        body: 'CLM opened this case because the ZATCA certificate expired and the automatic retrieval found no renewal. The banner tells you what to do next.',
      },
      history: {
        title: 'Retrieval history',
        body: 'Every attempt is recorded: when it ran, who triggered it (System or a user), the result and details.',
      },
      start: START,
      retry: {
        title: 'Retry the retrieval',
        body: 'Ask ZATCA again for a renewed certificate.',
        action: 'Click Retry retrieval.',
      },
      again: {
        title: 'The call failed',
        body: 'ZATCA could not be reached this time — the banner turned red and the attempt is logged as Failed. Service errors are temporary; try again.',
        action: 'Click Try again.',
      },
      renewed: {
        title: 'Renewed certificate found',
        body: 'The renewed certificate is saved with status Valid, and the Required Before Closing item has disappeared.',
      },
      close: {
        title: 'Resolve the case',
        body: 'With a valid certificate, close the case as Approved.',
        action: 'Change the Status to Closed, select Approved and click Done.',
      },
    },
  },
  'license-expiry': {
    title: 'Activity License Expiry',
    summary: 'Follow the borrower task, see the borrower side, then configure and approve the renewed license.',
    steps: {
      expired: {
        title: 'The expired license',
        body: 'Only this license is affected. Its category, authority, dates and document are shown for reference.',
      },
      task: {
        title: 'Borrower task',
        body: 'CLM created a "Renew Activity License" task for the borrower. It shows Pending upload until the borrower uploads, and you can’t close the case before that.',
      },
      borrower: {
        title: 'See the borrower side',
        body: 'Open the simulated borrower view to see the task and the notifications the borrower receives.',
        action: 'Click View borrower side.',
      },
      upload: {
        title: 'Act as the borrower',
        body: 'This is a simulation of the borrower app. Upload the renewed license as the borrower would.',
        action: 'Click the upload button in the borrower view.',
      },
      back: {
        title: 'Back to CLM',
        body: 'The task is completed and the document is now visible in the case.',
        action: 'Close the borrower view.',
      },
      start: START,
      configure: {
        title: 'Configure and approve',
        body: 'Review the uploaded document, then fill License category, Issuing authority (filtered by category), Issue date and Expiry date. Approving saves it as the new Activity License, and CLM starts monitoring its expiry date.',
        action: 'Complete the four fields and click Approve license.',
        wrong: 'The license was rejected. That is allowed (with a reason sent to the borrower), but this tour expected an approval — Restart to practise again.',
      },
      close: {
        title: 'Close the case',
        body: 'The resolution follows your decision, so it is already set to Approved.',
        action: 'Change the Status to Closed and click Done.',
      },
    },
  },
  authorization: {
    title: 'Authorization Request',
    summary: 'Review the requester, adjust requested permissions, approve with confirmation and close.',
    steps: {
      requester: {
        title: 'Who is asking',
        body: 'The requester’s details and supporting document. ID and phone are masked — use the eye icon to reveal them when you need to check. All training data is fictional.',
      },
      permissions: {
        title: 'Requested permissions',
        body: 'The borrower’s request is pre-selected. You can remove or add permissions before approving. A child permission needs its parent: selecting Request Withdrawal also selects View Wallet.',
      },
      start: START,
      approve: {
        title: 'Approve the request',
        body: 'At least one permission must be selected to approve.',
        action: 'Click Approve authorization.',
      },
      confirm: {
        title: 'Confirm Approval',
        body: 'The selected permissions will be granted and the request status changes to Accepted.',
        action: 'Click Approve authorization in the dialog.',
        wrong: 'The request was rejected. That is allowed with a reason, but this tour expected an approval — Restart to practise again.',
      },
      granted: {
        title: 'Granted permissions',
        body: 'The section now shows how many permissions were granted. View permissions opens the full list.',
      },
      close: {
        title: 'Close the case',
        body: 'The case can only be closed after a decision. The resolution follows it.',
        action: 'Change the Status to Closed and click Done.',
        wrong: 'The decision recorded on this case is not an approval. Restart to practise again.',
      },
    },
  },
  delegation: {
    title: 'Delegation Request',
    summary: 'Review delegated permissions, add a delegator verified with Yakeen, approve and close.',
    steps: {
      permissions: {
        title: 'Delegated permissions',
        body: 'What the borrower wants to delegate: primary (legal document) and system permissions. They are read-only in this case.',
      },
      delegators: {
        title: 'Delegators',
        body: 'People the borrower listed. One has no verified name yet — you can’t approve with an unverified delegator until you edit them and add the date of birth.',
      },
      start: START,
      add: {
        title: 'Add a delegator',
        body: 'You can add someone the borrower did not list.',
        action: 'Click Add delegator.',
      },
      yakeen: {
        title: 'Verify with Yakeen',
        body: 'Enter a 10-digit National ID or Iqama (starting with 1 or 2) and a Hijri date of birth such as 1410-05-21. The name comes from Yakeen (simulated). Phone is optional. Use invented values only.',
        action: 'Fill the ID and date of birth, then click Add delegator.',
      },
      approve: {
        title: 'Approve the request',
        body: 'The new delegator is selected. At least one selected, verified delegator is needed.',
        action: 'Click Approve request.',
        wrong: 'The request was rejected. Restart the tour to practise the approval.',
      },
      sent: {
        title: 'Sent to the delegator',
        body: 'Each selected delegator receives the request and shows Pending, then Approved when they respond. You don’t need to wait for them to close the case.',
      },
      close: {
        title: 'Close the case',
        body: 'The resolution follows your decision.',
        action: 'Change the Status to Closed and click Done.',
        wrong: 'The decision recorded on this case is not an approval. Restart to practise again.',
      },
    },
  },
  iban: {
    title: 'IBAN Review',
    summary: 'Review a failed IBAN verification and reject it with a mandatory reason.',
    steps: {
      review: {
        title: 'Why this case exists',
        body: 'Automatic bank-account verification failed and the borrower asked for a review. Compare the account name with the company and check the bank letter. The IBAN is fictional and masked.',
      },
      start: START,
      reject: {
        title: 'Reject the IBAN',
        body: 'In this scenario the account name doesn’t match the company, so the IBAN should be rejected.',
        action: 'Click Reject.',
      },
      reason: {
        title: 'Give a reason',
        body: 'A rejection reason is mandatory. The borrower is informed and the IBAN is not saved.',
        action: 'Type a reason and click Reject IBAN.',
        wrong: 'The IBAN was approved. In this scenario it should be rejected — Restart to practise again.',
      },
      close: {
        title: 'Close the case',
        body: 'The resolution is set to Rejected and the reason is carried over.',
        action: 'Change the Status to Closed and click Done.',
        wrong: 'The decision recorded on this case is not a rejection. Restart to practise again.',
      },
    },
  },
  'compliance-docs': {
    title: 'Request compliance documents',
    summary: 'Request documents from the borrower, follow Pending → Uploaded, and see the borrower task.',
    steps: {
      documents: {
        title: 'Documents tab',
        body: 'Request documents is an action, not a case: it creates one borrower task and adds a row per requested document. It is available on open Due Diligence cases and in the Entity Profile.',
      },
      request: {
        title: 'Request documents',
        body: 'Open the request form.',
        action: 'Click Request documents.',
      },
      choose: {
        title: 'Choose the documents',
        body: 'Pick one or more documents. The task title (Compliance Documents Task), priority (High) and due date (one month) are set automatically. Documents already pending can’t be requested twice.',
        action: 'Select at least one document and click Send request.',
      },
      pending: {
        title: 'Pending rows',
        body: 'Each requested document has a Pending row until the borrower uploads it. View and download stay disabled until then.',
      },
      borrower: {
        title: 'See the borrower side',
        body: 'Open the simulated borrower view to see the task the borrower received.',
        action: 'Click Borrower side.',
      },
      upload: {
        title: 'Act as the borrower',
        body: 'Upload one of the requested documents as the borrower.',
        action: 'Click an upload button in the borrower view.',
      },
      uploaded: {
        title: 'Uploaded',
        body: 'Close the borrower view: the row now shows Uploaded, with the borrower as uploader. The same record is updated — no duplicate is created.',
        action: 'Close the borrower view.',
      },
    },
  },
  'reactivate-on-hold': {
    title: 'Reactivate an On Hold EDD case',
    summary: 'Find On Hold cases, read why they are paused, and move one back to In Progress.',
    steps: {
      find: {
        title: 'On Hold cases',
        body: 'We filtered the queue by Status: On Hold. The system migration placed EDD cases that were never started On Hold. Their SLA is paused.',
      },
      open: {
        title: 'Open the case',
        body: 'Open CS-1861.',
        action: 'Click CS-1861.',
      },
      paused: {
        title: 'Paused SLA',
        body: 'The SLA shows Paused. Time spent On Hold does not count, and any breach recorded before the pause is kept.',
      },
      history: {
        title: 'Why it is On Hold',
        body: 'The Activity Log shows the change as a system migration entry (Open → On Hold).',
        action: 'Open the Activity Log tab.',
      },
      reactivate: {
        title: 'Reactivate it',
        body: 'On Hold can only move to In Progress. It can’t be selected manually, and cards can’t be dragged into the On Hold column.',
        action: 'Change the Status to In Progress.',
      },
      resumed: {
        title: 'SLA resumed',
        body: 'The SLA continues from where it stopped — it is not reset. For an EDD case, the EDD checks also start now.',
      },
    },
  },
};
