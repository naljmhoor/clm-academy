import { useState } from 'react';
import clsx from 'clsx';
import { CalendarDays, Check, ChevronDown, ListFilter, Trash2 } from 'lucide-react';
import { Popover } from '@/clm/components/ui/Popover';
import { Button } from '@/clm/components/ui/Button';
import { MultiSelect } from '@/clm/components/ui/Select';
import { activeFilterCount, useQueueUi, type FilterKey, type QueueFilters } from '@/store/queueUiStore';
import { useUsers } from '@/store/caseStore';
import { STATUS_LABEL, STATUS_ORDER } from '@/domain/transitions';
import { SLA_STATUS_LABEL } from '@/domain/sla';

const FILTER_LABEL: Record<FilterKey, string> = {
  caseType: 'Case Type',
  status: 'Case Status',
  assignee: 'Assignee',
  priority: 'Priority',
  sla: 'SLA Status',
  dateRange: 'Date Range',
};
const ALL_KEYS = Object.keys(FILTER_LABEL) as FilterKey[];

function enabledKeys(f: QueueFilters): FilterKey[] {
  return ALL_KEYS.filter((k) => f[k] !== undefined);
}

export function FiltersPopover() {
  const { filters, applyFilters } = useQueueUi();
  const users = useUsers();
  const [draft, setDraft] = useState<QueueFilters>(filters);
  const count = activeFilterCount(filters);
  const keys = enabledKeys(draft);

  const toggleKey = (k: FilterKey) =>
    setDraft((d) => {
      const next = { ...d };
      if (next[k] !== undefined) delete next[k];
      else (next as Record<string, unknown>)[k] = k === 'dateRange' ? {} : [];
      return next;
    });

  const options: Record<Exclude<FilterKey, 'dateRange'>, { value: string; label: string }[]> = {
    caseType: [{ value: 'edd', label: 'Due Diligence' }],
    status: STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
    assignee: [{ value: 'unassigned', label: 'Unassigned' }, ...users.map((u) => ({ value: u.id, label: u.name }))],
    priority: [
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' },
    ],
    sla: (['on_track', 'at_risk', 'breached', 'met'] as const).map((s) => ({ value: s, label: SLA_STATUS_LABEL[s] })),
  };

  return (
    <Popover
      align="end"
      width={400}
      onOpenChange={(o) => o && setDraft(filters)}
      trigger={({ toggle, ref, open }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          data-tour="queue-filters"
          className={clsx(
            'flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium',
            count ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:bg-surface-sunken',
            open && !count && 'ring-2 ring-ink/10',
          )}
        >
          <ListFilter className="h-4 w-4" />
          Filters
          {count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-2xs text-ink">{count}</span>}
        </button>
      )}
    >
      {(close) => (
        <div className="p-4">
          <div className="text-sm font-medium text-ink-soft">Filters</div>
          <div className="mt-3">
            <Popover
              width={210}
              trigger={({ toggle, ref }) => (
                <button ref={ref} type="button" onClick={toggle} className="flex h-9 w-52 items-center justify-between rounded-md border border-line px-3 text-sm font-medium">
                  Select filters
                  <ChevronDown className="h-4 w-4 text-ink-muted" />
                </button>
              )}
            >
              <div className="py-1">
                <div className="border-b border-line px-3 pb-2 pt-1 text-xs text-ink-muted">Available Filters</div>
                {ALL_KEYS.map((k) => (
                  <button key={k} type="button" onClick={() => toggleKey(k)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-surface-sunken">
                    <span className={clsx('flex h-4 w-4 items-center justify-center rounded border', draft[k] !== undefined ? 'border-ink bg-ink text-white' : 'border-neutral-300')}>
                      {draft[k] !== undefined && <Check className="h-3 w-3" />}
                    </span>
                    {FILTER_LABEL[k]}
                  </button>
                ))}
              </div>
            </Popover>
          </div>

          {keys.length > 0 && (
            <div className="mt-4 space-y-3">
              {keys.map((k) => (
                <div key={k}>
                  <div className="mb-1.5 text-sm">{FILTER_LABEL[k]}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      {k === 'dateRange' ? (
                        <div className="flex items-center gap-2">
                          <label className="flex h-9 flex-1 items-center gap-2 rounded-md border border-line px-2 text-sm">
                            <CalendarDays className="h-4 w-4 text-ink-muted" />
                            <input type="date" aria-label="From date" value={draft.dateRange?.from ?? ''} onChange={(e) => setDraft((d) => ({ ...d, dateRange: { ...d.dateRange, from: e.target.value || undefined } }))} className="w-full text-sm outline-none" />
                          </label>
                          <span className="text-ink-muted">–</span>
                          <label className="flex h-9 flex-1 items-center gap-2 rounded-md border border-line px-2 text-sm">
                            <input type="date" aria-label="To date" value={draft.dateRange?.to ?? ''} onChange={(e) => setDraft((d) => ({ ...d, dateRange: { ...d.dateRange, to: e.target.value || undefined } }))} className="w-full text-sm outline-none" />
                          </label>
                        </div>
                      ) : (
                        <MultiSelect
                          value={(draft[k] as string[]) ?? []}
                          onChange={(v) => setDraft((d) => ({ ...d, [k]: v }))}
                          options={options[k]}
                          placeholder={`Select ${FILTER_LABEL[k].toLowerCase()}`}
                          searchable={k === 'assignee'}
                        />
                      )}
                    </div>
                    <button type="button" aria-label={`Remove ${FILTER_LABEL[k]} filter`} onClick={() => toggleKey(k)} className="rounded p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const cleaned: QueueFilters = {};
                for (const k of enabledKeys(draft)) (cleaned as Record<string, unknown>)[k] = draft[k];
                applyFilters(cleaned);
                close();
              }}
            >
              Apply Filter
            </Button>
            <Button
              variant="danger-link"
              className="text-sm"
              onClick={() => {
                setDraft({});
                applyFilters({});
                close();
              }}
            >
              Clear all
            </Button>
          </div>
        </div>
      )}
    </Popover>
  );
}
