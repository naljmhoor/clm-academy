// Overview tab for the Phase II case types. EDD keeps its own OverviewTab.

import { EntityDetailsSection } from '../sections/EntitySections';
import { useWs } from '../context';
import { DetectedChangesSection } from './CocSections';
import { ZatcaCertificateSection, ZatcaExpiryBanner, ZatcaRetrievalSection } from './ZatcaExpirySections';
import { BorrowerTaskSection, ExpiredLicenseSection, RenewedLicenseSection } from './LicenseExpirySections';
import { AuthorizationPermissionsSection, RequesterSection } from './AuthorizationSections';
import { DelegatedPermissionsSection, DelegatorsSection } from './DelegationSections';
import { IbanSection } from './IbanSections';

export function LifecycleOverview() {
  const { c } = useWs();
  return (
    <div className="space-y-3">
      {c.type === 'zatca_expiry' && <ZatcaExpiryBanner />}
      <EntityDetailsSection />
      {c.type === 'coc' && <DetectedChangesSection />}
      {c.type === 'zatca_expiry' && (
        <>
          <ZatcaCertificateSection />
          <ZatcaRetrievalSection />
        </>
      )}
      {c.type === 'license_expiry' && (
        <>
          <ExpiredLicenseSection />
          <BorrowerTaskSection />
          <RenewedLicenseSection key={c.licenseExpiry?.renewed?.uploadedAt ?? 'none'} />
        </>
      )}
      {c.type === 'authorization' && (
        <>
          <RequesterSection requester={c.authorization!.requester} documents={[{ file: c.authorization!.document }]} />
          <AuthorizationPermissionsSection key={c.decision?.at ?? 'open'} />
        </>
      )}
      {c.type === 'delegation' && (
        <>
          <RequesterSection requester={c.delegation!.requester} documents={c.delegation!.documents.map((file) => ({ file }))} />
          <DelegatedPermissionsSection />
          <DelegatorsSection />
        </>
      )}
      {c.type === 'iban' && <IbanSection />}
    </div>
  );
}
