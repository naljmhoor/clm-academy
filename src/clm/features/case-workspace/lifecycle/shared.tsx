// Building blocks shared by the Phase II case workspaces.

import { useState, type ReactNode } from 'react';
import { Eye, EyeOff, FileText } from 'lucide-react';
import type { FileRef } from '@/domain/types';
import { useUsers } from '@/store/caseStore';
import { fileExt, fmtDateTime, fmtSize } from '@/clm/format';
import { RailCard, RailRow } from '@/clm/components/ui/Card';
import { Badge } from '@/clm/components/ui/Badge';
import { Button } from '@/clm/components/ui/Button';
import { Dialog } from '@/clm/components/ui/Dialog';
import { FormField, TextArea } from '@/clm/components/ui/misc';
import { FileActions } from '../dialogs/documents';
import { useWs } from '../context';

/** Rail card: why the case exists. */
export function CaseTriggerCard() {
  const { c } = useWs();
  if (!c.trigger) return null;
  return (
    <RailCard id="case-trigger" title="Case Trigger">
      <RailRow label="Trigger">{c.trigger.label}</RailRow>
      {c.coc && <RailRow label="Changes detected">{c.coc.changes.length}</RailRow>}
      <RailRow label="Initiated by">{c.trigger.initiatedBy}</RailRow>
      <RailRow label={c.trigger.initiatedBy === 'Borrower' ? 'Submitted on' : 'Detected on'}>{fmtDateTime(c.trigger.at)}</RailRow>
    </RailCard>
  );
}

/** Personal values (ID, phone, IBAN) are masked until revealed. Training data is fictional. */
export function Masked({ value, keep = 4, label }: { value: string; keep?: number; label: string }) {
  const [shown, setShown] = useState(false);
  const digits = value.replace(/\s/g, '');
  const masked = `${'•'.repeat(Math.max(4, digits.length - keep))}${digits.slice(-keep)}`;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="tabular-nums" dir="ltr">
        {shown ? value : masked}
      </span>
      <button type="button" onClick={() => setShown(!shown)} aria-label={`${shown ? 'Hide' : 'Show'} ${label}`} className="text-ink-muted hover:text-ink">
        {shown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </span>
  );
}

export function FileRow({ file, caption }: { file: FileRef; caption?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-sunken px-3 py-2.5">
      <FileText className="h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{file.name}</div>
        <div className="text-xs text-ink-muted">
          {fileExt(file.name)} · {fmtSize(file.sizeKb)} · {caption ?? fmtDateTime(file.uploadedAt)}
        </div>
      </div>
      <FileActions file={file} />
    </div>
  );
}

/** Mandatory-reason rejection dialog (UC004, UC005, UC006, UC007). */
export function RejectDialog({ open, onClose, title, description, confirmLabel, onConfirm, tour }: { open: boolean; onClose: () => void; title: string; description: ReactNode; confirmLabel: string; onConfirm: (reason: string) => void; tour?: string }) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const invalid = touched && !reason.trim();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      tour={tour ?? 'reject-dialog'}
      title={title}
      description={description}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => {
              setTouched(true);
              if (!reason.trim()) return;
              onConfirm(reason.trim());
              setReason('');
              setTouched(false);
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <FormField label="Rejection reason" required error={invalid ? 'A rejection reason is required.' : undefined} htmlFor="reject-reason">
        <TextArea id="reject-reason" rows={4} value={reason} invalid={invalid} onChange={(e) => setReason(e.target.value)} placeholder="Explain why the request is rejected." />
      </FormField>
    </Dialog>
  );
}

/** Read-only summary of the decision taken on a request case. */
export function DecisionSummary() {
  const { c } = useWs();
  const users = useUsers();
  if (!c.decision) return null;
  const d = c.decision;
  return (
    <div className="grid grid-cols-3 gap-4 rounded-lg border border-line px-3 py-2.5 text-sm" data-tour="decision-summary">
      <div>
        <div className="label">Decision</div>
        <Badge tone={d.outcome === 'approved' ? 'green' : 'red'} className="mt-1">
          {d.outcome === 'approved' ? 'Approved' : 'Rejected'}
        </Badge>
      </div>
      <div>
        <div className="label">Decided on</div>
        <div className="mt-1">{fmtDateTime(d.at)}</div>
      </div>
      <div>
        <div className="label">Decided by</div>
        <div className="mt-1">{users.find((u) => u.id === d.byId)?.name ?? '-'}</div>
      </div>
      {d.reason && (
        <div className="col-span-3">
          <div className="label">Rejection reason</div>
          <div className="mt-1">{d.reason}</div>
        </div>
      )}
    </div>
  );
}

/** Footer row with Reject / Approve buttons for undecided request cases. */
export function DecisionActions({ onReject, onApprove, approveLabel, rejectLabel = 'Reject', approveDisabled, hint }: { onReject: () => void; onApprove: () => void; approveLabel: string; rejectLabel?: string; approveDisabled?: boolean; hint?: ReactNode }) {
  const { c, readOnly } = useWs();
  if (readOnly || c.decision) return null;
  return (
    <div className="flex items-center justify-end gap-2 border-t border-line pt-3" data-tour="decision-actions">
      {hint && <span className="mr-auto text-xs text-ink-muted">{hint}</span>}
      <Button size="sm" variant="danger-link" onClick={onReject} data-tour="decision-reject">
        {rejectLabel}
      </Button>
      <Button size="sm" variant="primary" onClick={onApprove} disabled={approveDisabled} data-tour="decision-approve">
        {approveLabel}
      </Button>
    </div>
  );
}
