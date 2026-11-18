// Kept separate from tours.ts so the assistant can name tours without importing the tour engine.
export const TOUR_TITLES: Record<string, string> = {
  intro: 'Introduction to CLM',
  'first-edd': 'Process your first EDD case',
  'missing-info': 'Handle missing information',
  signing: 'Ownership & signing authority',
  license: 'Activity license',
  'close-edd': 'Complete and close an EDD case',
  coc: 'Change of Circumstance',
  'zatca-expiry': 'ZATCA Certificate Expiry',
  'license-expiry': 'Activity License Expiry',
  authorization: 'Authorization Request',
  delegation: 'Delegation Request',
  iban: 'IBAN Review',
  'compliance-docs': 'Request compliance documents',
  'reactivate-on-hold': 'Reactivate an On Hold EDD case',
};
