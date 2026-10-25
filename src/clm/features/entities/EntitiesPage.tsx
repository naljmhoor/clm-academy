import { useMemo, useState } from 'react';
import { CircleAlert, Search, X } from 'lucide-react';
import { useClm } from '@/store/caseStore';
import { useBreadcrumbs } from '@/clm/components/layout/crumbs';
import { EmptyState } from '@/clm/components/ui/misc';
import { Badge } from '@/clm/components/ui/Badge';
import { MultiSelect } from '@/clm/components/ui/Select';
import { ClientLink, CLIENT_TYPE_LABEL } from '../case-shared/ClientLink';

const TH = 'h-10 px-3 text-left text-xs font-medium text-ink-soft';
const TD = 'h-12 px-3 text-sm';

/** UC003 Entity List: search by name, CR, unified number or client ID; filter by type and status. */
export function EntitiesPage() {
  useBreadcrumbs([{ label: 'Entities' }]);
  const entities = useClm((s) => s.entities);
  const [q, setQ] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const statusOptions = useMemo(() => [...new Set(entities.map((e) => e.registryStatus))].map((s) => ({ value: s, label: s })), [entities]);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return entities.filter(
      (e) =>
        (!s || [e.id, e.nameAr, e.nameEn ?? '', e.cr, e.unified].some((v) => v.toLowerCase().includes(s))) &&
        (!types.length || types.includes(e.clientType)) &&
        (!statuses.length || statuses.includes(e.registryStatus)),
    );
  }, [entities, q, types, statuses]);

  return (
    <div className="px-6 py-6">
      <h1 className="text-xl font-semibold">Entities</h1>
      <p className="mt-0.5 text-sm text-ink-muted">View and manage all registered entities</p>
      <div className="mb-4 mt-5 flex flex-wrap items-center gap-3">
        <label className="flex h-9 w-96 items-center gap-2 rounded-md border border-line px-3">
          <Search className="h-4 w-4 text-ink-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by client ID, entity name, CR number or unified number" className="w-full text-sm outline-none placeholder:text-ink-faint" />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label="Clear search">
              <X className="h-4 w-4 text-ink-muted" />
            </button>
          )}
        </label>
        <div className="w-56">
          <MultiSelect value={types} onChange={setTypes} searchable={false} placeholder="Client type" options={[{ value: 'borrower', label: 'Borrower' }, { value: 'qualified_investor', label: 'Qualified Investor' }]} />
        </div>
        <div className="w-56">
          <MultiSelect value={statuses} onChange={setStatuses} searchable={false} placeholder="Client status" options={statusOptions} />
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse">
          <thead className="bg-surface-sunken">
            <tr>
              <th className={TH}>Client ID</th>
              <th className={TH}>Client Name</th>
              <th className={TH}>Client Type</th>
              <th className={TH}>CR Number</th>
              <th className={TH}>Unified Number</th>
              <th className={TH}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-t border-line">
                <td className={TD}>{e.id}</td>
                <td className={TD}>
                  <ClientLink entity={e} />
                </td>
                <td className={TD}>
                  <Badge tone="gray">{CLIENT_TYPE_LABEL[e.clientType]}</Badge>
                </td>
                <td className={TD}>{e.cr}</td>
                <td className={TD}>{e.unified}</td>
                <td className={TD}>
                  <span className="text-xs font-medium text-orange-700">{e.registryStatus}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <EmptyState icon={<CircleAlert className="h-5 w-5" />} title="No entities found" body="No entities match the current search or filters." />}
      </div>
    </div>
  );
}

export function NotInTrainingPage({ title }: { title: string }) {
  useBreadcrumbs([{ label: title }]);
  return (
    <div className="px-6 py-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <EmptyState icon={<CircleAlert className="h-5 w-5" />} title="Not available in this training build" body="No screens or requirements for this page were provided yet, so it is not simulated. See docs/ANALYSIS.md, section 6." />
    </div>
  );
}
