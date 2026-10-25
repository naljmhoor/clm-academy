import { createContext, useContext } from 'react';
import type { CaseRecord, Entity } from '@/domain/types';

export interface WorkspaceCtx {
  c: CaseRecord;
  entity: Entity;
  /** UC002: closed cases are read-only. */
  readOnly: boolean;
}

export const WorkspaceContext = createContext<WorkspaceCtx | null>(null);

export function useWs(): WorkspaceCtx {
  const v = useContext(WorkspaceContext);
  if (!v) throw new Error('useWs must be used inside a case workspace');
  return v;
}

export const personName = (s: { nameAr?: string; nameEn?: string }) => s.nameAr ?? s.nameEn ?? '-';
