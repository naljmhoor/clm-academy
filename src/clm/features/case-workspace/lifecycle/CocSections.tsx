// UC001 Change of Circumstance.

import { useNavigate } from 'react-router-dom';
import { ArrowRight, PenLine, Users } from 'lucide-react';
import type { CocAction } from '@/domain/types';
import { impactedSigningDocuments } from '@/domain/eddRules';
import { fmtDateTime } from '@/clm/format';
import { SectionCard } from '@/clm/components/ui/Card';
import { Badge } from '@/clm/components/ui/Badge';
import { Button } from '@/clm/components/ui/Button';
import { HelpTip } from '@/training/help/HelpTip';
import { useWs } from '../context';

const ACTION_LABEL: Record<CocAction, string> = {
  review: 'Review only',
  ownership: 'Review ownership',
  configuration: 'Update configuration',
};

const TH = 'h-10 px-3 text-left text-sm font-medium';
const TD = 'px-3 py-2.5 text-sm align-top';

export function DetectedChangesSection() {
  const { c } = useWs();
  const navigate = useNavigate();
  const coc = c.coc!;
  const pending = impactedSigningDocuments(c).length;
  const needsConfig = coc.changes.some((x) => x.action === 'configuration');
  const go = (focus: string) => navigate(`/cases/${c.id}?tab=ownership&focus=${focus}`);
  return (
    <SectionCard
      id="detected-changes"
      title={
        <span className="flex items-center gap-1.5">
          Detected Changes <HelpTip topic="coc" label="What happens in a Change of Circumstance case?" />
        </span>
      }
      subtitle="Compared with the data CLM holds for this company. Each change shows the action it needs."
    >
      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full border-collapse">
          <thead className="bg-surface-sunken">
            <tr>
              <th className={TH}>Changed Field</th>
              <th className={TH}>Previous value</th>
              <th className={TH}>New value</th>
              <th className={TH}>Required action</th>
            </tr>
          </thead>
          <tbody>
            {coc.changes.map((ch) => {
              const open = ch.action === 'configuration' && pending > 0;
              return (
                <tr key={ch.id} className="border-t border-line">
                  <td className={`${TD} font-medium`}>{ch.field}</td>
                  <td className={`${TD} bidi text-ink-muted`}>{ch.previous}</td>
                  <td className={`${TD} bidi`}>{ch.next}</td>
                  <td className={TD}>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {ACTION_LABEL[ch.action]}
                      {open && <Badge tone="red">Requires action</Badge>}
                      {ch.action === 'configuration' && !open && <Badge tone="green">Updated</Badge>}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(coc.ownershipChanges.length > 0 || needsConfig) && (
        <div className="mt-3 flex justify-end gap-2">
          {coc.ownershipChanges.length > 0 && (
            <Button size="sm" onClick={() => go('ownership-changes')} data-tour="coc-view-ownership">
              <Users className="h-3.5 w-3.5" />
              View ownership changes
            </Button>
          )}
          {needsConfig && (
            <Button size="sm" variant={pending ? 'primary' : 'secondary'} onClick={() => go('signing')} data-tour="coc-update-signing">
              <PenLine className="h-3.5 w-3.5" />
              Update Signing Authority
            </Button>
          )}
        </div>
      )}
    </SectionCard>
  );
}

export function OwnershipChangesSection() {
  const { c } = useWs();
  const rows = c.coc?.ownershipChanges ?? [];
  return (
    <SectionCard id="ownership-changes" title="Ownership & Management Changes" subtitle={rows.length ? 'Retrieved from Wathq. Review how owners and managers changed.' : 'No ownership or management changes were detected.'}>
      {rows.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full border-collapse">
            <thead className="bg-surface-sunken">
              <tr>
                <th className={TH}>Name</th>
                <th className={TH}>Previous</th>
                <th className={TH}>New</th>
                <th className={TH}>Change type</th>
                <th className={TH}>Change date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className={TD}>
                    <span className="bidi block">{r.name}</span>
                    <span className="block text-xs text-ink-muted">{r.ref}</span>
                  </td>
                  <td className={`${TD} text-ink-muted`}>{r.previous}</td>
                  <td className={TD}>
                    <span className="flex items-center gap-1">
                      <ArrowRight className="h-3 w-3 text-ink-muted" />
                      {r.next}
                    </span>
                  </td>
                  <td className={TD}>
                    <Badge tone={r.changeType === 'Owner removed' ? 'red' : r.changeType === 'Owner added' ? 'green' : 'orange'}>{r.changeType}</Badge>
                  </td>
                  <td className={TD}>{fmtDateTime(r.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
