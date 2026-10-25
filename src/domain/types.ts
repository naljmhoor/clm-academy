// Domain model for the simulated CLM. Pure types — no React, no store.

export type CaseStatus = 'open' | 'in_progress' | 'need_info' | 'closed';
export type Resolution = 'approved' | 'rejected';
export type Priority = 'low' | 'medium' | 'high';
export type CaseType = 'edd';
export type ClientType = 'borrower' | 'qualified_investor';

export interface User {
  id: string;
  name: string;
  initials: string;
  title: string;
  email: string;
}

/** Lifecycle of any simulated external call (SPL, ZATCA, Masdr, Wathq…). */
export type CallStatus = 'not_triggered' | 'loading' | 'success' | 'failed';

export interface Retrieval<T> {
  status: CallStatus;
  data?: T;
  retrievedAt?: string;
  error?: string;
  attempts: number;
}

export interface Entity {
  id: string; // Client ID
  nameAr: string;
  nameEn?: string;
  cr: string;
  unified: string;
  clientType: ClientType;
  registryStatus: string;
}

// ---- KYC -------------------------------------------------------------------

export interface Stakeholder {
  id: string;
  nameAr?: string;
  nameEn?: string;
  idNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  phone?: string;
  yakeenVerified: boolean;
  role: 'Owner' | 'Executive' | 'Company Director' | 'Representative';
  ownership?: number;
  kind: 'person' | 'company';
}

// ---- KYB -------------------------------------------------------------------

export interface KybInfo {
  nameAr: string;
  nameEn?: string;
  cr: string;
  unified: string;
  entityType: string;
  paidUpCapital: number;
  totalShares: number;
  pricePerShare: number;
  revenue: number;
  companyAge: string;
  inLiquidation: boolean;
  activities: { id: string; name: string; main?: boolean }[];
}

// ---- National address ------------------------------------------------------

export interface Address {
  city: string;
  district: string;
  street: string;
  shortAddress?: string;
  postalCode: string;
  additionalNumber?: string;
  buildingNumber?: string;
}
export type AddressSource = 'spl' | 'short_address' | 'manual';

export interface AddressState extends Retrieval<Address> {
  source?: AddressSource;
}

// ---- ZATCA -----------------------------------------------------------------

export interface ZatcaInfo {
  certificateNumber: string;
  certificateStatus: 'Valid' | 'Expired';
  issueDate: string;
  expiryDate: string;
  vatNumber?: string;
  vatStatus?: 'Active' | 'Registered' | 'Inactive';
}
export interface ZatcaState extends Retrieval<ZatcaInfo> {
  entryMethod?: 'retrieved' | 'manual';
}

// ---- AML -------------------------------------------------------------------

export type AmlResult =
  | 'not_triggered'
  | 'in_progress'
  | 'clear'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'reported'
  | 'failed'
  | 'missing_info';

export interface AmlParty {
  id: string;
  name: string;
  kind: 'company' | 'owner';
  result: AmlResult;
  matchSummary?: string;
  decidedBy?: string;
  decidedAt?: string;
}
export interface AmlState {
  screenedAt?: string;
  attempts: number;
  parties: AmlParty[];
}

// ---- Masdr -----------------------------------------------------------------

export interface WorkforceInfo {
  gosiStart: string;
  gosiEnd: string;
  saudiCount: number;
  nonSaudiCount: number;
  saudiWages: number;
  nonSaudiWages: number;
  compliant: boolean;
}

// ---- Ownership -------------------------------------------------------------

export interface OwnerRow {
  id: string;
  name: string;
  idNumber: string;
  role: 'Owner' | 'Executive';
  ownership?: number;
  kind: 'person' | 'company';
}

export interface HierarchyNode {
  id: string;
  name: string;
  kind: 'person' | 'company';
  ownership?: number;
  /** For companies: undefined until retrieved. */
  children?: string[];
  retrieval: 'idle' | 'loading' | 'done' | 'failed';
}

// ---- AOA / signing authority ---------------------------------------------

export interface BotSuggestion {
  documentId: string;
  method: 'jointly' | 'individually';
  signatories: { stakeholderId: string; label?: string }[];
}

export interface AoaState {
  status: 'not_triggered' | 'retrieving' | 'retrieved' | 'unavailable' | 'processing' | 'extracted' | 'extraction_failed';
  source?: 'amaly' | 'upload';
  fileName?: string;
  retrievedAt?: string;
  suggestions?: BotSuggestion[];
  decision?: 'applied' | 'manual';
}

export interface SigningDocument {
  id: string;
  label: string;
  /** Sub-role label for grouped documents such as "CapEx Payment Agency". */
  groupId?: string;
  required: boolean;
  signatoryIds: string[];
}
export interface SigningGroup {
  id: string;
  label: string;
}
export interface SigningState {
  defaultManagerId?: string;
  groups: SigningGroup[];
  documents: SigningDocument[];
  method?: 'bot' | 'manual';
  savedAt?: string;
}

// ---- Activity license ------------------------------------------------------

export interface FileRef {
  id: string;
  name: string;
  sizeKb: number;
  uploadedAt: string;
  mime: string;
}
export interface License {
  id: string;
  number: number;
  origin: 'borrower' | 'admin';
  file?: FileRef;
  category?: string;
  authority?: string;
  issueDate?: string;
  expiryDate?: string;
}

// ---- Documents, comments, activity -----------------------------------------

export interface CaseDocument {
  id: string;
  name: string;
  type: string;
  uploadedById: string;
  uploadedAt: string;
  file: FileRef;
}

export interface Comment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  editedAt?: string;
  attachments: FileRef[];
  kind?: 'comment' | 'info_request';
}

export interface ActivityEntry {
  id: string;
  at: string;
  actorId: string | 'system';
  action: string;
  /** Optional "label: from → to" detail line. */
  field?: string;
  from?: string;
  to?: string;
  detail?: string;
  tone?: 'positive' | 'negative' | 'neutral';
}

export interface Consent {
  type: 'Qawaem Consent' | 'Simah Consent' | 'Bayan Consent';
  status: 'accepted' | 'pending';
  signerName: string;
  signerId: string;
}

// ---- Scenario (training knobs) --------------------------------------------

export type Outcome = 'success' | 'fail' | 'fail_then_success';

export interface Scenario {
  spl: Outcome;
  shortAddress: Outcome;
  zatca: Outcome | 'no_vat';
  aml: 'clear' | 'pending_review' | 'fail';
  masdr: Outcome;
  wathq: Outcome;
  aoa: 'available' | 'unavailable';
  aoaExtraction: 'success' | 'fail';
}

export interface EddData {
  stakeholders: Stakeholder[];
  kyb: Retrieval<KybInfo>;
  consents: { acceptedAt: string; items: Consent[] };
  address: AddressState;
  zatca: ZatcaState;
  aml: AmlState;
  workforce: Retrieval<WorkforceInfo>;
  owners: Retrieval<OwnerRow[]>;
  hierarchy: { rootId: string; nodes: Record<string, HierarchyNode> };
  aoa: AoaState;
  signing: SigningState;
  licenses: License[];
}

export interface CaseRecord {
  id: string;
  entityId: string;
  type: CaseType;
  status: CaseStatus;
  resolution?: Resolution;
  resolutionReason?: string;
  priority: Priority;
  assigneeId?: string;
  createdAt: string;
  createdById: string | 'system';
  dueAt: string;
  closedAt?: string;
  closedById?: string;
  /** Total milliseconds spent in Need Info before the current pause. */
  pausedMs: number;
  pausedSince?: string;
  /** EDD jobs run once, the first time the case moves to In Progress. */
  jobsTriggered: boolean;
  edd: EddData;
  documents: CaseDocument[];
  comments: Comment[];
  activity: ActivityEntry[];
  scenario: Scenario;
}
