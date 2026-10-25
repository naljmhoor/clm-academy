import { useState } from 'react';
import { Info } from 'lucide-react';
import { isKycVerified, missingKycFields } from '@/domain/eddRules';
import { useClm } from '@/store/caseStore';
import { fmtDateTime, fmtMoney } from '@/clm/format';
import { Field, FieldGrid, SectionCard } from '@/clm/components/ui/Card';
import { Badge } from '@/clm/components/ui/Badge';
import { Button } from '@/clm/components/ui/Button';
import { Drawer } from '@/clm/components/ui/Dialog';
import { CLIENT_TYPE_LABEL } from '../../case-shared/ClientLink';
import { personName, useWs } from '../context';
import { RefreshButton, WATHQ_COOLDOWN_MS } from './common';
import { HelpTip } from '@/training/help/HelpTip';

export function EntityDetailsSection() {
  const { entity } = useWs();
  return (
    <SectionCard id="entity-details" title="Entity Details">
      <FieldGrid>
        <Field label="Client Name">{entity.nameAr}</Field>
        <Field label="CR Number">{entity.cr}</Field>
        <Field label="Unified Number">{entity.unified}</Field>
        <Field label="Client Type">{CLIENT_TYPE_LABEL[entity.clientType]}</Field>
      </FieldGrid>
    </SectionCard>
  );
}

const TH = 'h-10 px-3 text-left text-sm font-medium';
const TD = 'h-12 px-3 text-sm';

/** UC004 — read-only. Partial KYC = Not verified. */
export function KycSection() {
  const { c } = useWs();
  return (
    <SectionCard
      id="kyc"
      title={
        <span className="flex items-center gap-1.5">
          KYC Verification <HelpTip topic="kyc" />
        </span>
      }
    >
      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full border-collapse">
          <thead className="bg-surface-sunken">
            <tr>
              <th className={TH}>Name</th>
              <th className={TH}>KYC status</th>
              <th className={TH}>Role</th>
              <th className={TH}>Ownership %</th>
            </tr>
          </thead>
          <tbody>
            {c.edd.stakeholders.map((s) => {
              const ok = isKycVerified(s);
              const missing = missingKycFields(s);
              return (
                <tr key={s.id} className="border-t border-line">
                  <td className={`${TD} bidi`}>{personName(s)}</td>
                  <td className={TD}>
                    <span className="inline-flex items-center gap-1" title={ok ? undefined : `Missing: ${missing.join(', ')}`}>
                      <Badge tone={ok ? 'green' : 'red'}>{ok ? 'Verified' : 'Not verified'}</Badge>
                      {!ok && <Info className="h-3.5 w-3.5 text-ink-muted" aria-label={`Missing: ${missing.join(', ')}`} />}
                    </span>
                  </td>
                  <td className={TD}>{s.role}</td>
                  <td className={TD}>{s.ownership !== undefined ? `${s.ownership} %` : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

const PREVIEW = 3;

/** UC005 — Wathq Full Info. */
export function KybSection() {
  const { c, readOnly } = useWs();
  const retryKyb = useClm((s) => s.retryKyb);
  const [drawer, setDrawer] = useState(false);
  const kyb = c.edd.kyb;
  const d = kyb.data;
  const cooldownUntil = kyb.retrievedAt ? Date.parse(kyb.retrievedAt) + WATHQ_COOLDOWN_MS : undefined;
  const failed = kyb.status === 'failed';
  return (
    <SectionCard
      id="kyb"
      title="KYB Verification"
      subtitle={failed ? kyb.error : kyb.retrievedAt ? `Last retrieved ${fmtDateTime(kyb.retrievedAt)}` : 'Not retrieved'}
      subtitleTone={failed ? 'error' : 'muted'}
      actions={!readOnly && <RefreshButton label="Retry KYB verification" onClick={() => retryKyb(c.id)} loading={kyb.status === 'loading'} cooldownUntil={failed ? undefined : cooldownUntil} />}
    >
      <FieldGrid>
        <Field label="Entity name (Arabic)">{d?.nameAr ?? '-'}</Field>
        <Field label="Entity name (English)">{d?.nameEn ?? '-'}</Field>
        <Field label="CR Number">{d?.cr ?? '-'}</Field>
        <Field label="Unified number">{d?.unified ?? '-'}</Field>
        <Field label="Entity type">{d?.entityType ?? '-'}</Field>
        <Field label="Paid-up capital">{fmtMoney(d?.paidUpCapital)}</Field>
        <Field label="Total shares">{d?.totalShares ?? '-'}</Field>
        <Field label="Price per share">{fmtMoney(d?.pricePerShare)}</Field>
        <Field label="Revenue">{fmtMoney(d?.revenue)}</Field>
        <Field label="Company age">{d?.companyAge ?? '-'}</Field>
        <Field label="In liquidation process?">{d ? (d.inLiquidation ? 'Yes' : 'No') : '-'}</Field>
      </FieldGrid>
      {d && (
        <div className="mt-5 border-t border-line px-2 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold">Entity activities</h4>
            {d.activities.length > PREVIEW && (
              <Button size="sm" onClick={() => setDrawer(true)}>
                View all {d.activities.length} activities
              </Button>
            )}
          </div>
          <ul className="divide-y divide-line rounded-lg border border-line">
            {d.activities.slice(0, PREVIEW).map((a) => (
              <li key={a.id} className="bidi flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <span>{a.name}</span>
                {a.main && <Badge tone="gray">Main</Badge>}
              </li>
            ))}
          </ul>
          <Drawer open={drawer} onClose={() => setDrawer(false)} title="Entity activities">
            <ul className="divide-y divide-line rounded-lg border border-line">
              {d.activities.map((a) => (
                <li key={a.id} className="bidi flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <span>{a.name}</span>
                  {a.main && <Badge tone="gray">Main</Badge>}
                </li>
              ))}
            </ul>
          </Drawer>
        </div>
      )}
    </SectionCard>
  );
}
