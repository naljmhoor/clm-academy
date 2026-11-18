// UC006 Delegation Request.

import { useState } from 'react';
import clsx from 'clsx';
import { Bell, Check, Loader2, Lock, Pencil, Plus, ShieldCheck } from 'lucide-react';
import type { Delegator } from '@/domain/types';
import { ALL_SYSTEM_PERMISSIONS, permissionGroupOf, permissionLabel, PRIMARY_PERMISSIONS } from '@/mock/masterData';
import { yakeenNameFor } from '@/mock/seedLifecycle';
import { useClm } from '@/store/caseStore';
import { SectionCard } from '@/clm/components/ui/Card';
import { Badge } from '@/clm/components/ui/Badge';
import { Button } from '@/clm/components/ui/Button';
import { Dialog } from '@/clm/components/ui/Dialog';
import { FormField } from '@/clm/components/ui/misc';
import { fmtDateTime } from '@/clm/format';
import { HelpTip } from '@/training/help/HelpTip';
import { useWs } from '../context';
import { DecisionActions, DecisionSummary, Masked, RejectDialog } from './shared';

export function DelegatedPermissionsSection() {
  const { c } = useWs();
  const d = c.delegation!;
  const groups = new Map<string, string[]>();
  d.system.forEach((id) => {
    const g = permissionGroupOf(id)?.label ?? 'Other';
    groups.set(g, [...(groups.get(g) ?? []), id]);
  });
  const Chip = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-0.5 text-xs">
      <Check className="h-3 w-3" />
      {children}
    </span>
  );
  return (
    <SectionCard
      id="delegated-permissions"
      title="Delegated permissions"
      titleAside={
        <Badge tone="gray" icon={<Lock className="h-3 w-3" />}>
          Read-only
        </Badge>
      }
      subtitle={`${d.primary.length + d.system.length} permissions requested by the borrower to be delegated. Shown for review — permissions can’t be changed in this case.`}
    >
      <div className="space-y-3 px-1">
        <div className="rounded-lg border border-line p-3">
          <div className="mb-2 text-sm font-semibold">
            Primary permissions <span className="font-normal text-ink-muted">· {d.primary.length} of {PRIMARY_PERMISSIONS.length} requested</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {d.primary.map((id) => (
              <Chip key={id}>{PRIMARY_PERMISSIONS.find((p) => p.id === id)?.label ?? id}</Chip>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="mb-2 text-sm font-semibold">
            System permissions <span className="font-normal text-ink-muted">· {d.system.length} of {ALL_SYSTEM_PERMISSIONS.length} requested</span>
          </div>
          {[...groups].map(([g, ids]) => (
            <div key={g} className="flex items-center gap-3 py-1">
              <span className="w-36 text-xs text-ink-muted">{g}</span>
              <span className="flex flex-wrap gap-1.5">
                {ids.map((id) => (
                  <Chip key={id}>{permissionLabel(id)}</Chip>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

const NID = /^[12]\d{9}$/;
const HIJRI = /^1[34]\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|30)$/;

function DelegatorDialog({ initial, onClose, onSave }: { initial?: Delegator; onClose: () => void; onSave: (d: { nid: string; dobHijri: string; phone?: string }) => void }) {
  const [nid, setNid] = useState(initial?.nid ?? '');
  const [dob, setDob] = useState(initial?.dobHijri?.replace(' H', '') ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [touched, setTouched] = useState(false);
  const [checking, setChecking] = useState(false);
  const errs = { nid: !NID.test(nid) ? 'Enter a 10-digit National ID or Iqama starting with 1 or 2.' : undefined, dob: !HIJRI.test(dob) ? 'Enter the Hijri date of birth as YYYY-MM-DD.' : undefined };
  const verified = !errs.nid && !errs.dob;
  const name = verified ? (initial?.name ?? yakeenNameFor(nid)) : undefined;
  return (
    <Dialog
      open
      onClose={onClose}
      tour="delegator-dialog"
      title={initial ? 'Edit delegator' : 'Add delegator'}
      description="The name is retrieved from Yakeen (simulated) using the National ID and date of birth."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            loading={checking}
            onClick={() => {
              setTouched(true);
              if (!verified) return;
              setChecking(true);
              setTimeout(() => {
                onSave({ nid, dobHijri: `${dob} H`, phone: phone.trim() || undefined });
                onClose();
              }, 500);
            }}
          >
            {initial ? 'Save delegator' : 'Add delegator'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <FormField label="National ID / Iqama" required error={touched ? errs.nid : undefined} htmlFor="dl-nid">
          <input id="dl-nid" value={nid} inputMode="numeric" onChange={(e) => setNid(e.target.value.trim())} placeholder="1XXXXXXXXX" className={clsx('h-9 w-full rounded-md border px-3 text-sm outline-none', touched && errs.nid ? 'border-red-500' : 'border-line')} />
        </FormField>
        <FormField label="Date of birth (Hijri)" required error={touched ? errs.dob : undefined} htmlFor="dl-dob">
          <input id="dl-dob" value={dob} onChange={(e) => setDob(e.target.value.trim())} placeholder="1410-05-21" className={clsx('h-9 w-full rounded-md border px-3 text-sm outline-none', touched && errs.dob ? 'border-red-500' : 'border-line')} />
        </FormField>
        <FormField label="Full name (from Yakeen)">
          <div className="flex h-9 items-center gap-2 rounded-md border border-line bg-surface-sunken px-3 text-sm">
            {name ? (
              <>
                <span className="bidi flex-1 truncate">{name}</span>
                <Badge tone="green" icon={<ShieldCheck className="h-3 w-3" />}>
                  Verified
                </Badge>
              </>
            ) : (
              <span className="text-ink-faint">Filled after ID and date of birth</span>
            )}
          </div>
        </FormField>
        <FormField label="Phone (optional)" htmlFor="dl-phone">
          <input id="dl-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966 5X XXX XXXX" className="h-9 w-full rounded-md border border-line px-3 text-sm outline-none" />
        </FormField>
      </div>
      {checking && (
        <p className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking with Yakeen…
        </p>
      )}
    </Dialog>
  );
}

export function DelegatorsSection() {
  const { c, readOnly } = useWs();
  const { toggleDelegator, addDelegator, updateDelegator, approveDelegation, rejectRequest, ensureWorking } = useClm();
  const list = c.delegation!.delegators;
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Delegator | null>(null);
  const [reject, setReject] = useState(false);
  const [error, setError] = useState<string>();
  const decided = !!c.decision;
  const editable = !readOnly && !decided;
  const selected = list.filter((d) => d.selected);
  return (
    <SectionCard
      id="delegators"
      title={
        <span className="flex items-center gap-1.5">
          Delegators <HelpTip topic="delegation" label="How do delegators work?" />
        </span>
      }
      subtitle={decided ? undefined : 'Select at least one delegator to approve. You can add a delegator the borrower did not list.'}
      actions={
        editable && (
          <Button size="sm" onClick={() => ensureWorking(c.id) && setAdding(true)} data-tour="add-delegator">
            <Plus className="h-3.5 w-3.5" />
            Add delegator
          </Button>
        )
      }
    >
      <div className="space-y-2 px-1" data-tour="delegator-list">
        {list.map((d) => (
          <div key={d.id} className={clsx('flex items-center gap-3 rounded-lg border px-3 py-2.5', d.selected ? 'border-ink' : 'border-line')}>
            {editable && (
              <button
                type="button"
                role="checkbox"
                aria-checked={d.selected}
                aria-label={`Select ${d.name ?? 'delegator'}`}
                onClick={() => {
                  setError(undefined);
                  if (ensureWorking(c.id)) toggleDelegator(c.id, d.id);
                }}
                className={clsx('flex h-4 w-4 shrink-0 items-center justify-center rounded border', d.selected ? 'border-ink bg-ink text-white' : 'border-neutral-300')}
              >
                {d.selected && <Check className="h-3 w-3" />}
              </button>
            )}
            <div className="min-w-0 flex-1">
              <div className="bidi text-sm font-medium">{d.name ?? <span className="text-ink-muted">Name not verified</span>}</div>
              <div className="text-xs text-ink-muted">
                NID / Iqama · <Masked value={d.nid} label="national ID" />
                {d.addedBy === 'admin' && ' · added by admin'}
              </div>
            </div>
            <div className="w-28 text-xs">
              <div className="text-ink-muted">Date of Birth</div>
              <div>{d.dobHijri ?? '-'}</div>
            </div>
            <div className="w-36 text-xs">
              <div className="text-ink-muted">Phone Number</div>
              <div>{d.phone ? <Masked value={d.phone} label="phone number" /> : '-'}</div>
            </div>
            {d.sentAt && (
              <div className="w-40 text-xs">
                <div className="flex items-center gap-1 text-ink-muted">
                  <Bell className="h-3 w-3" /> {d.respondedAt ? `Responded on ${fmtDateTime(d.respondedAt)}` : `Sent to delegator ${fmtDateTime(d.sentAt)}`}
                </div>
                <Badge tone={d.response === 'approved' ? 'green' : 'orange'}>{d.response === 'approved' ? 'Approved' : 'Pending'}</Badge>
              </div>
            )}
            {!d.verified && !decided && <Badge tone="orange">Not verified</Badge>}
            {editable && (
              <button type="button" aria-label="Edit delegator" onClick={() => ensureWorking(c.id) && setEditing(d)} className="rounded p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink" data-tour="edit-delegator">
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {error && <p className="text-xs text-red-600">{error}</p>}
        {decided && <DecisionSummary />}
        <DecisionActions
          approveLabel="Approve request"
          onReject={() => ensureWorking(c.id) && setReject(true)}
          onApprove={() => {
            if (!ensureWorking(c.id)) return;
            if (!selected.length) return setError('Select at least one delegator before approving.');
            if (selected.some((d) => !d.verified)) return setError('A selected delegator is not verified. Edit them to add the date of birth and verify with Yakeen.');
            approveDelegation(c.id);
          }}
        />
      </div>
      {adding && <DelegatorDialog onClose={() => setAdding(false)} onSave={(d) => addDelegator(c.id, d)} />}
      {editing && <DelegatorDialog initial={editing} onClose={() => setEditing(null)} onSave={(d) => updateDelegator(c.id, editing.id, d)} />}
      <RejectDialog open={reject} onClose={() => setReject(false)} title="Reject delegation request" description="The borrower is informed of the rejection and its reason." confirmLabel="Reject request" onConfirm={(r) => rejectRequest(c.id, r)} />
    </SectionCard>
  );
}
