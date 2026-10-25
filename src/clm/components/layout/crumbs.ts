import { useEffect } from 'react';
import { create } from 'zustand';

export interface Crumb {
  label: string;
  to?: string;
}

/** Pages publish their breadcrumbs; the shell header renders them. */
export const useCrumbs = create<{ crumbs: Crumb[]; set: (c: Crumb[]) => void }>((set) => ({ crumbs: [], set: (crumbs) => set({ crumbs }) }));

export function useBreadcrumbs(crumbs: Crumb[]) {
  const key = JSON.stringify(crumbs);
  useEffect(() => {
    useCrumbs.getState().set(JSON.parse(key));
  }, [key]);
}
