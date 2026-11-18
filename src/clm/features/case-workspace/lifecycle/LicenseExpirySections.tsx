// UC004 Activity License Expiry (borrower side: UC009).

import { useState } from 'react';
import { MonitorSmartphone } from 'lucide-react';
import { useClm, useEntity } from '@/store/caseStore';
import { fmtDate, fmtDateTime } from '@/clm/format';
import { Field, FieldGrid, SectionCard } from '@/clm/components/ui/Card';
import { Badge } from '@/clm/components/ui/Badge';
import { Button } from '@/clm/components/ui/Button';
import { HelpTip } from '@/training/help/HelpTip';
import { BorrowerPreview } from '@/clm/features/borrower/BorrowerPreview';
import { useWs } from '../context';
import { LicenseFields, validateLicenseDraft, type LicenseDraft } from '../sections/LicenseFields';
import { DecisionActions, DecisionSummary, FileRow, RejectDialog } from './shared';

export function ExpiredLicenseSection() {
  const { c } = useWs();
  const l = c.licenseExpiry!.expired;
  return (
    <SectionCard id="expired-license" title="Expired License" subtitle={`License ${l.number} · only this license is affected`}>
      <FieldGrid>
        <Field label="License">License {l.number}</Field>
        <Field label="License category">{l.category}</Field>
        <Field label="Issuing authority">{l.authority}</Field>
        <Field label="License status">
          <Badge tone="red">Expired</Badge>
        </Field>
        <Field label="Issue date">{fmtDate(l.issueDate)}</Field>
        <Field label="Expiry date">{fmtDate(l.expiryDate)}</Field>
      </FieldGrid>
      {l.file && (
        <div className="mt-3 px-2">
          <div className="label mb-1.5">Supporting documents</div>
          <FileRow file={l.file} caption="Existing license document" />
        </div>
      )}
    </SectionCard>
  );
}

export function BorrowerTaskSection() {
  const { c, entity } = useWs();
  const [preview, setPreview] = useState(false);
  const task = entity.borrowerTasks?.find((t) => t.id === c.licenseExpiry!.taskId);
  const status = task?.status ?? 'pending';
  const label = { pending: 'Pending upload', completed: 'Completed', rejected: 'Rejected' }[status];
  const tone = ({ pending: 'orange', completed: 'green', rejected: 'red' } as const)[status];
  return (
    <SectionCard
      id="borrower-task"
      title={
        <span className="flex items-center gap-1.5">
          Borrower Task <HelpTip topic="license-expiry" label="What does the borrower see?" />
        </span>
      }
      subtitle="Created automatically with this case"
      titleAside={<Badge tone={tone}>{label}</Badge>}
      actions={
        <Button size="sm" onClick={() => setPreview(true)} data-tour="view-borrower-side">
          <MonitorSmartphone className="h-3.5 w-3.5" />
          View borrower side
        </Button>
      }
    >
      <FieldGrid cols={3}>
        <Field label="Task title">{task?.title ?? 'Renew Activity License'}</Field>
        <Field label="Task status">
          <Badge tone={tone}>{label}</Badge>
        </Field>
        <Field label="Task created">{fmtDateTime(task?.createdAt)}</Field>
      </FieldGrid>
      {status === 'rejected' && task?.note && <p className="mt-3 px-2 text-xs text-red-600">Reason sent to the borrower: {task.note}</p>}
      {preview && <BorrowerPreview entityId={c.entityId} focusTaskId={task?.id} onClose={() => setPreview(false)} />}
    </SectionCard>
  );
}

export function RenewedLicenseSection() {
  const { c, readOnly } = useWs();
  const { approveRenewedLicense, rejectRenewedLicense, ensureWorking } = useClm();
  const r = c.licenseExpiry!.renewed;
  const [draft, setDraft] = useState<LicenseDraft>({ category: r?.category, authority: r?.authority, issueDate: r?.issueDate, expiryDate: r?.expiryDate });
  const [touched, setTouched] = useState(false);
  const [reject, setReject] = useState(false);
  if (!r) return null;
  const errs = validateLicenseDraft(draft);
  const show = (k: keyof typeof errs) => (touched ? errs[k] : undefined);
  const decided = !!c.decision;
  return (
    <SectionCard id="renewed-license" title="Renewed License details" subtitle={`Uploaded by the borrower · ${fmtDateTime(r.uploadedAt)}`}>
      <div className="space-y-4 px-1">
        <FileRow file={r.file} />
        {decided && c.decision?.outcome === 'approved' ? (
          <FieldGrid>
            <Field label="License category">{r.category}</Field>
            <Field label="Issuing authority">{r.authority}</Field>
            <Field label="Issue date">{fmtDate(r.issueDate)}</Field>
            <Field label="Expiry date">{fmtDate(r.expiryDate)}</Field>
          </FieldGrid>
        ) : (
          !decided && <LicenseFields draft={draft} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} disabled={readOnly} show={show} idPrefix={`renewed-${c.id}`} />
        )}
        {decided && <DecisionSummary />}
        {decided && c.decision?.outcome === 'approved' && <p className="text-xs text-ink-muted">Saved as the company’s new Activity License. CLM monitors its expiry date from now on.</p>}
        <DecisionActions
          approveLabel="Approve license"
          onReject={() => ensureWorking(c.id) && setReject(true)}
          onApprove={() => {
            setTouched(true);
            if (!ensureWorking(c.id)) return;
            if (Object.values(errs).some(Boolean)) return;
            approveRenewedLicense(c.id, draft as Required<LicenseDraft>);
          }}
        />
      </div>
      <RejectDialog
        open={reject}
        onClose={() => setReject(false)}
        title="Reject renewed license"
        description="The reason is sent to the borrower and recorded on the case."
        confirmLabel="Reject license"
        onConfirm={(reason) => rejectRenewedLicense(c.id, reason)}
      />
    </SectionCard>
  );
}

/** Small hook so other components (rail, practice) can read the entity's borrower tasks. */
export const useBorrowerTasks = (entityId?: string) => useEntity(entityId)?.borrowerTasks ?? [];
