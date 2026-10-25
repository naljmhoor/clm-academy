import type { CaseRecord, Entity } from '@/domain/types';
import { computeSla } from '@/domain/sla';
import type { QueueFilters } from '@/store/queueUiStore';

export interface QueueRow {
  c: CaseRecord;
  entity: Entity;
}

export function selectQueue(cases: CaseRecord[], entities: Entity[], search: string, f: QueueFilters, sortDir: 'asc' | 'desc', now = Date.now()): QueueRow[] {
  const byId = new Map(entities.map((e) => [e.id, e]));
  const q = search.trim().toLowerCase();
  const from = f.dateRange?.from ? Date.parse(f.dateRange.from) : undefined;
  const to = f.dateRange?.to ? Date.parse(f.dateRange.to) + 86_400_000 : undefined;

  const rows = cases
    .map((c) => ({ c, entity: byId.get(c.entityId)! }))
    .filter(({ c, entity }) => {
      if (q && !c.id.toLowerCase().includes(q) && !entity.nameAr.toLowerCase().includes(q) && !(entity.nameEn ?? '').toLowerCase().includes(q)) return false;
      if (f.caseType?.length && !f.caseType.includes(c.type)) return false;
      if (f.status?.length && !f.status.includes(c.status)) return false;
      if (f.priority?.length && !f.priority.includes(c.priority)) return false;
      if (f.assignee?.length && !f.assignee.includes(c.assigneeId ?? 'unassigned')) return false;
      if (f.sla?.length && !f.sla.includes(computeSla(c, now).status)) return false;
      const created = Date.parse(c.createdAt);
      if (from !== undefined && created < from) return false;
      if (to !== undefined && created >= to) return false;
      return true;
    });

  rows.sort((a, b) => (sortDir === 'desc' ? 1 : -1) * (Date.parse(b.c.createdAt) - Date.parse(a.c.createdAt)));
  return rows;
}
