import { SectionCard } from '@/clm/components/ui/Card';
import { ResolutionBadge } from '../../case-shared/caseControls';
import { useWs } from '../context';

export function ResolutionTab() {
  const { c } = useWs();
  return (
    <SectionCard id="resolution" title="Resolution details">
      <div className="space-y-4 px-2">
        <div>
          <div className="label">Resolution</div>
          <div className="mt-1">
            <ResolutionBadge c={c} />
          </div>
        </div>
        <div>
          <div className="label">Resolution reason</div>
          <p className="mt-1 whitespace-pre-wrap text-sm">{c.resolutionReason ?? '-'}</p>
        </div>
      </div>
    </SectionCard>
  );
}
