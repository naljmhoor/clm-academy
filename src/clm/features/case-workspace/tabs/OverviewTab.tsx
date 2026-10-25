import { AlertCircle, RefreshCw } from 'lucide-react';
import { useClm } from '@/store/caseStore';
import { Button } from '@/clm/components/ui/Button';
import { useWs } from '../context';
import { EntityDetailsSection, KybSection, KycSection } from '../sections/EntitySections';
import { AddressSection, AmlSection, WorkforceSection, ZatcaSection } from '../sections/VerificationSections';

export function OverviewTab() {
  return (
    <div className="space-y-3">
      <EntityDetailsSection />
      <KycSection />
      <KybSection />
      <AddressSection />
      <ZatcaSection />
      <AmlSection />
      <WorkforceSection />
    </div>
  );
}

/** Page-level banner shown when the last Masdr call failed (screen "GOSI retrieval failed"). */
export function WorkforceFailureBanner() {
  const { c, readOnly } = useWs();
  const retrieve = useClm((s) => s.retrieveMasdr);
  const w = c.edd.workforce;
  if (w.status !== 'failed') return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <AlertCircle className="h-4 w-4 shrink-0 text-red-700" />
      <div className="flex-1">
        <div className="text-sm font-medium text-red-700">GOSI retrieval failed</div>
        <div className="text-sm text-ink-soft">{w.error ?? 'Workforce information could not be retrieved from Masdr.'}</div>
      </div>
      {!readOnly && (
        <Button size="sm" onClick={() => retrieve(c.id)}>
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}
