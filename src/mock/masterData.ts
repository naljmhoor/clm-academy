// Configurable master data (synthetic). In production these come from CLM configuration.

export const CITIES: { name: string; districts: string[] }[] = [
  { name: 'الرياض', districts: ['الملز', 'العليا', 'النخيل', 'الياسمين', 'السليمانية', 'الملقا'] },
  { name: 'جدة', districts: ['الروضة', 'الشاطئ', 'الحمراء', 'السلامة', 'البوادي'] },
  { name: 'الدمام', districts: ['الفيصلية', 'الشاطئ الغربي', 'المزروعية', 'الريان'] },
  { name: 'مكة المكرمة', districts: ['العزيزية', 'الشوقية', 'النسيم'] },
  { name: 'المدينة المنورة', districts: ['قباء', 'العزيزية', 'الخالدية'] },
];

export const STREETS = ['طريق الملك فهد', 'شارع التحلية', 'طريق الأمير سلطان', 'شارع الأمير محمد بن عبدالعزيز', 'طريق الملك عبدالله', 'شارع العروبة'];

export const LICENSE_CATEGORIES = ['Commercial activity', 'Industrial', 'Logistics', 'Mining', 'Energy', 'Contracting', 'Professional services'];

export const ISSUING_AUTHORITIES = [
  'Riyadh Municipality',
  'Ministry of Industry and Mineral Resources',
  'Ministry of Commerce',
  'Ministry of Municipal and Rural Affairs',
  'Transport General Authority',
  'Ministry of Energy',
];

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
