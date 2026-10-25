import type { AmlParty, AmlResult, CaseRecord, EddData, Stakeholder } from './types';

// UC013 EDD approval preconditions and the per-section verdicts they rely on.

export type WorkspaceTab = 'overview' | 'ownership' | 'license' | 'documents' | 'resolution';

export type RequirementKey =
  | 'kyc'
  | 'kyb'
  | 'consents'
  | 'address'
  | 'zatca'
  | 'aml'
  | 'ownership'
  | 'signing'
  | 'licenses';

export interface Requirement {
  key: RequirementKey;
  /** Short label used in the Required Before Closing card. */
  label: string;
  /** Heading used in the "Case can't be closed yet" dialog (BRD message table). */
  heading: string;
  detail: string;
  tab: WorkspaceTab;
  anchor: string;
}

// ---- KYC (UC004) -----------------------------------------------------------

export function missingKycFields(s: Stakeholder): string[] {
  const missing: string[] = [];
  if (!s.nameAr && !s.nameEn) missing.push('Name');
  if (!s.idNumber) missing.push('National ID / Iqama');
  if (!s.dateOfBirth) missing.push('Date of birth');
  if (!s.nationality) missing.push('Nationality');
  if (!s.phone) missing.push('Phone number');
  if (!s.yakeenVerified) missing.push('Yakeen verification');
  return missing;
}

export const isKycVerified = (s: Stakeholder) => missingKycFields(s).length === 0;

// ---- AML (UC008) -----------------------------------------------------------

export type AmlOverall = 'not_triggered' | 'in_progress' | 'pending_review' | 'verified' | 'rejected' | 'failed';

const AML_OK: AmlResult[] = ['clear', 'approved'];

export function amlOverall(parties: AmlParty[]): AmlOverall {
  if (parties.length === 0 || parties.every((p) => p.result === 'not_triggered')) return 'not_triggered';
  if (parties.some((p) => p.result === 'rejected')) return 'rejected';
  if (parties.some((p) => p.result === 'in_progress')) return 'in_progress';
  if (parties.some((p) => p.result === 'failed' || p.result === 'missing_info')) return 'failed';
  if (parties.some((p) => p.result === 'pending_review' || p.result === 'reported')) return 'pending_review';
  if (parties.every((p) => AML_OK.includes(p.result))) return 'verified';
  return 'in_progress';
}

/** Roll-up chip for "Company screening" / "Owners screening". */
export function amlGroupResult(parties: AmlParty[]): AmlResult {
  if (parties.length === 0) return 'not_triggered';
  const order: AmlResult[] = ['rejected', 'failed', 'missing_info', 'pending_review', 'reported', 'in_progress', 'not_triggered', 'approved', 'clear'];
  return order.find((r) => parties.some((p) => p.result === r)) ?? 'clear';
}

export function amlScreenedCount(parties: AmlParty[]): number {
  return parties.filter((p) => !['not_triggered', 'in_progress', 'failed', 'missing_info'].includes(p.result)).length;
}

// ---- Signing authority (UC012) ---------------------------------------------

export function signingMissingDocuments(edd: EddData): string[] {
  return edd.signing.documents.filter((d) => d.required && d.signatoryIds.length === 0).map((d) => d.label);
}

export function signingSummary(count: number): string {
  if (count === 0) return 'Not configured';
  if (count === 1) return '1 signatory · single signature';
  return `${count} signatories · all must sign`;
}

// ---- Activity licenses (UC010) ---------------------------------------------

export function incompleteLicenses(edd: EddData): number[] {
  return edd.licenses
    .filter((l) => !l.category || !l.authority || (l.origin === 'admin' && !l.file))
    .map((l) => l.number);
}

/** Licenses are mandatory only when at least one exists (borrower-uploaded or added). */
export const licensesRequired = (edd: EddData) => edd.licenses.length > 0;

// ---- Address (UC006) ---------------------------------------------------------

export const ADDRESS_REQUIRED: (keyof NonNullable<EddData['address']['data']>)[] = ['city', 'district', 'street', 'postalCode'];

export function isAddressComplete(edd: EddData): boolean {
  const a = edd.address.data;
  return !!a && ADDRESS_REQUIRED.every((k) => !!a[k]?.toString().trim());
}

export const SHORT_ADDRESS_PATTERN = /^[A-Za-z]{4}[0-9]{4}$/;

// ---- Preconditions -----------------------------------------------------------

export function evaluateRequirements(c: CaseRecord): Requirement[] {
  const edd = c.edd;
  const out: Requirement[] = [];

  if (!edd.stakeholders.some(isKycVerified)) {
    out.push({ key: 'kyc', label: 'KYC Verification', heading: 'KYC is incomplete', detail: 'At least one company stakeholder must have completed KYC verification.', tab: 'overview', anchor: 'kyc' });
  }
  if (edd.kyb.status !== 'success') {
    out.push({ key: 'kyb', label: 'KYB Verification', heading: 'KYB is incomplete', detail: 'Company information has not been successfully retrieved from Wathq.', tab: 'overview', anchor: 'kyb' });
  }
  if (edd.consents.items.some((i) => i.status !== 'accepted')) {
    out.push({ key: 'consents', label: 'Company Consents', heading: 'Company Consents are incomplete', detail: 'The required company consents have not yet been approved by the company.', tab: 'overview', anchor: 'consents' });
  }
  if (!isAddressComplete(edd)) {
    out.push({ key: 'address', label: 'National Address', heading: 'National Address is missing', detail: 'The information has not been retrieved from SPL or entered manually.', tab: 'overview', anchor: 'address' });
  }
  const z = edd.zatca.data;
  if (!z || !z.certificateNumber || !z.vatNumber) {
    out.push({ key: 'zatca', label: 'VAT & Zakat Certificate', heading: 'VAT & Zakat information is incomplete', detail: 'The information has not been retrieved from ZATCA or entered manually.', tab: 'overview', anchor: 'zatca' });
  }
  const aml = amlOverall(edd.aml.parties);
  if (aml !== 'verified') {
    const screened = amlScreenedCount(edd.aml.parties);
    const detail =
      aml === 'pending_review'
        ? 'One or more AML results require a review decision.'
        : aml === 'rejected'
          ? 'An AML result was rejected.'
          : `Only ${screened} of ${edd.aml.parties.length} parties have been screened.`;
    out.push({ key: 'aml', label: 'AML Screening', heading: 'AML Screening is incomplete', detail, tab: 'overview', anchor: 'aml' });
  }
  if (edd.owners.status !== 'success') {
    out.push({ key: 'ownership', label: 'Ownership & Management', heading: 'Ownership & Management information is incomplete', detail: 'The company ownership and management information has not been successfully retrieved from Wathq.', tab: 'ownership', anchor: 'owners' });
  }
  const missingDocs = signingMissingDocuments(edd);
  if (missingDocs.length > 0 || !edd.signing.defaultManagerId) {
    const parts: string[] = [];
    if (!edd.signing.defaultManagerId) parts.push('a default authorized manager');
    if (missingDocs.length) parts.push(`a signatory on ${missingDocs.join(', ')}`);
    const never = missingDocs.length === edd.signing.documents.filter((d) => d.required).length && !edd.signing.method;
    out.push({
      key: 'signing',
      label: 'Signing Authority',
      heading: 'Signing Authority is incomplete',
      detail: never ? 'Signing authority has not been configured yet.' : `Still required: ${parts.join(' and ')}.`,
      tab: 'ownership',
      anchor: 'signing',
    });
  }
  if (licensesRequired(edd)) {
    const bad = incompleteLicenses(edd);
    for (const n of bad) {
      out.push({ key: 'licenses', label: 'Activity License', heading: 'Activity License is incomplete', detail: `License ${n} is missing its document, license category or issuing authority.`, tab: 'license', anchor: `license-${n}` });
    }
  }
  return out;
}
