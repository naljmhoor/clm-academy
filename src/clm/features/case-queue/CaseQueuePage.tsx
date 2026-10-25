import { useMemo } from 'react';
import { Kanban, Search, Sheet, X } from 'lucide-react';
import { useClm } from '@/store/caseStore';
import { useQueueUi } from '@/store/queueUiStore';
import { useBreadcrumbs } from '@/clm/components/layout/crumbs';
import { SegmentedTabs } from '@/clm/components/ui/misc';
import { useNow } from '../case-shared/useNow';
import { FiltersPopover } from './FiltersPopover';
import { CaseTable } from './CaseTable';
import { CaseKanban } from './CaseKanban';
import { selectQueue } from './selectQueue';

export function CaseQueuePage() {
  useBreadcrumbs([{ label: 'Case Queue' }]);
  const cases = useClm((s) => s.cases);
  const entities = useClm((s) => s.entities);
  const { view, setView, search, setSearch, filters, sortDir } = useQueueUi();
  const now = useNow();
  const rows = useMemo(() => selectQueue(cases, entities, search, filters, sortDir, now), [cases, entities, search, filters, sortDir, now]);

  return (
    <div className="px-6 py-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Case Queue</h1>
          <p className="mt-0.5 text-sm text-ink-muted">Track and manage client cases across their lifecycle</p>
        </div>
        <div data-tour="queue-view-toggle">
        <SegmentedTabs
          value={view}
          onChange={setView}
          options={[
            { value: 'table', label: 'Table', icon: <Sheet className="h-3.5 w-3.5" /> },
            { value: 'kanban', label: 'Kanban', icon: <Kanban className="h-3.5 w-3.5" /> },
          ]}
        />
        </div>
      </div>

      <div className="mb-4 mt-5 flex items-center justify-between gap-4">
        <label className="flex h-9 w-80 items-center gap-2 rounded-md border border-line px-3 focus-within:border-ink/40" data-tour="queue-search">
          <Search className="h-4 w-4 text-ink-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by Case ID or Client Name" className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint" aria-label="Search cases" />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="text-ink-muted hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
        <FiltersPopover />
      </div>

      {view === 'table' ? <CaseTable rows={rows} /> : <CaseKanban rows={rows} />}
    </div>
  );
}
