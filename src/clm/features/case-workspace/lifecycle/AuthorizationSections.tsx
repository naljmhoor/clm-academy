// UC005 Authorization Request.

import { useState } from 'react';
import clsx from 'clsx';
import { Check, Minus } from 'lucide-react';
import type { Requester } from '@/domain/types';
import { ALL_SYSTEM_PERMISSIONS, permissionParent, SYSTEM_PERMISSIONS, type PermissionNode } from '@/mock/masterData';
import { useClm } from '@/store/caseStore';
import { Field, FieldGrid, SectionCard } from '@/clm/components/ui/Card';
import { Badge } from '@/clm/components/ui/Badge';
import { Button } from '@/clm/components/ui/Button';
import { Dialog, Drawer } from '@/clm/components/ui/Dialog';
import { fmtDateTime } from '@/clm/format';
import { HelpTip } from '@/training/help/HelpTip';
import { useWs } from '../context';
import { DecisionActions, DecisionSummary, FileRow, Masked, RejectDialog } from './shared';

export function RequesterSection({ requester, documents, title = 'Requester' }: { requester: Requester; documents: { file: import('@/domain/types').FileRef }[]; title?: string }) {
  return (
    <SectionCard id="requester" title={title}>
      <FieldGrid>
        <Field label="Full Name">{requester.name}</Field>
        <Field label="Phone Number">
          <Masked value={requester.phone} label="phone number" />
        </Field>
        <Field label="National ID / Iqama">
          <Masked value={requester.nid} label="national ID" />
        </Field>
        <Field label="Date of Birth">{requester.dobHijri}</Field>
      </FieldGrid>
      <div className="mt-3 space-y-2 px-2">
        <div className="label">Supporting documents{documents.length > 1 ? ` (${documents.length})` : ''}</div>
        {documents.map((d) => (
          <FileRow key={d.file.id} file={d.file} caption={`Uploaded by requester · ${fmtDateTime(d.file.uploadedAt)}`} />
        ))}
      </div>
    </SectionCard>
  );
}

function Box({ state, disabled, onClick, label }: { state: 'on' | 'off' | 'partial'; disabled?: boolean; onClick?: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state === 'partial' ? 'mixed' : state === 'on'}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={clsx('flex h-4 w-4 shrink-0 items-center justify-center rounded border', state !== 'off' ? 'border-ink bg-ink text-white' : 'border-neutral-300 bg-white', disabled && 'opacity-60')}
    >
      {state === 'on' && <Check className="h-3 w-3" />}
      {state === 'partial' && <Minus className="h-3 w-3" />}
    </button>
  );
}

/** Permission tree. A child permission needs its parent (e.g. Request Withdrawal needs View Wallet). */
export function PermissionTree({ value, onChange, disabled, requested }: { value: string[]; onChange?: (ids: string[]) => void; disabled?: boolean; requested?: string[] }) {
  const has = (id: string) => value.includes(id);
  const toggle = (n: PermissionNode) => {
    if (!onChange) return;
    if (has(n.id)) {
      const drop = new Set([n.id, ...(n.children ?? []).map((c) => c.id)]);
      onChange(value.filter((v) => !drop.has(v)));
    } else {
      const parent = permissionParent(n.id);
      onChange([...new Set([...value, n.id, ...(parent ? [parent.id] : [])])]);
    }
  };
  const toggleGroup = (ids: string[]) => {
    if (!onChange) return;
    const all = ids.every(has);
    onChange(all ? value.filter((v) => !ids.includes(v)) : [...new Set([...value, ...ids])]);
  };
  const Row = ({ n, depth }: { n: PermissionNode; depth: number }) => (
    <>
      <li className="flex items-center gap-2 py-1" style={{ paddingLeft: depth * 20 }}>
        <Box state={has(n.id) ? 'on' : 'off'} disabled={disabled} onClick={() => toggle(n)} label={n.label} />
        <span className="text-sm">{n.label}</span>
        {requested && requested.includes(n.id) && !disabled && <span className="text-2xs text-ink-muted">requested</span>}
      </li>
      {n.children?.map((c) => <Row key={c.id} n={c} depth={depth + 1} />)}
    </>
  );
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3" data-tour="permission-tree">
      {SYSTEM_PERMISSIONS.map((g) => {
        const ids = g.items.flatMap((i) => [i.id, ...(i.children ?? []).map((c) => c.id)]);
        const n = ids.filter(has).length;
        return (
          <div key={g.id}>
            <div className="flex items-center gap-2 py-1">
              <Box state={n === 0 ? 'off' : n === ids.length ? 'on' : 'partial'} disabled={disabled} onClick={() => toggleGroup(ids)} label={g.label} />
              <span className="text-sm font-semibold">{g.label}</span>
            </div>
            <ul className="ml-1">
              {g.items.map((i) => (
                <Row key={i.id} n={i} depth={1} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function AuthorizationPermissionsSection() {
  const { c, readOnly } = useWs();
  const { approveAuthorization, rejectRequest, ensureWorking } = useClm();
  const a = c.authorization!;
  const [draft, setDraft] = useState<string[]>(a.requested);
  const [confirm, setConfirm] = useState(false);
  const [reject, setReject] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [touched, setTouched] = useState(false);
  const total = ALL_SYSTEM_PERMISSIONS.length;
  const decided = !!c.decision;
  const granted = a.granted ?? [];
  return (
    <SectionCard
      id="auth-permissions"
      title={
        <span className="flex items-center gap-1.5">
          Authorization permissions <HelpTip topic="authorization" label="How do I decide an authorization request?" />
        </span>
      }
      subtitle={decided ? undefined : `System permissions · ${draft.length} of ${total} selected · ${a.requested.length} requested by the borrower`}
      titleAside={
        decided && c.decision?.outcome === 'approved' ? (
          <span className="flex items-center gap-2">
            <Badge tone="green">
              {granted.length} of {total} granted
            </Badge>
            <Button variant="link" size="sm" onClick={() => setDrawer(true)} data-tour="view-permissions">
              View permissions
            </Button>
          </span>
        ) : undefined
      }
    >
      <div className="space-y-4 px-1">
        {!decided && (
          <>
            <p className="text-xs text-ink-muted">The borrower’s request is pre-selected. Adjust it if needed — only the permissions selected here are granted on approval.</p>
            <PermissionTree value={draft} onChange={readOnly ? undefined : setDraft} disabled={readOnly} requested={a.requested} />
            {touched && draft.length === 0 && <p className="text-xs text-red-600">Select at least one permission to approve the request.</p>}
          </>
        )}
        {decided && <DecisionSummary />}
        <DecisionActions
          approveLabel="Approve authorization"
          onReject={() => ensureWorking(c.id) && setReject(true)}
          onApprove={() => {
            setTouched(true);
            if (!ensureWorking(c.id) || draft.length === 0) return;
            setConfirm(true);
          }}
        />
      </div>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        tour="confirm-approval-dialog"
        title="Confirm Approval"
        description="Are you sure you want to approve this authorization request? The requested permissions will be granted, and the status will change to Accepted."
        footer={
          <>
            <Button onClick={() => setConfirm(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                approveAuthorization(c.id, draft);
                setConfirm(false);
              }}
            >
              Approve authorization
            </Button>
          </>
        }
      >
        <p className="text-sm">
          {draft.length} of {total} permissions will be granted.
        </p>
      </Dialog>
      <RejectDialog open={reject} onClose={() => setReject(false)} title="Reject authorization" description="The borrower is informed of the rejection and its reason." confirmLabel="Reject authorization" onConfirm={(r) => rejectRequest(c.id, r)} />
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Authorized permissions">
        <p className="mb-3 text-xs text-ink-muted">Granted on approval · {fmtDateTime(c.decision?.at)}</p>
        <PermissionTree value={granted} disabled />
      </Drawer>
    </SectionCard>
  );
}
