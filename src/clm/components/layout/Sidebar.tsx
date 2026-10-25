import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { AppWindow, ChevronsUpDown, ChevronUp, ClipboardList, LayoutDashboard, ListChecks, ShieldCheck, SquareUserRound, UserCog, Check } from 'lucide-react';
import { Popover } from '../ui/Popover';
import { useCurrentUser } from '@/store/caseStore';
import { Avatar } from '../ui/misc';

interface NavChild {
  label: string;
  to?: string;
}
interface NavGroup {
  label: string;
  icon: ReactNode;
  to?: string;
  soon?: boolean;
  children?: NavChild[];
}

const SECTIONS: NavGroup[] = [
  { label: 'Case Queue', icon: <ClipboardList className="h-4 w-4" />, to: '/cases' },
  {
    label: 'Client Registry',
    icon: <SquareUserRound className="h-4 w-4" />,
    children: [{ label: 'Entities', to: '/entities' }, { label: 'Individuals', to: '/individuals' }],
  },
  { label: 'Lifecycle', icon: <ListChecks className="h-4 w-4" />, soon: true, children: [{ label: 'Reclassification' }, { label: 'Changes' }, { label: 'Periodic Review' }, { label: 'Offboarding' }] },
  { label: 'AML & Compliance', icon: <ShieldCheck className="h-4 w-4" />, soon: true, children: [{ label: 'Screening' }, { label: 'Alerts' }, { label: 'Blocklists' }] },
  { label: 'Operations', icon: <UserCog className="h-4 w-4" />, soon: true, children: [{ label: 'Assignment Rules' }, { label: 'SLA Configuration' }] },
];

const Soon = () => <span className="rounded-md bg-neutral-200/70 px-1.5 text-2xs font-semibold text-ink-soft">soon</span>;

function itemClass(active: boolean, disabled?: boolean) {
  return clsx(
    'flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm',
    disabled ? 'cursor-default text-ink-muted' : active ? 'bg-neutral-200/60 font-medium text-ink' : 'text-ink-soft hover:bg-neutral-200/40 hover:text-ink',
  );
}

function Group({ g }: { g: NavGroup }) {
  const [open, setOpen] = useState(true);
  if (!g.children) {
    return (
      <NavLink to={g.to!} data-tour={`nav-${g.label.toLowerCase().replace(/\s+/g, '-')}`} className={({ isActive }) => itemClass(isActive)}>
        {g.icon}
        {g.label}
      </NavLink>
    );
  }
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} className={itemClass(false, g.soon)} aria-expanded={open}>
        {g.icon}
        <span className="flex-1 text-left">{g.label}</span>
        {g.soon && <Soon />}
        <ChevronUp className={clsx('h-4 w-4 transition-transform', !open && 'rotate-180')} />
      </button>
      {open && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-line pl-2">
          {g.children.map((c) =>
            c.to && !g.soon ? (
              <NavLink key={c.label} to={c.to} className={({ isActive }) => itemClass(isActive)}>
                {c.label}
              </NavLink>
            ) : (
              <div key={c.label} className={itemClass(false, true)} title="Not available yet in CLM">
                {c.label}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const user = useCurrentUser();
  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-line bg-surface-rail" data-tour="sidebar">
      <div className="p-2">
        <Popover
          width="trigger"
          trigger={({ toggle, ref }) => (
            <button ref={ref} type="button" onClick={toggle} className="flex w-full items-center gap-2 rounded-lg border border-line bg-white p-2 text-left shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink text-white">
                <AppWindow className="h-4 w-4" />
              </span>
              <span className="flex-1 leading-tight">
                <span className="block text-sm font-semibold">Client Lifecycle</span>
                <span className="block text-xs text-ink-soft">Customer Hub</span>
              </span>
              <ChevronsUpDown className="h-4 w-4 text-ink-muted" />
            </button>
          )}
        >
          <div className="p-1">
            <div className="px-2 py-1.5 text-xs text-ink-muted">Platforms</div>
            <div className="flex items-center gap-2 rounded-md bg-surface-sunken px-2 py-1.5 text-sm">
              <span className="flex-1">Client Lifecycle</span>
              <Check className="h-4 w-4" />
            </div>
            <div className="px-2 py-1.5 text-xs text-ink-muted">Other Manafa platforms are not part of the training environment.</div>
          </div>
        </Popover>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="px-2 pb-1 pt-3 text-xs text-ink-muted">Main</div>
        <div className={itemClass(false, true)} title="Not available yet in CLM">
          <LayoutDashboard className="h-4 w-4" />
          <span className="flex-1">Dashboard</span>
          <Soon />
        </div>
        <div className="px-2 pb-1 pt-5 text-xs text-ink-muted">Sections</div>
        <div className="space-y-0.5">
          {SECTIONS.map((g) => (
            <Group key={g.label} g={g} />
          ))}
        </div>
      </nav>

      <div className="flex items-center gap-2 border-t border-line p-3">
        <Avatar user={user} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-semibold">{user.name}</div>
          <div className="truncate text-xs text-ink-soft">{user.email}</div>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-ink-muted" aria-hidden />
      </div>
    </aside>
  );
}
