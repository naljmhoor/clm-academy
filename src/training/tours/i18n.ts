// Localization for the guided walkthroughs only. The CLM simulator itself stays in English.
// Arabic copy keeps CLM control labels (Status, In Progress, Required Before Closing…) in English
// so trainees can match the instruction to the screen.

import { EN } from './content/en';
import { AR } from './content/ar';

export type TourLang = 'en' | 'ar';

export interface StepText {
  title: string;
  body: string;
  /** Instruction for action steps. */
  action?: string;
  /** Feedback when the trainee's action defeats the step. */
  wrong?: string;
}

export type TourContent = Record<string, { title: string; summary: string; steps: Record<string, StepText> }>;

const CONTENT: Record<TourLang, TourContent> = { en: EN, ar: AR };

const warned = new Set<string>();
function missing(key: string) {
  if (import.meta.env?.DEV && !warned.has(key)) {
    warned.add(key);
    console.warn(`[CLM Academy] Missing Arabic walkthrough text: ${key} — showing English.`);
  }
}

export function tourText(lang: TourLang, tourId: string): { title: string; summary: string } {
  const en = EN[tourId];
  const loc = CONTENT[lang][tourId];
  if (lang !== 'en' && !loc) missing(tourId);
  return { title: loc?.title || en?.title || tourId, summary: loc?.summary || en?.summary || '' };
}

export function stepText(lang: TourLang, tourId: string, stepId: string): StepText {
  const en = EN[tourId]?.steps[stepId] ?? { title: stepId, body: '' };
  if (lang === 'en') return en;
  const loc = AR[tourId]?.steps[stepId];
  const out: StepText = { ...en };
  for (const k of Object.keys(en) as (keyof StepText)[]) {
    if (loc?.[k]) out[k] = loc[k];
    else missing(`${tourId}.${stepId}.${k}`);
  }
  return out;
}

const UI = {
  en: {
    stepOf: (i: number, n: number) => `${i} / ${n}`,
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
    skip: 'Skip step',
    skipConfirm: 'Skip without doing it?',
    skipYes: 'Yes, skip',
    restart: 'Restart tour',
    exit: 'Exit tour (back to Explore)',
    yourTurn: 'Your turn:',
    doneMoving: 'Done — moving on…',
    completeToContinue: 'Complete the action to continue',
    offRoute: 'This step happens on another screen.',
    takeMeThere: 'Take me there',
    missingTarget: 'The highlighted element isn’t on screen yet.',
    missingTargetAction: 'It may appear after the previous action.',
    missingTargetHelp: 'Use “Take me there” or skip this step.',
    expand: 'Show the full step',
    collapse: 'Minimise',
    tourComplete: 'Tour complete',
    completeBody: (t: string) => `You finished “${t}”. Your progress is saved in this browser.`,
    backToAcademy: 'Back to Academy',
    keepExploring: 'Keep exploring',
    nextTour: (t: string) => `Next: ${t}`,
    language: 'Walkthrough language',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    minutes: (m: number) => `${m} min`,
    steps: (n: number) => `${n} steps`,
  },
  ar: {
    stepOf: (i: number, n: number) => `${i} من ${n}`,
    back: 'السابق',
    next: 'التالي',
    finish: 'إنهاء',
    skip: 'تخطي الخطوة',
    skipConfirm: 'تتخطى بدون تنفيذ الخطوة؟',
    skipYes: 'نعم، تخطَّ',
    restart: 'إعادة الجولة من البداية',
    exit: 'الخروج من الجولة (العودة للاستكشاف)',
    yourTurn: 'دورك الآن:',
    doneMoving: 'تم — ننتقل للخطوة التالية…',
    completeToContinue: 'نفّذ المطلوب للمتابعة',
    offRoute: 'هذه الخطوة في شاشة أخرى.',
    takeMeThere: 'انقلني إليها',
    missingTarget: 'العنصر المطلوب غير ظاهر على الشاشة حالياً.',
    missingTargetAction: 'قد يظهر بعد تنفيذ الخطوة السابقة.',
    missingTargetHelp: 'استخدم «انقلني إليها» أو تخطَّ الخطوة.',
    expand: 'عرض الخطوة كاملة',
    collapse: 'تصغير',
    tourComplete: 'اكتملت الجولة',
    completeBody: (t: string) => `أنهيت جولة «${t}». تقدّمك محفوظ في هذا المتصفح.`,
    backToAcademy: 'العودة للأكاديمية',
    keepExploring: 'متابعة الاستكشاف',
    nextTour: (t: string) => `التالي: ${t}`,
    language: 'لغة الجولة',
    beginner: 'مبتدئ',
    intermediate: 'متوسط',
    minutes: (m: number) => `${m} دقائق`,
    steps: (n: number) => `${n} خطوات`,
  },
} as const;

export type UiStrings = (typeof UI)['en'];
export const tourUi = (lang: TourLang): UiStrings => UI[lang] as unknown as UiStrings;

export { CONTENT as TOUR_CONTENT };
