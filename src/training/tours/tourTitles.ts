// Kept separate from tours.ts so the assistant can name tours without importing the tour engine.
export const TOUR_TITLES: Record<string, string> = {
  intro: 'Introduction to CLM',
  'first-edd': 'Process your first EDD case',
  'missing-info': 'Handle missing information',
  signing: 'Ownership & signing authority',
  license: 'Activity license',
  'close-edd': 'Complete and close an EDD case',
};
