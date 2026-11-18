import { useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import type { WorkspaceTab } from '@/domain/eddRules';
import type { CaseRecord } from '@/domain/types';
import { LifecycleOverview } from './lifecycle/LifecycleOverview';
import { CaseTriggerCard } from './lifecycle/shared';
import { useCase, useEntity } from '@/store/caseStore';
import { useBreadcrumbs } from '@/clm/components/layout/crumbs';
import { EmptyState, UnderlineTabs } from '@/clm/components/ui/misc';
import { CaseTypeBadge, PriorityControl, StatusControl } from '../case-shared/caseControls';
import { WorkspaceContext } from './context';
import { AssignmentCard, ConsentCard, RequiredBeforeClosingCard, SlaCard, SystemRecordedCard } from './rail/RailCards';
import { OverviewTab, WorkforceFailureBanner } from './tabs/OverviewTab';
import { OwnershipTab } from './tabs/OwnershipTab';
import { LicenseTab } from './tabs/LicenseTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { ResolutionTab } from './tabs/ResolutionTab';
import { CommentsActivity } from './sections/CommentsActivity';

type TabDef = { value: WorkspaceTab; label: string };
const TABS: TabDef[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'ownership', label: 'Ownership & Management' },
  { value: 'license', label: 'Activity License' },
  { value: 'documents', label: 'Documents' },
];

function tabsFor(type: CaseRecord['type']): TabDef[] {
  if (type === 'edd') return TABS;
  if (type === 'coc') return TABS.filter((t) => t.value !== 'license');
  return TABS.filter((t) => t.value === 'overview' || t.value === 'documents');
}

/** Scrolls to ?focus=<section id> and flashes it (used by Required Before Closing links). */
function useFocusTarget(focus: string | null, tab: string) {
  useEffect(() => {
    if (!focus) return;
    const t = setTimeout(() => {
      const el = document.getElementById(focus);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.remove('flash-target');
      void el.offsetWidth;
      el.classList.add('flash-target');
    }, 80);
    return () => clearTimeout(t);
  }, [focus, tab]);
}

export function CaseWorkspacePage() {
  const { caseId } = useParams();
  const c = useCase(caseId);
  const entity = useEntity(c?.entityId);
  const [params, setParams] = useSearchParams();
  const closed = c?.status === 'closed';
  const type = c?.type ?? 'edd';
  const tabs = useMemo(() => (closed ? [...tabsFor(type), { value: 'resolution' as const, label: 'Resolution' }] : tabsFor(type)), [closed, type]);
  const tabParam = params.get('tab') as WorkspaceTab | null;
  const tab: WorkspaceTab = tabs.some((t) => t.value === tabParam) ? tabParam! : closed ? 'resolution' : 'overview';
  const focus = params.get('focus');
  useFocusTarget(focus, tab);
  useBreadcrumbs([{ label: 'CLM' }, { label: 'Case Queue', to: '/cases' }, { label: caseId ?? '' }]);

  if (!c || !entity) {
    return (
      <EmptyState
        icon={<CircleAlert className="h-5 w-5" />}
        title="Case not found"
        body={
          <>
            {caseId} does not exist in the training data. <Link to="/cases" className="link">Back to Case Queue</Link>
          </>
        }
      />
    );
  }

  return (
    <WorkspaceContext.Provider value={{ c, entity, readOnly: closed }}>
      <div className="px-6 py-6">
        <div className="flex items-center gap-3" data-tour="workspace-header">
          <h1 className="text-2xl font-semibold" data-tour="case-id">
            {c.id}
          </h1>
          <CaseTypeBadge type={c.type} />
          <span className="flex-1" />
          {!closed && <PriorityControl c={c} variant="header" />}
          <StatusControl c={c} variant="header" />
        </div>

        <div className="mt-5 flex items-start gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="rounded-xl border border-line bg-white px-2 pt-2">
              <UnderlineTabs value={tab} onChange={(v) => setParams({ tab: v })} options={tabs.map((t) => ({ ...t, tour: `tab-${t.value}` }))} />
            </div>
            {c.type === 'edd' && <WorkforceFailureBanner />}
            {tab === 'overview' && (c.type === 'edd' ? <OverviewTab /> : <LifecycleOverview />)}
            {tab === 'ownership' && <OwnershipTab />}
            {tab === 'license' && <LicenseTab />}
            {tab === 'documents' && <DocumentsTab />}
            {tab === 'resolution' && <ResolutionTab />}
            <CommentsActivity />
          </div>
          <aside className="sticky top-4 w-[320px] shrink-0 space-y-3" data-tour="case-rail">
            {closed ? <SystemRecordedCard /> : <RequiredBeforeClosingCard />}
            <CaseTriggerCard />
            <SlaCard />
            <AssignmentCard />
            {c.type === 'edd' && <ConsentCard />}
          </aside>
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}
