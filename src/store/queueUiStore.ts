import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CaseStatus, CaseType, Priority } from '@/domain/types';
import type { SlaStatus } from '@/domain/sla';

// Queue view state lives outside the components so search and filters survive
// switching between Table and Kanban and navigating into a case (UC001 BR-2).

export type FilterKey = 'caseType' | 'status' | 'assignee' | 'priority' | 'sla' | 'dateRange';

export interface QueueFilters {
  caseType?: CaseType[];
  status?: CaseStatus[];
  assignee?: string[]; // user ids, 'unassigned' for none
  priority?: Priority[];
  sla?: SlaStatus[];
  dateRange?: { from?: string; to?: string };
}

interface QueueUiState {
  view: 'table' | 'kanban';
  search: string;
  filters: QueueFilters;
  sortDir: 'desc' | 'asc';
  pageSize: number;
  page: number;
  setView: (v: QueueUiState['view']) => void;
  setSearch: (s: string) => void;
  applyFilters: (f: QueueFilters) => void;
  toggleSort: () => void;
  setPageSize: (n: number) => void;
  setPage: (n: number) => void;
}

export const useQueueUi = create<QueueUiState>()(
  persist(
    (set) => ({
      view: 'table',
      search: '',
      filters: {},
      sortDir: 'desc',
      pageSize: 10,
      page: 1,
      setView: (view) => set({ view }),
      setSearch: (search) => set({ search, page: 1 }),
      applyFilters: (filters) => set({ filters, page: 1 }),
      toggleSort: () => set((s) => ({ sortDir: s.sortDir === 'desc' ? 'asc' : 'desc' })),
      setPageSize: (pageSize) => set({ pageSize, page: 1 }),
      setPage: (page) => set({ page }),
    }),
    { name: 'clm-academy:queue-ui:v1' },
  ),
);

export function activeFilterCount(f: QueueFilters): number {
  return (Object.keys(f) as FilterKey[]).filter((k) => {
    const v = f[k];
    if (Array.isArray(v)) return v.length > 0;
    if (k === 'dateRange') return !!(f.dateRange?.from || f.dateRange?.to);
    return false;
  }).length;
}
