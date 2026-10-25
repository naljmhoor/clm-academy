import { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { Address, AmlParty } from '@/domain/types';
import { amlGroupResult, amlScreenedCount } from '@/domain/eddRules';
import { useClm, useUsers } from '@/store/caseStore';
import { fmtDate, fmtDateTime, fmtMoney } from '@/clm/format';
import { Field, FieldGrid, SectionCard } from '@/clm/components/ui/Card';
import { Badge } from '@/clm/components/ui/Badge';
import { Button } from '@/clm/components/ui/Button';
import { Dialog } from '@/clm/components/ui/Dialog';
import { FormField, Spinner } from '@/clm/components/ui/misc';
import { useWs } from '../context';
import { AmlBadge, AML_LABEL, EditButton, RefreshButton } from './common';
import { EditAddressDialog } from '../dialogs/EditAddressDialog';
import { HelpTip } from '@/training/help/HelpTip';

// ---- National Address (UC006) ----------------------------------------------

const SOURCE_LABEL = { spl: 'SPL', short_address: 'Short address', manual: 'Manual entry' } as const;

export function AddressSection() {
  const { c, readOnly } = useWs();
  const fetchSpl = useClm((s) => s.fetchSplAddress);
  const confirmAddress = useClm((s) => s.confirmAddress);
  const [edit, setEdit] = useState(false);
  const [proposed, setProposed] = useState<Address>();
  const [retrying, setRetrying] = useState(false);
  const a = c.edd.address;
  const d = a.data;
  const loading = a.status === 'loading' || retrying;

  const retry = async () => {
    setRetrying(true);
    const res = await fetchSpl(c.id);
    setRetrying(false);
    if (!res.ok) return;
    // AF-2: an existing address is never overwritten without review.
    if (d) setProposed(res.data);
    else confirmAddress(c.id, res.data, 'spl');
  };

  let subtitle: string;
  let tone: 'muted' | 'error' = 'muted';
  if (a.status === 'success' && d) subtitle = `Last retrieved ${fmtDateTime(a.retrievedAt)} · Source: ${SOURCE_LABEL[a.source ?? 'spl']}`;
  else if (a.status === 'loading') subtitle = 'Retrieving from SPL…';
  else if (a.status === 'failed') {
    subtitle = 'Complete all required fields manually to continue.';
    tone = 'error';
  } else {
    subtitle = 'The information has not been retrieved from SPL or entered manually.';
    tone = 'error';
  }

  return (
    <SectionCard
      id="address"
      title={
        <span className="flex items-center gap-1.5">
          National address <HelpTip topic="national-address" />
        </span>
      }
      titleAside={a.source === 'manual' && <Badge tone="blue">Manually completed</Badge>}
      subtitle={subtitle}
      subtitleTone={tone}
      actions={
        !readOnly && (
          <>
            <EditButton label="Enter or change address" onClick={() => setEdit(true)} tour="address-edit" />
            <RefreshButton label="Retry SPL request" onClick={retry} loading={loading} tour="address-retry" />
          </>
        )
      }
    >
      {a.status === 'failed' && a.error && (
        <p className="mb-3 flex items-center gap-1.5 px-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5" />
          {a.error}
        </p>
      )}
      <FieldGrid>
        <Field label="City">{d?.city || '-'}</Field>
        <Field label="District">{d?.district || '-'}</Field>
        <Field label="Street name">{d?.street || '-'}</Field>
        <Field label="Short address">{d?.shortAddress || '-'}</Field>
        <Field label="Postal code">{d?.postalCode || '-'}</Field>
        <Field label="Additional number">{d?.additionalNumber || '-'}</Field>
        <Field label="Building number">{d?.buildingNumber || '-'}</Field>
      </FieldGrid>
      <EditAddressDialog open={edit} onClose={() => setEdit(false)} />
      <EditAddressDialog open={!!proposed} proposed={proposed} onClose={() => setProposed(undefined)} />
    </SectionCard>
  );
}

// ---- VAT & Zakat (UC007) ---------------------------------------------------

function ManualVatDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { c } = useWs();
  const setManualVat = useClm((s) => s.setManualVat);
  const [vat, setVat] = useState(c.edd.zatca.data?.vatNumber ?? '');
  const [touched, setTouched] = useState(false);
  const err = !/^3\d{13}3$/.test(vat) ? 'VAT number must be 15 digits, starting and ending with 3.' : undefined;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Enter VAT number"
      description="Use this when ZATCA did not return the VAT number. The value is marked as Manually completed."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              setTouched(true);
              if (err) return;
              setManualVat(c.id, vat);
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <FormField label="VAT number" required error={touched ? err : undefined} htmlFor="vat-number">
        <input id="vat-number" inputMode="numeric" maxLength={15} value={vat} onChange={(e) => setVat(e.target.value.replace(/\D/g, ''))} placeholder="3XXXXXXXXXXXXX3" className={`input ${touched && err ? 'input-error' : ''}`} />
      </FormField>
    </Dialog>
  );
}

export function ZatcaSection() {
  const { c, readOnly } = useWs();
  const retryZatca = useClm((s) => s.retryZatca);
  const [manual, setManual] = useState(false);
  const z = c.edd.zatca;
  const d = z.data;
  const missingVat = z.status === 'success' && !d?.vatNumber;
  let subtitle: string;
  let tone: 'muted' | 'error' = 'muted';
  if (z.status === 'loading') subtitle = 'Retrieving from ZATCA…';
  else if (z.status === 'failed') {
    subtitle = 'Failed to retrieve. Retry the retrieval or enter the VAT number manually.';
    tone = 'error';
  } else if (z.status === 'not_triggered') {
    subtitle = 'The information has not been retrieved from ZATCA or entered manually.';
    tone = 'error';
  } else subtitle = `Last retrieved ${fmtDateTime(z.retrievedAt)}`;

  return (
    <SectionCard
      id="zatca"
      title="VAT & Zakat Certificate"
      titleAside={z.entryMethod === 'manual' && <Badge tone="blue">Manually completed</Badge>}
      subtitle={subtitle}
      subtitleTone={tone}
      actions={
        !readOnly && (
          <>
            <EditButton label="Enter VAT number manually" onClick={() => setManual(true)} />
            <RefreshButton label="Retry ZATCA retrieval" onClick={() => retryZatca(c.id)} loading={z.status === 'loading'} />
          </>
        )
      }
    >
      <FieldGrid>
        <Field label="Certificate number">{d?.certificateNumber || '-'}</Field>
        <Field label="Certificate status">{d?.certificateNumber ? <Badge tone={d.certificateStatus === 'Valid' ? 'green' : 'red'}>{d.certificateStatus}</Badge> : '-'}</Field>
        <Field label="Certificate Issuance date">{d?.issueDate ? fmtDate(d.issueDate) : '-'}</Field>
        <Field label="Certificate Expiry date">{d?.expiryDate ? fmtDate(d.expiryDate) : '-'}</Field>
        <Field label="VAT number">{d?.vatNumber ?? (missingVat ? <span className="text-red-600">Not returned by ZATCA</span> : '-')}</Field>
        <Field label="VAT registration status">{d?.vatStatus ? <Badge tone="green">{d.vatStatus}</Badge> : '-'}</Field>
      </FieldGrid>
      {missingVat && !readOnly && (
        <div className="mx-2 mt-4 flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800">
          The Zakat certificate was retrieved but the VAT number was not returned.
          <Button size="sm" onClick={() => setManual(true)}>
            Enter VAT manually
          </Button>
        </div>
      )}
      {manual && <ManualVatDialog open onClose={() => setManual(false)} />}
    </SectionCard>
  );
}

// ---- AML (UC008) -----------------------------------------------------------

function AmlPartyDialog({ party, onClose }: { party: AmlParty; onClose: () => void }) {
  const { c, readOnly } = useWs();
  const decideAml = useClm((s) => s.decideAml);
  const users = useUsers();
  const [confirm, setConfirm] = useState<'approved' | 'rejected' | 'ignored' | 'reported'>();
  const pending = party.result === 'pending_review' && !readOnly;
  const LABEL = { approved: 'Approve', rejected: 'Reject', ignored: 'Ignore', reported: 'Report to MOZN' };
  return (
    <Dialog
      open
      onClose={onClose}
      width="lg"
      showClose
      title={<span className="bidi">{party.name}</span>}
      description={`${party.kind === 'company' ? 'Company' : 'Owner'} · AML screening result from Mozn`}
      footer={
        confirm ? (
          <>
            <Button onClick={() => setConfirm(undefined)}>Back</Button>
            <Button
              variant={confirm === 'rejected' ? 'danger' : 'primary'}
              onClick={() => {
                decideAml(c.id, party.id, confirm);
                onClose();
              }}
            >
              Confirm {LABEL[confirm]}
            </Button>
          </>
        ) : pending ? (
          <>
            <Button onClick={() => setConfirm('reported')}>Report to MOZN</Button>
            <Button onClick={() => setConfirm('ignored')}>Ignore</Button>
            <Button onClick={() => setConfirm('rejected')} className="text-red-600">
              Reject
            </Button>
            <Button variant="primary" onClick={() => setConfirm('approved')}>
              Approve
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )
      }
    >
      <div className="rounded-md border border-dashed border-academy/40 bg-academy-soft px-3 py-2 text-xs text-academy">
        Training simulation: in CLM the name opens the owner or company AML page, where this decision is recorded.
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Field label="AML result">
          <AmlBadge result={party.result} />
        </Field>
        <Field label="Screened">{fmtDateTime(c.edd.aml.screenedAt)}</Field>
        {party.matchSummary && (
          <Field label="Match details" className="col-span-2">
            {party.matchSummary}
          </Field>
        )}
        {party.decidedBy && (
          <Field label="Decision">
            {AML_LABEL[party.result]} by {users.find((u) => u.id === party.decidedBy)?.name} · {fmtDateTime(party.decidedAt)}
          </Field>
        )}
      </div>
      {confirm && (
        <div className={`mt-4 rounded-md px-3 py-2 text-sm ${confirm === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-surface-sunken'}`}>
          {confirm === 'rejected'
            ? 'Rejecting closes this EDD case as Rejected (AML Rejected) and restricts the entity. This cannot be undone from CLM.'
            : `Confirm "${LABEL[confirm]}" for this AML result. The decision is sent to Mozn and recorded in the activity log.`}
        </div>
      )}
    </Dialog>
  );
}

export function AmlSection() {
  const { c, readOnly } = useWs();
  const retryAml = useClm((s) => s.retryAml);
  const [party, setParty] = useState<AmlParty>();
  const parties = c.edd.aml.parties;
  const company = parties.filter((p) => p.kind === 'company');
  const owners = parties.filter((p) => p.kind === 'owner');
  const running = parties.some((p) => p.result === 'in_progress');
  const notTriggered = parties.every((p) => p.result === 'not_triggered');
  const screened = amlScreenedCount(parties);
  const subtitle = running
    ? 'Being checked…'
    : notTriggered
      ? `Only ${screened} of ${parties.length} parties have been screened.`
      : `Last screened ${fmtDateTime(c.edd.aml.screenedAt)}`;
  return (
    <SectionCard
      id="aml"
      title={
        <span className="flex items-center gap-1.5">
          AML screening <HelpTip topic="aml" />
        </span>
      }
      subtitle={subtitle}
      subtitleTone={notTriggered ? 'error' : 'muted'}
      actions={!readOnly && <RefreshButton label="Retry AML screening" onClick={() => retryAml(c.id)} loading={running} />}
    >
      <div className="grid grid-cols-2 gap-3 px-1">
        {[
          { label: 'Company screening', r: amlGroupResult(company) },
          { label: 'Owners screening', r: amlGroupResult(owners) },
        ].map((x) => (
          <div key={x.label} className="flex items-center gap-3 rounded-lg border border-line px-3 py-3 text-sm font-medium">
            {x.label}
            <AmlBadge result={x.r} />
          </div>
        ))}
      </div>
      <div className="mt-4 px-2 text-xs text-ink-muted">Individual Owner Statuses</div>
      <ul className="mt-2 divide-y divide-line border-t border-line">
        {parties.map((p) => (
          <li key={p.id} className="flex items-center justify-between px-2 py-2.5">
            <button type="button" onClick={() => setParty(p)} className="link bidi text-sm">
              {p.name}
            </button>
            <span className="flex items-center gap-2">
              {p.result === 'in_progress' && <Spinner className="h-3.5 w-3.5" />}
              <AmlBadge result={p.result} />
            </span>
          </li>
        ))}
      </ul>
      {party && <AmlPartyDialog party={parties.find((p) => p.id === party.id) ?? party} onClose={() => setParty(undefined)} />}
    </SectionCard>
  );
}

// ---- Workforce / Masdr (UC009) ---------------------------------------------

export function WorkforceSection() {
  const { c, readOnly } = useWs();
  const retrieve = useClm((s) => s.retrieveMasdr);
  const w = c.edd.workforce;
  const d = w.data;
  const loading = w.status === 'loading';
  if (w.status === 'not_triggered' || (loading && !d && w.attempts === 0)) {
    return (
      <SectionCard id="workforce" title="Workforce Information" subtitle="Source: Masdr · Not retrieved">
        <div className="flex flex-col items-center px-6 py-8 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-line">
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </div>
          <div className="text-sm font-semibold">Workforce information has not been retrieved</div>
          <p className="mt-1 max-w-md text-xs text-ink-muted">GOSI workforce details for this entity are available from Masdr. Retrieve them to view employee counts, wages and GOSI compliance status.</p>
          {!readOnly && (
            <Button variant="primary" size="sm" className="mt-4" loading={loading} onClick={() => retrieve(c.id)} data-tour="masdr-retrieve">
              Retrieve from Masdr
            </Button>
          )}
        </div>
      </SectionCard>
    );
  }
  return (
    <SectionCard
      id="workforce"
      title="Workforce Information"
      subtitle={w.retrievedAt ? `Last retrieved ${fmtDateTime(w.retrievedAt)}` : loading ? 'Retrieving from Masdr…' : 'Source: Masdr · Retrieval failed'}
      subtitleTone={w.status === 'failed' && !d ? 'error' : 'muted'}
      actions={!readOnly && <RefreshButton label="Refresh from Masdr" onClick={() => retrieve(c.id)} loading={loading} />}
    >
      <FieldGrid>
        <Field label="GOSI certificate start date">{d ? fmtDate(d.gosiStart) : '-'}</Field>
        <Field label="GOSI certificate end date">{d ? fmtDate(d.gosiEnd) : '-'}</Field>
        <Field label="No. of Saudi employees">{d?.saudiCount ?? '-'}</Field>
        <Field label="No. of non-Saudi employees">{d?.nonSaudiCount ?? '-'}</Field>
        <Field label="Saudi employees' wages">{d ? fmtMoney(d.saudiWages) : '-'}</Field>
        <Field label="Non-Saudi employees' wages">{d ? fmtMoney(d.nonSaudiWages) : '-'}</Field>
        <Field label="GOSI compliance">{d ? <Badge tone={d.compliant ? 'green' : 'red'}>{d.compliant ? 'Compliant' : 'Not compliant'}</Badge> : '-'}</Field>
      </FieldGrid>
      <p className="mt-4 px-2 text-xs text-ink-muted">For reference only — workforce information does not block closing the case.</p>
    </SectionCard>
  );
}
