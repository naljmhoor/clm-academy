import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CircleAlert, Info } from 'lucide-react';
import { isKycVerified } from '@/domain/eddRules';
import { useClm, useEntity, useUsers } from '@/store/caseStore';
import { useBreadcrumbs } from '@/clm/components/layout/crumbs';
import { Field, FieldGrid, SectionCard } from '@/clm/components/ui/Card';
import { Badge } from '@/clm/components/ui/Badge';
import { EmptyState, UnderlineTabs } from '@/clm/components/ui/misc';
import { fmtDateTime, fmtMoney } from '@/clm/format';
import { CaseTypeBadge, ResolutionBadge, SlaChip, STATUS_TONE } from '../case-shared/caseControls';
import { CLIENT_TYPE_LABEL } from '../case-shared/ClientLink';
import { STATUS_LABEL } from '@/domain/transitions';
import { FileActions } from '../case-workspace/dialogs/documents';

type Tab = 'summary' | 'stakeholders' | 'cases' | 'documents';

/**
 * Read-only entity view assembled from data CLM already holds (UC003 + case data).
 * The full Entity Profile is out of the MVP (BRD 3.3 #10); live CLM links to the Admin profile.
 */
export function EntityProfilePage() {
  const { entityId } = useParams();
  const entity = useEntity(entityId);
  const allCases = useClm((s) => s.cases);
  const cases = useMemo(() => allCases.filter((c) => c.entityId === entityId), [allCases, entityId]);
  const users = useUsers();
  const [tab, setTab] = useState<Tab>('summary');
  useBreadcrumbs([{ label: 'Entities', to: '/entities' }, { label: entity?.nameAr ?? entityId ?? '' }]);

  if (!entity) return <EmptyState icon={<CircleAlert className="h-5 w-5" />} title="Entity not found" body={<Link to="/entities" className="link">Back to Entities</Link>} />;

  const latest = [...cases].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  const kyb = latest?.edd.kyb.data;
  const docs = cases.flatMap((c) => c.documents.map((d) => ({ ...d, caseId: c.id })));
  const TH = 'h-10 px-3 text-left text-sm font-medium';

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="bidi text-2xl font-semibold">{entity.nameAr}</h1>
        <Badge tone="gray">{CLIENT_TYPE_LABEL[entity.clientType]}</Badge>
        <span className="text-xs font-medium text-orange-700">{entity.registryStatus}</span>
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        Client ID {entity.id} · CR {entity.cr} · Unified {entity.unified}
      </p>
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-academy/30 bg-academy-soft px-3 py-2 text-xs text-academy" data-training-layer>
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Training view. The full Entity Profile (users, timeline, group structure) is planned after the MVP; in the live release the client name opens the company profile in the Admin portal. This page only shows information CLM already holds for the entity.
      </div>

      <div className="mt-5 rounded-xl border border-line bg-white px-2 pt-2">
        <UnderlineTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'summary', label: 'Summary' },
            { value: 'stakeholders', label: 'Stakeholders' },
            { value: 'cases', label: `Cases (${cases.length})` },
            { value: 'documents', label: `Documents (${docs.length})` },
          ]}
        />
      </div>

      <div className="mt-3">
        {tab === 'summary' && (
          <SectionCard title="Company information" subtitle={latest?.edd.kyb.retrievedAt ? `From Wathq · ${fmtDateTime(latest.edd.kyb.retrievedAt)}` : 'Wathq information not retrieved'}>
            <FieldGrid>
              <Field label="Entity name (Arabic)">{entity.nameAr}</Field>
              <Field label="Entity name (English)">{entity.nameEn ?? '-'}</Field>
              <Field label="CR Number">{entity.cr}</Field>
              <Field label="Unified number">{entity.unified}</Field>
              <Field label="Entity type">{kyb?.entityType ?? '-'}</Field>
              <Field label="Paid-up capital">{fmtMoney(kyb?.paidUpCapital)}</Field>
              <Field label="Company age">{kyb?.companyAge ?? '-'}</Field>
              <Field label="National address">{latest?.edd.address.data ? `${latest.edd.address.data.district}, ${latest.edd.address.data.city}` : '-'}</Field>
            </FieldGrid>
          </SectionCard>
        )}
        {tab === 'stakeholders' && (
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-surface-sunken">
                <tr>
                  <th className={TH}>Name</th>
                  <th className={TH}>Role</th>
                  <th className={TH}>Ownership %</th>
                  <th className={TH}>KYC status</th>
                </tr>
              </thead>
              <tbody>
                {(latest?.edd.stakeholders ?? []).map((s) => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="bidi h-12 px-3">{s.nameAr ?? s.nameEn}</td>
                    <td className="px-3">{s.role}</td>
                    <td className="px-3">{s.ownership !== undefined ? `${s.ownership} %` : '-'}</td>
                    <td className="px-3">
                      <Badge tone={isKycVerified(s) ? 'green' : 'red'}>{isKycVerified(s) ? 'Verified' : 'Not verified'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'cases' && (
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-surface-sunken">
                <tr>
                  <th className={TH}>Case ID</th>
                  <th className={TH}>Case Type</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>SLA Status</th>
                  <th className={TH}>Owner</th>
                  <th className={TH}>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="border-t border-line">
                    <td className="h-12 px-3">
                      <Link to={`/cases/${c.id}`} className="link font-medium">
                        {c.id}
                      </Link>
                    </td>
                    <td className="px-3">
                      <CaseTypeBadge />
                    </td>
                    <td className="px-3">{c.status === 'closed' ? <ResolutionBadge c={c} /> : <Badge tone={STATUS_TONE[c.status] === 'neutral' ? 'gray' : STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>}</td>
                    <td className="px-3">
                      <SlaChip c={c} />
                    </td>
                    <td className="px-3">{users.find((u) => u.id === c.assigneeId)?.name ?? 'Unassigned'}</td>
                    <td className="px-3">{fmtDateTime(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'documents' && (
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-surface-sunken">
                <tr>
                  <th className={TH}>Document Name</th>
                  <th className={TH}>Document Type</th>
                  <th className={TH}>Case</th>
                  <th className={TH}>Upload Date</th>
                  <th className={TH}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-t border-line">
                    <td className="h-12 px-3">{d.name}</td>
                    <td className="px-3">{d.type}</td>
                    <td className="px-3">
                      <Link to={`/cases/${d.caseId}?tab=documents`} className="link">
                        {d.caseId}
                      </Link>
                    </td>
                    <td className="px-3">{fmtDateTime(d.uploadedAt)}</td>
                    <td className="px-3">
                      <FileActions file={d.file} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {docs.length === 0 && <EmptyState title="No documents" />}
          </div>
        )}
      </div>
    </div>
  );
}
