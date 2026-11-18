// ASQ-5970: searchable, dependent Activity License dropdowns + UC003 mandatory validity dates.

import clsx from 'clsx';
import { CalendarDays } from 'lucide-react';
import { authoritiesFor, LICENSE_CATEGORIES } from '@/mock/masterData';
import { Select } from '@/clm/components/ui/Select';
import { FormField } from '@/clm/components/ui/misc';

export interface LicenseDraft {
  category?: string;
  authority?: string;
  issueDate?: string;
  expiryDate?: string;
}

export function validateLicenseDraft(d: LicenseDraft) {
  return {
    category: !d.category ? 'Select a license category.' : undefined,
    authority: !d.authority ? 'Select an issuing authority.' : d.category && !authoritiesFor(d.category).includes(d.authority) ? 'This authority does not issue licenses in the selected category.' : undefined,
    issueDate: !d.issueDate ? 'Issue date is required.' : undefined,
    expiryDate: !d.expiryDate ? 'Expiry date is required.' : d.issueDate && d.expiryDate < d.issueDate ? 'Expiry date can’t be before the issue date.' : undefined,
  };
}

export function DateField({ value, onChange, disabled, id, invalid }: { value?: string; onChange: (v: string | undefined) => void; disabled: boolean; id: string; invalid?: boolean }) {
  return (
    <label htmlFor={id} className={clsx('flex h-9 items-center gap-2 rounded-md border px-3 text-sm', invalid ? 'border-red-500' : 'border-line', disabled && 'bg-surface-sunken')}>
      <CalendarDays className="h-4 w-4 text-ink-muted" />
      <input id={id} type="date" disabled={disabled} value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)} className={clsx('w-full bg-transparent outline-none', !value && 'text-ink-faint')} />
    </label>
  );
}

/** Category → Issuing authority (filtered by category) → Issue date → Expiry date. */
export function LicenseFields({ draft, onChange, disabled, show, idPrefix }: { draft: LicenseDraft; onChange: (patch: LicenseDraft) => void; disabled: boolean; show: (k: keyof ReturnType<typeof validateLicenseDraft>) => string | undefined; idPrefix: string }) {
  const authorities = authoritiesFor(draft.category);
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField label="License category" required error={show('category')}>
        <div data-tour="license-category">
          <Select
            value={draft.category}
            disabled={disabled}
            invalid={!!show('category')}
            searchable
            onChange={(v) => {
              const list = authoritiesFor(v);
              // Keep the authority only if it is valid for the new category; auto-fill a single option.
              const authority = draft.authority && list.includes(draft.authority) ? draft.authority : list.length === 1 ? list[0] : undefined;
              onChange({ category: v, authority });
            }}
            options={LICENSE_CATEGORIES.map((x) => ({ value: x, label: x }))}
            placeholder="Search or select category"
          />
        </div>
      </FormField>
      <FormField label="Issuing authority" required error={show('authority')}>
        <div data-tour="license-authority" title={draft.category ? undefined : 'Select a license category first'}>
          <Select
            value={draft.authority}
            disabled={disabled || !draft.category}
            invalid={!!show('authority')}
            searchable
            onChange={(v) => onChange({ authority: v })}
            options={authorities.map((x) => ({ value: x, label: x }))}
            placeholder={draft.category ? 'Search or select authority' : 'Select a category first'}
          />
        </div>
      </FormField>
      <FormField label="Issue date" required error={show('issueDate')}>
        <div data-tour="license-issue-date">
          <DateField id={`${idPrefix}-issue`} value={draft.issueDate} disabled={disabled} invalid={!!show('issueDate')} onChange={(v) => onChange({ issueDate: v })} />
        </div>
      </FormField>
      <FormField label="Expiry date" required error={show('expiryDate')}>
        <div data-tour="license-expiry-date">
          <DateField id={`${idPrefix}-expiry`} value={draft.expiryDate} disabled={disabled} invalid={!!show('expiryDate')} onChange={(v) => onChange({ expiryDate: v })} />
        </div>
      </FormField>
    </div>
  );
}
