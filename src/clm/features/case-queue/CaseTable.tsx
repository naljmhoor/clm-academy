import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CircleAlert } from 'lucide-react';
import clsx from 'clsx';
import { useQueueUi } from '@/store/queueUiStore';
import { fmtDateTime } from '@/clm/format';
import { EmptyState } from '@/clm/components/ui/misc';
import { Select } from '@/clm/components/ui/Select';
import { AssigneeControl, CaseTypeBadge, PriorityControl, SlaChip, StatusControl } from '../case-shared/caseControls';
import { ClientLink, CLIENT_TYPE_LABEL } from '../case-shared/ClientLink';
import type { QueueRow } from './selectQueue';

const TH = 'h-10 px-3 text-left text-xs font-medium text-ink-soft whitespace-nowrap';
const TD = 'h-12 px-3 text-sm whitespace-nowrap';

export function CaseTable({ rows }: { rows: QueueRow[] }) {
  const { sortDir, toggleSort, page, pageSize, setPage, setPageSize } = useQueueUi();
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  const slice = rows.slice((current - 1) * pageSize, current * pageSize);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-line" data-tour="queue-table">
        <table className="w-full min-w-[1080px] border-collapse">
          <thead className="bg-surface-sunken">
            <tr>
              <th className={TH}>Case ID</th>
              <th className={TH}>Client Name</th>
              <th className={TH}>Client Type</th>
              <th className={TH}>Case Type</th>
              <th className={TH} data-tour="queue-col-status">Status</th>
              <th className={TH} data-tour="queue-col-priority">Priority</th>
              <th className={TH} data-tour="queue-col-sla">SLA Status</th>
              <th className={TH} data-tour="queue-col-assignee">Assignee</th>
              <th className={TH}>
                <button type="button" onClick={toggleSort} className="inline-flex items-center gap-1 hover:text-ink" aria-label="Sort by created date">
                  Created Date
                  {sortDir === 'desc' ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {slice.map(({ c, entity }) => (
              <tr key={c.id} className="border-t border-line hover:bg-neutral-50">
                <td className={TD}>
                  <Link to={`/cases/${c.id}`} className="link font-medium" data-tour={`case-link-${c.id}`}>
                    {c.id}
                  </Link>
                </td>
                <td className={clsx(TD, 'max-w-[220px]')}>
                  <ClientLink entity={entity} />
                </td>
                <td className={TD}>{CLIENT_TYPE_LABEL[entity.clientType]}</td>
                <td className={TD}>
                  <CaseTypeBadge />
                </td>
                <td className={TD}>
                  <StatusControl c={c} />
                </td>
                <td className={TD}>
                  <PriorityControl c={c} />
                </td>
                <td className={TD}>
                  <SlaChip c={c} />
                </td>
                <td className={clsx(TD, 'max-w-[200px]')}>
                  <AssigneeControl c={c} />
                </td>
                <td className={TD}>{fmtDateTime(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <EmptyState icon={<CircleAlert className="h-5 w-5" />} title="No cases yet" body="No cases match the current filters. Try widening or clearing them." />}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs font-medium">
          Rows per page
          <div className="w-20">
            <Select value={String(pageSize)} onChange={(v) => setPageSize(Number(v))} options={[10, 20, 50].map((n) => ({ value: String(n), label: String(n) }))} />
          </div>
        </div>
        <div className="text-xs font-medium">
          Page {current} of {pages}
        </div>
        <div className="flex gap-2">
          {[
            { icon: <ChevronsLeft className="h-4 w-4" />, to: 1, label: 'First page', disabled: current === 1 },
            { icon: <ChevronLeft className="h-4 w-4" />, to: current - 1, label: 'Previous page', disabled: current === 1 },
            { icon: <ChevronRight className="h-4 w-4" />, to: current + 1, label: 'Next page', disabled: current === pages },
            { icon: <ChevronsRight className="h-4 w-4" />, to: pages, label: 'Last page', disabled: current === pages },
          ].map((b) => (
            <button key={b.label} type="button" aria-label={b.label} disabled={b.disabled} onClick={() => setPage(b.to)} className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-white disabled:text-ink-faint enabled:hover:bg-surface-sunken">
              {b.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
