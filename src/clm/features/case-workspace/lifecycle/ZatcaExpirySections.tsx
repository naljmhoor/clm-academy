// UC002 ZATCA Certificate Expiry.

import { AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useClm, useUsers } from '@/store/caseStore';
import { fmtDate, fmtDateTime } from '@/clm/format';
import { Field, FieldGrid, SectionCard } from '@/clm/components/ui/Card';
import { Badge } from '@/clm/components/ui/Badge';
import { Button } from '@/clm/components/ui/Button';
import { HelpTip } from '@/training/help/HelpTip';
import { useWs } from '../context';
import { RefreshButton } from '../sections/common';

export function ZatcaExpiryBanner() {
  const { c, readOnly } = useWs();
  const retry = useClm((s) => s.retryZatcaExpiry);
  const z = c.zatcaExpiry!;
  if (z.renewed || readOnly) return null;
  const last = z.attempts[0];
  if (last?.result === 'failed') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3" data-tour="zatca-banner">
        <AlertCircle className="h-4 w-4 shrink-0 text-red-700" />
        <div className="flex-1">
          <div className="text-sm font-medium text-red-700">ZATCA retrieval failed</div>
          <div className="text-sm text-ink-soft">ZATCA service could not be reached. No certificate data was returned. Try again in a few minutes.</div>
        </div>
        <Button size="sm" onClick={() => retry(c.id)} loading={z.loading} data-tour="zatca-retry">
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border border-orange-300 bg-orange-50 px-4 py-3" data-tour="zatca-banner">
      <AlertTriangle className="h-4 w-4 shrink-0 text-orange-700" />
      <div className="flex-1">
        <div className="text-sm font-medium text-orange-700">ZATCA certificate expired</div>
        <div className="text-sm text-ink-soft">Expired on {fmtDate(z.expired.expiryDate)}. No renewed certificate was found. Retry the ZATCA retrieval to check for a valid certificate.</div>
      </div>
      <Button size="sm" onClick={() => retry(c.id)} loading={z.loading} data-tour="zatca-retry">
        <RefreshCw className="h-3.5 w-3.5" />
        Retry retrieval
      </Button>
    </div>
  );
}

export function ZatcaCertificateSection() {
  const { c } = useWs();
  const z = c.zatcaExpiry!;
  const cert = z.renewed ?? z.expired;
  return (
    <SectionCard id="zatca-certificate" title={z.renewed ? 'ZATCA Renewed Certificate' : 'ZATCA Certificate'}>
      <FieldGrid>
        <Field label="Certificate number">{cert.number}</Field>
        <Field label="Issue date">{fmtDate(cert.issueDate)}</Field>
        <Field label="Expiry date">{fmtDate(cert.expiryDate)}</Field>
        <Field label="Current status">{z.renewed ? <Badge tone="green">Valid</Badge> : <Badge tone="red">Expired</Badge>}</Field>
      </FieldGrid>
    </SectionCard>
  );
}

const RESULT: Record<string, { label: string; tone: 'green' | 'red' | 'orange' }> = {
  found: { label: 'Certificate found', tone: 'green' },
  none: { label: 'No certificate', tone: 'orange' },
  failed: { label: 'Failed', tone: 'red' },
};

export function ZatcaRetrievalSection() {
  const { c, readOnly } = useWs();
  const users = useUsers();
  const retry = useClm((s) => s.retryZatcaExpiry);
  const z = c.zatcaExpiry!;
  return (
    <SectionCard
      id="zatca-retrieval"
      title={
        <span className="flex items-center gap-1.5">
          ZATCA Retrieval <HelpTip topic="zatca-expiry" label="How does ZATCA retrieval work?" />
        </span>
      }
      subtitle={`Last retrieved · ${fmtDateTime(z.attempts[0]?.at)}`}
      actions={!readOnly && !z.renewed && <RefreshButton label="Retry retrieval" onClick={() => retry(c.id)} loading={z.loading} />}
    >
      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-surface-sunken text-left">
            <tr>
              <th className="h-10 px-3 font-medium">Attempt date & time</th>
              <th className="h-10 px-3 font-medium">Triggered by</th>
              <th className="h-10 px-3 font-medium">Result</th>
              <th className="h-10 px-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {z.attempts.map((a) => (
              <tr key={a.id} className="border-t border-line">
                <td className="h-11 px-3">{fmtDateTime(a.at)}</td>
                <td className="px-3">{a.by === 'system' ? 'System · expiry reached' : `${users.find((u) => u.id === a.by)?.name ?? 'User'} · retry`}</td>
                <td className="px-3">
                  <Badge tone={RESULT[a.result].tone}>{RESULT[a.result].label}</Badge>
                </td>
                <td className="px-3 text-ink-muted">{a.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
