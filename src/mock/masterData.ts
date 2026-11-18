// Configurable master data (synthetic). In production these come from CLM configuration.

export const CITIES: { name: string; districts: string[] }[] = [
  { name: 'الرياض', districts: ['الملز', 'العليا', 'النخيل', 'الياسمين', 'السليمانية', 'الملقا'] },
  { name: 'جدة', districts: ['الروضة', 'الشاطئ', 'الحمراء', 'السلامة', 'البوادي'] },
  { name: 'الدمام', districts: ['الفيصلية', 'الشاطئ الغربي', 'المزروعية', 'الريان'] },
  { name: 'مكة المكرمة', districts: ['العزيزية', 'الشوقية', 'النسيم'] },
  { name: 'المدينة المنورة', districts: ['قباء', 'العزيزية', 'الخالدية'] },
];

export const STREETS = ['طريق الملك فهد', 'شارع التحلية', 'طريق الأمير سلطان', 'شارع الأمير محمد بن عبدالعزيز', 'طريق الملك عبدالله', 'شارع العروبة'];

// ASQ-5970: Activity License master data. Category → issuing authorities mapping as provided.
// (Construction listed "Municipalities / Amanahs" twice in the source; de-duplicated here.)
const NCEC = 'National Center for Environmental Compliance (NCEC)';
const MIM = 'Ministry of Industry and Mineral Resources';
const GACA = 'General Authority of Civil Aviation (GACA)';
const TGA = 'Transport General Authority (TGA)';
const MAWANI = 'Saudi Ports Authority (Mawani)';
const MWAN = 'National Center for Waste Management (MWAN)';
const AMANAH = 'Municipalities / Amanahs';
const TOURISM = 'Ministry of Tourism';
const HAJJ = 'Ministry of Hajj and Umrah';
const MOH = 'Ministry of Health';
const SFDA = 'Saudi Food and Drug Authority (SFDA)';
const MEWA = 'Ministry of Environment, Water and Agriculture';
const MOE = 'Ministry of Education';
const CST = 'Communications, Space and Technology Commission (CST)';

export const LICENSE_AUTHORITY_MAP: Record<string, string[]> = {
  Industrial: [MIM, 'Saudi Authority for Industrial Cities and Technology Zones (MODON)', 'Royal Commission for Jubail and Yanbu', NCEC],
  Mining: [MIM, NCEC],
  Energy: ['Saudi Electricity Regulatory Authority', 'Ministry of Energy'],
  Logistics: [GACA, TGA, MAWANI, MWAN],
  Municipal: [AMANAH, MWAN],
  Construction: [AMANAH, 'Saudi Council of Engineers', 'Saudi Contractors Authority'],
  Transport: [GACA, TGA, MAWANI],
  Tourism: [TOURISM, HAJJ],
  Hospitality: [TOURISM, AMANAH],
  Healthcare: [MOH],
  'Life Sciences': [SFDA, MOH],
  Food: [SFDA, AMANAH, MEWA],
  Agriculture: [MEWA],
  'Financial Services': ['Capital Market Authority (CMA)', 'Saudi Central Bank (SAMA)', 'Ministry of Investment'],
  'Real Estate': ['Real Estate General Authority (REGA)'],
  Telecommunications: [CST],
  Technology: [CST, 'Saudi Authority for Intellectual Property (SAIP)'],
  Education: [MOE],
  Training: ['Technical and Vocational Training Corporation (TVTC)', MOE],
  Media: ['General Authority of Media Regulation (GAMR)'],
  Entertainment: ['General Entertainment Authority (GEA)'],
  Culture: ['Ministry of Culture'],
  Sports: ['Ministry of Sport'],
  'Security & Safety': ['Saudi Civil Defense', 'Ministry of Interior'],
  'Military Industries': ['General Authority for Military Industries (GAMI)'],
  'Hajj & Umrah': [HAJJ],
  Other: ['Zakat, Tax and Customs Authority (ZATCA)', 'Ministry of Municipalities and Housing', 'Other'],
};

export const LICENSE_CATEGORIES = Object.keys(LICENSE_AUTHORITY_MAP);

/** Every authority, de-duplicated (used to display legacy values). */
export const ISSUING_AUTHORITIES = [...new Set(Object.values(LICENSE_AUTHORITY_MAP).flat())];

export const authoritiesFor = (category?: string) => (category ? (LICENSE_AUTHORITY_MAP[category] ?? []) : []);

// UC008: documents an admin can request from the borrower.
export const COMPLIANCE_DOCUMENTS = [
  'Activity License',
  'Article of association',
  'VAT and Zakat',
  'Register of Shareholder',
  'National Address',
  'CR Number',
  'Netaqat Certificate',
  'Company Profile',
  'Chamber of Commerce',
  'MISA License',
];

// UC005: system permissions a borrower user can request (tree from the reference screens).
export interface PermissionNode {
  id: string;
  label: string;
  children?: PermissionNode[];
}
export interface PermissionGroup {
  id: string;
  label: string;
  items: PermissionNode[];
}
export const SYSTEM_PERMISSIONS: PermissionGroup[] = [
  {
    id: 'wallet',
    label: 'Wallet & Payment',
    items: [{ id: 'view_wallet', label: 'View Wallet', children: [
      { id: 'request_withdrawal', label: 'Request Withdrawal' },
      { id: 'request_early_payment', label: 'Request Early Payment' },
      { id: 'manage_wallet', label: 'Manage Wallet' },
    ] }],
  },
  { id: 'fund', label: 'Fund Request', items: [{ id: 'request_financing', label: 'Request Financing' }, { id: 'accept_consents', label: 'Accept Consents' }] },
  {
    id: 'users',
    label: 'User Management',
    items: [{ id: 'view_users', label: 'View Users', children: [
      { id: 'add_user', label: 'Add User' },
      { id: 'manage_delegation', label: 'Manage Delegation' },
      { id: 'deactivate_users', label: 'Deactivate Users' },
      { id: 'reactivate_users', label: 'Reactivate Users' },
    ] }],
  },
  { id: 'company', label: 'Company Management', items: [{ id: 'manage_company_profile', label: 'Manage Company Profile' }] },
  {
    id: 'financing',
    label: 'Financing Flow',
    items: [
      { id: 'accept_murabaha', label: 'Accept Murabaha' },
      { id: 'accept_financial_offer', label: 'Accept Financial Offer' },
      { id: 'accept_loan', label: 'Accept Loan' },
      { id: 'manage_scf_discount', label: 'Manage SCF Discount Offer' },
    ],
  },
];
const flatten = (n: PermissionNode): PermissionNode[] => [n, ...(n.children ?? []).flatMap(flatten)];
export const ALL_SYSTEM_PERMISSIONS = SYSTEM_PERMISSIONS.flatMap((g) => g.items.flatMap(flatten));
export const permissionLabel = (id: string) => ALL_SYSTEM_PERMISSIONS.find((p) => p.id === id)?.label ?? id;
export const permissionGroupOf = (id: string) => SYSTEM_PERMISSIONS.find((g) => g.items.flatMap(flatten).some((p) => p.id === id));
/** Parent permission (e.g. View Wallet) that a child permission depends on. */
export const permissionParent = (id: string) => SYSTEM_PERMISSIONS.flatMap((g) => g.items).find((p) => p.children?.some((c) => c.id === id));

// UC006: primary (legal document) permissions that can be delegated.
export const PRIMARY_PERMISSIONS = [
  { id: 'facility_contract', label: 'Facility Contract' },
  { id: 'promissory_note', label: 'Company Promissory Note' },
  { id: 'assignment_of_proceeds', label: 'Assignment of Proceeds' },
  { id: 'non_objection_letter', label: 'Non-Objection Letter' },
  { id: 'capex_payment_agency', label: 'CapEx Payment Agency' },
  { id: 'capex_pledge_agreement', label: 'CapEx Pledge Agreement' },
  { id: 'corporate_guarantee', label: 'Corporate Guarantee Agreement' },
];

// Case types. Grouping follows the reference Case Type filter; the request types are grouped by us (assumption A6).
export const CASE_TYPE_META: Record<import('@/domain/types').CaseType, { label: string; category: string }> = {
  edd: { label: 'Due Diligence', category: 'Compliance' },
  coc: { label: 'Change of Circumstance', category: 'Entity Lifecycle' },
  zatca_expiry: { label: 'ZATCA Certificate Expiry', category: 'Entity Lifecycle' },
  license_expiry: { label: 'Activity License Expiry', category: 'Entity Lifecycle' },
  authorization: { label: 'Authorization Request', category: 'Authority Management' },
  delegation: { label: 'Delegation Request', category: 'Authority Management' },
  iban: { label: 'IBAN Review', category: 'Banking' },
};

export const DOCUMENT_TYPES = [
  'Articles of Association',
  'Commercial Registration',
  'Activity License',
  'Financial Statements',
  'Bank Statement',
  'National Address Certificate',
  'Zakat Certificate',
  'Other',
];

export const STANDARD_SIGNING_DOCUMENTS = [
  { id: 'promissory_note', label: 'Company Promissory Note' },
  { id: 'facility_contract', label: 'Facility Contract' },
  { id: 'assignment_of_proceeds', label: 'Assignment of Proceeds' },
  { id: 'non_objection_letter', label: 'Non-objection Letter' },
];

export const CAPEX_SIGNING_DOCUMENTS = [
  { id: 'capex_payment_agency', label: 'CapEx Payment Agency' },
  { id: 'capex_pledge_agreement', label: 'CapEx Pledge Agreement' },
];

export const SCF_SIGNING_DOCUMENTS = [
  { id: 'scf_offer_initiator', label: 'Financial Offer Initiator' },
  { id: 'scf_offer_signatories', label: 'Financial Offer Signatories' },
  { id: 'scf_murabaha', label: 'SCF Murabaha Signatories' },
];

export const ACTIVITY_NAMES = [
  'صنع المنتجات المعدنية الإنشائية',
  'الإنشاءات العامة للمباني السكنية',
  'الإنشاءات العامة للمباني غير السكنية مثل المدارس والمستشفيات والفنادق',
  'إنشاء وإصلاح وصيانة الطرق والشوارع والأرصفة والجسور',
  'التمديدات الكهربائية',
  'تمديدات السباكة والصرف الصحي وأعمال التدفئة والتكييف',
  'أعمال التشطيبات للمباني',
  'البيع بالجملة للأسمنت والجبس ومواد البناء المماثلة',
  'البيع بالجملة للحديد والصلب ومنتجاتهما',
  'النقل البري للبضائع والمعدات الثقيلة',
  'التخزين في المستودعات العامة بما فيها المستودعات المبردة',
  'شراء وبيع وتقسيم العقارات',
  'إدارة وتأجير العقارات المملوكة أو المؤجرة',
  'أنشطة الاستشارات الهندسية المعمارية',
  'أنشطة الاستشارات الهندسية المدنية',
  'تأجير آلات ومعدات البناء والهندسة المدنية بدون مشغل',
];
