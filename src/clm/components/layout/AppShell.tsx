import { useState, type ReactNode } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Bell, ChevronRight, PanelLeft } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Popover } from '../ui/Popover';
import { Toaster } from '../ui/misc';
import { TrainingBar } from '@/training/TrainingBar';
import { useAcademy } from '@/training/academyStore';
import clsx from 'clsx';
import { useCrumbs, type Crumb } from './crumbs';

export function PageHeader({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-ink-muted" />}
          {c.to ? (
            <Link to={c.to} className="text-ink-muted hover:text-ink">
              {c.label}
            </Link>
          ) : (
            <span className="text-ink">{c.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children?: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const crumbs = useCrumbs((s) => s.crumbs);
  // Training layer: make room for the Ask CLM panel instead of covering the CLM screen.
  const assistantOpen = useAcademy((s) => s.assistantOpen);
  return (
    <div className="flex h-full flex-col">
      <TrainingBar />
      <div className={clsx('flex min-h-0 flex-1', assistantOpen && 'pr-[420px]')}>
        {!collapsed && <Sidebar />}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4">
            <button type="button" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar" className="rounded p-1 text-ink-soft hover:bg-surface-sunken">
              <PanelLeft className="h-4 w-4" />
            </button>
            <span className="h-4 w-px bg-line" />
            <div className="flex-1">
              <PageHeader crumbs={crumbs} />
            </div>
            <Popover
              align="end"
              width={300}
              trigger={({ toggle, ref }) => (
                <button ref={ref} type="button" onClick={toggle} aria-label="Notifications" className="rounded p-1 text-ink-soft hover:bg-surface-sunken">
                  <Bell className="h-4 w-4" />
                </button>
              )}
            >
              <div className="p-4">
                <div className="text-sm font-semibold">Notifications</div>
                <p className="mt-2 text-xs text-ink-muted">You're all caught up. Notification content is not specified in the CLM sources yet.</p>
              </div>
            </Popover>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto" id="main-scroll">
            {children ?? <Outlet />}
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
