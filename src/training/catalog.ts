// Scenario catalog: every walkthrough and practice scenario, grouped by case type.
// Any item can be started directly — there are no prerequisites. The recommended path is only a suggestion.

import { SCENARIOS, type PracticeScenario } from './practice/scenarios';
import type { TourLang } from './tours/i18n';

export interface CatalogGroup {
  id: string;
  label: string;
  labelAr: string;
  tours: string[];
  scenarios: string[];
}

export const CATALOG: CatalogGroup[] = [
  { id: 'start', label: 'Getting started', labelAr: 'البداية', tours: ['intro'], scenarios: ['closed-review'] },
  {
    id: 'edd',
    label: 'Due Diligence (EDD)',
    labelAr: 'العناية الواجبة (EDD)',
    tours: ['first-edd', 'missing-info', 'signing', 'license', 'close-edd'],
    scenarios: SCENARIOS.filter((s) => /^CS-19\d\d$/.test(s.caseId) && s.id !== 'closed-review').map((s) => s.id),
  },
  { id: 'coc', label: 'Change of Circumstance', labelAr: 'تغيّر الظروف', tours: ['coc'], scenarios: ['coc-signatory-left'] },
  { id: 'zatca', label: 'ZATCA Certificate Expiry', labelAr: 'انتهاء شهادة ZATCA', tours: ['zatca-expiry'], scenarios: ['zatca-service-down'] },
  { id: 'license', label: 'Activity License Expiry', labelAr: 'انتهاء رخصة النشاط', tours: ['license-expiry'], scenarios: ['license-wrong-document'] },
  { id: 'authorization', label: 'Authorization Request', labelAr: 'طلب الصلاحيات', tours: ['authorization'], scenarios: ['authorization-adjust'] },
  { id: 'delegation', label: 'Delegation Request', labelAr: 'طلب التفويض', tours: ['delegation'], scenarios: ['delegation-verify'] },
  { id: 'iban', label: 'IBAN Review', labelAr: 'مراجعة الآيبان', tours: ['iban'], scenarios: ['iban-mismatch'] },
  { id: 'other', label: 'Compliance documents & On Hold', labelAr: 'مستندات الامتثال والحالات المعلّقة', tours: ['compliance-docs', 'reactivate-on-hold'], scenarios: ['compliance-request', 'on-hold-reactivate'] },
];

/** Arabic title and objective for each practice scenario (tasks inside the panel stay in English). */
const SCENARIO_AR: Record<string, { title: string; objective: string }> = {
  'review-open': { title: 'مراجعة كيس EDD مفتوح', objective: 'استلم الكيس، وابدأ المراجعة، واعرف المتطلبات الباقية قبل الاعتماد.' },
  'spl-failed': { title: 'معالجة فشل استرجاع العنوان الوطني', objective: 'أعد محاولة SPL مرة، ثم أكمل العنوان بنفسك حتى لا يمنع الاعتماد.' },
  'signing-missing': { title: 'إكمال صلاحيات التوقيع الناقصة', objective: 'اضبط صلاحيات التوقيع يدوياً حسب تعليمات الإدارة القانونية واحفظها.' },
  'license-missing': { title: 'إكمال بيانات رخصة النشاط', objective: 'صنّف الترخيصين الموجودين، وأضف الترخيص الصناعي مع مستنده، وأزل متطلب Activity License.' },
  'aml-pending': { title: 'قرار فحص AML المعلّق', objective: 'سجّل قرار AML الصحيح ليستمر الكيس — بدون إنهاء العناية الواجبة.' },
  'need-info': { title: 'طلب معلومات إضافية', objective: 'انقل الكيس إلى Need Info بالطريقة الصحيحة وسجّل بالضبط ما يجب أن يقدمه العميل.' },
  approve: { title: 'إكمال اعتماد كيس EDD', objective: 'أكمل كل المتطلبات وأغلق الكيس بـ Approved.' },
  'closed-review': { title: 'مراجعة كيس مغلق وقراره', objective: 'اقرأ القرار وسجل النشاط ثم أجب عن السؤال.' },
  'coc-signatory-left': { title: 'تغيّر الظروف: خروج أحد الموقّعين', objective: 'حدّث صلاحيات التوقيع حتى لا يذكر أي مستند الموقّع الخارج، ثم أغلق الكيس بـ Approved.' },
  'zatca-service-down': { title: 'فشل استرجاع ZATCA ثم نجاحه', objective: 'أعد المحاولة حتى تُحفظ شهادة مجددة، ثم أغلق الكيس.' },
  'license-wrong-document': { title: 'رفض رخصة مجددة', objective: 'ارفض الرخصة المجددة مع سبب يُرسل للمقترض، ثم أغلق الكيس.' },
  'authorization-adjust': { title: 'اعتماد صلاحيات بعدد أقل', objective: 'اعتمد الطلب بدون Manage Delegation، ثم أغلق الكيس.' },
  'delegation-verify': { title: 'اعتماد تفويض بمفوَّض موثّق', objective: 'وثّق المفوَّض الأول، واختره، واعتمد الطلب، ثم أغلق الكيس.' },
  'iban-mismatch': { title: 'قرار مراجعة آيبان', objective: 'اتخذ القرار الصحيح مع ذكر السبب ثم أغلق الكيس.' },
  'on-hold-reactivate': { title: 'إعادة تفعيل كيس معلّق', objective: 'استلم الكيس وأعده إلى العمل.' },
  'compliance-request': { title: 'طلب مستندات امتثال ناقصة', objective: 'اطلب المستندين في طلب واحد وتأكد أن المقترض يقدر يرفعها.' },
};

export function scenarioText(lang: TourLang, s: PracticeScenario) {
  const ar = lang === 'ar' ? SCENARIO_AR[s.id] : undefined;
  return { title: ar?.title ?? s.title, objective: ar?.objective ?? s.objective };
}

export const SCENARIO_AR_IDS = Object.keys(SCENARIO_AR);
