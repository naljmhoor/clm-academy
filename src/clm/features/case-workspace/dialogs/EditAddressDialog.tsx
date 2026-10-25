import { useState } from 'react';
import type { Address, AddressSource } from '@/domain/types';
import { SHORT_ADDRESS_PATTERN } from '@/domain/eddRules';
import { useClm } from '@/store/caseStore';
import { CITIES } from '@/mock/masterData';
import { Dialog } from '@/clm/components/ui/Dialog';
import { Button } from '@/clm/components/ui/Button';
import { Select } from '@/clm/components/ui/Select';
import { FormField, SegmentedTabs } from '@/clm/components/ui/misc';
import { Field } from '@/clm/components/ui/Card';
import { useWs } from '../context';

const FIELDS: { key: keyof Address; label: string }[] = [
  { key: 'district', label: 'District' },
  { key: 'city', label: 'City' },
  { key: 'street', label: 'Street name' },
  { key: 'buildingNumber', label: 'Building number' },
  { key: 'additionalNumber', label: 'Additional number' },
  { key: 'postalCode', label: 'Postal code' },
  { key: 'shortAddress', label: 'Short address' },
];

const SHORT_ADDRESS_MSG = 'Enter a valid Short Address in the format AAAA9999 (e.g., RAGI2929).';
const EMPTY: Address = { city: '', district: '', street: '', shortAddress: '', postalCode: '', additionalNumber: '', buildingNumber: '' };

type Step = { kind: 'edit' } | { kind: 'review'; next: Address; source: AddressSource; from: 'edit' | 'spl' };

export function EditAddressDialog({ open, onClose, proposed }: { open: boolean; onClose: () => void; proposed?: Address }) {
  if (!open) return null;
  return <Inner onClose={onClose} proposed={proposed} />;
}

function Inner({ onClose, proposed }: { onClose: () => void; proposed?: Address }) {
  const { c } = useWs();
  const { fetchShortAddress, confirmAddress } = useClm();
  const current = c.edd.address.data;
  const [step, setStep] = useState<Step>(proposed ? { kind: 'review', next: proposed, source: 'spl', from: 'spl' } : { kind: 'edit' });
  const [mode, setMode] = useState<'short' | 'manual'>('short');

  // Short address tab
  const [short, setShort] = useState('');
  const [shortErr, setShortErr] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [retrieved, setRetrieved] = useState<Address>();
  const [attempted, setAttempted] = useState(false);

  // Manual tab
  const [form, setForm] = useState<Address>({ ...EMPTY, ...current });
  const [touched, setTouched] = useState(false);
  const district = CITIES.find((x) => x.name === form.city)?.districts ?? [];
  const errors = {
    city: !form.city ? 'City is required.' : undefined,
    district: !form.district ? 'District is required.' : undefined,
    street: !form.street?.trim() ? 'Street name is required.' : undefined,
    postalCode: !form.postalCode?.trim() ? 'Postal code is required.' : !/^\d{5}$/.test(form.postalCode) ? 'Postal code must be 5 digits.' : undefined,
    shortAddress: form.shortAddress && !SHORT_ADDRESS_PATTERN.test(form.shortAddress) ? SHORT_ADDRESS_MSG : undefined,
    buildingNumber: form.buildingNumber && !/^\d{4}$/.test(form.buildingNumber) ? 'Building number must be 4 digits.' : undefined,
    additionalNumber: form.additionalNumber && !/^\d{4}$/.test(form.additionalNumber) ? 'Additional number must be 4 digits.' : undefined,
  };
  const formValid = Object.values(errors).every((e) => !e);
  const set = (k: keyof Address, v: string) => setForm((f) => ({ ...f, [k]: v, ...(k === 'city' ? { district: '' } : {}) }));

  const retrieve = async () => {
    if (!SHORT_ADDRESS_PATTERN.test(short)) return setShortErr(SHORT_ADDRESS_MSG);
    setShortErr(undefined);
    setAttempted(true);
    setLoading(true);
    const res = await fetchShortAddress(c.id, short);
    setLoading(false);
    if (res.ok) setRetrieved(res.data);
    else {
      setRetrieved(undefined);
      setShortErr(res.error);
    }
  };

  if (step.kind === 'review') {
    return (
      <Dialog
        open
        onClose={onClose}
        width="xl"
        tour="address-review-dialog"
        title="Confirm Changes"
        description={step.from === 'spl' ? 'SPL returned a National Address. Review it before it replaces the current address.' : 'Please review the changes before confirming'}
        footer={
          <>
            <Button onClick={() => (step.from === 'spl' ? onClose() : setStep({ kind: 'edit' }))}>{step.from === 'spl' ? 'Cancel' : 'Edit'}</Button>
            <Button
              variant="primary"
              onClick={() => {
                confirmAddress(c.id, step.next, step.source);
                onClose();
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-sunken text-left text-xs">
              <tr>
                <th className="h-9 px-3 font-medium">Field</th>
                <th className="h-9 px-3 font-medium">Previous value</th>
                <th className="h-9 px-3 font-medium">New value</th>
              </tr>
            </thead>
            <tbody>
              {FIELDS.map((f) => {
                const prev = current?.[f.key] || '-';
                const next = step.next[f.key] || '-';
                return (
                  <tr key={f.key} className="border-t border-line">
                    <td className="h-11 px-3">{f.label}</td>
                    <td className="bidi px-3 text-ink-muted">{prev}</td>
                    <td className={`bidi px-3 ${prev !== next ? 'font-medium' : ''}`}>{next}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      onClose={onClose}
      width="lg"
      tour="address-dialog"
      title="Edit National Address"
      description="Changes are saved in our system only"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          {mode === 'short' ? (
            <Button variant="primary" disabled={!retrieved} onClick={() => retrieved && setStep({ kind: 'review', next: retrieved, source: 'short_address', from: 'edit' })}>
              Review Changes
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => {
                setTouched(true);
                if (formValid) setStep({ kind: 'review', next: { ...form, shortAddress: form.shortAddress?.toUpperCase() }, source: 'manual', from: 'edit' });
              }}
            >
              Review Changes
            </Button>
          )}
        </>
      }
    >
      <SegmentedTabs
        className="w-full"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'short', label: 'Short Address' },
          { value: 'manual', label: 'Manual entry', tour: 'address-mode-manual' },
        ]}
      />
      {mode === 'short' ? (
        <div className="mt-4">
          <FormField label="Short address" required error={shortErr} htmlFor="short-address">
            <div className="flex gap-2">
              <input
                id="short-address"
                value={short}
                onChange={(e) => {
                  setShort(e.target.value.toUpperCase());
                  setShortErr(undefined);
                }}
                onKeyDown={(e) => e.key === 'Enter' && retrieve()}
                maxLength={8}
                placeholder="Enter short address"
                className={`input ${shortErr ? 'input-error' : ''}`}
              />
              <Button variant={retrieved ? 'secondary' : 'primary'} loading={loading} onClick={retrieve}>
                {attempted ? 'Retry' : 'Retrieve'}
              </Button>
            </div>
          </FormField>
          {shortErr && !SHORT_ADDRESS_PATTERN.test(short) ? null : shortErr ? (
            <p className="mt-2 text-xs text-ink-muted">
              Correct the short address and retry, or switch to{' '}
              <button type="button" className="link" onClick={() => setMode('manual')}>
                Manual entry
              </button>
              .
            </p>
          ) : null}
          {retrieved && (
            <div className="mt-4 rounded-lg border border-line p-4">
              <div className="mb-3 text-sm font-medium">Retrieved address</div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="City">{retrieved.city}</Field>
                <Field label="District">{retrieved.district}</Field>
                <Field label="Street name">{retrieved.street}</Field>
                <Field label="Postal code">{retrieved.postalCode}</Field>
                <Field label="Building number">{retrieved.buildingNumber}</Field>
                <Field label="Additional number">{retrieved.additionalNumber}</Field>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4" data-tour="address-manual-form">
          <FormField label="City" required error={touched ? errors.city : undefined}>
            <Select value={form.city} onChange={(v) => set('city', v)} invalid={touched && !!errors.city} placeholder="Select city" searchable options={CITIES.map((x) => ({ value: x.name, label: x.name }))} />
          </FormField>
          <FormField label="District" required error={touched ? errors.district : undefined}>
            <Select value={form.district} onChange={(v) => set('district', v)} invalid={touched && !!errors.district} disabled={!form.city} placeholder={form.city ? 'Select district' : 'Select a city first'} searchable options={district.map((x) => ({ value: x, label: x }))} />
          </FormField>
          <FormField label="Street name" required error={touched ? errors.street : undefined} htmlFor="addr-street">
            <input id="addr-street" dir="auto" value={form.street} onChange={(e) => set('street', e.target.value)} className={`input ${touched && errors.street ? 'input-error' : ''}`} />
          </FormField>
          <FormField label="Short address" error={touched ? errors.shortAddress : undefined} htmlFor="addr-short">
            <input id="addr-short" value={form.shortAddress ?? ''} maxLength={8} onChange={(e) => set('shortAddress', e.target.value.toUpperCase())} placeholder="AAAA9999 (optional)" className={`input ${touched && errors.shortAddress ? 'input-error' : ''}`} />
          </FormField>
          <FormField label="Building number" error={touched ? errors.buildingNumber : undefined} htmlFor="addr-building">
            <input id="addr-building" inputMode="numeric" maxLength={4} value={form.buildingNumber ?? ''} onChange={(e) => set('buildingNumber', e.target.value)} className={`input ${touched && errors.buildingNumber ? 'input-error' : ''}`} />
          </FormField>
          <FormField label="Additional number" error={touched ? errors.additionalNumber : undefined} htmlFor="addr-additional">
            <input id="addr-additional" inputMode="numeric" maxLength={4} value={form.additionalNumber ?? ''} onChange={(e) => set('additionalNumber', e.target.value)} className={`input ${touched && errors.additionalNumber ? 'input-error' : ''}`} />
          </FormField>
          <FormField label="Postal code" required error={touched ? errors.postalCode : undefined} htmlFor="addr-postal">
            <input id="addr-postal" inputMode="numeric" maxLength={5} value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} className={`input ${touched && errors.postalCode ? 'input-error' : ''}`} />
          </FormField>
        </div>
      )}
    </Dialog>
  );
}
