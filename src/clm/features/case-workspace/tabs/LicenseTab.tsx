import { useState } from 'react';
import clsx from 'clsx';
import { ChevronDown, ChevronUp, FileText, Plus, Trash2 } from 'lucide-react';
import type { FileRef, License } from '@/domain/types';
import { useClm, makeFileRef } from '@/store/caseStore';
import { fileExt, fmtDateTime, fmtSize } from '@/clm/format';
import { Button } from '@/clm/components/ui/Button';
import { Dialog } from '@/clm/components/ui/Dialog';
import { EmptyState, FileInput, FormField } from '@/clm/components/ui/misc';
import { HelpTip } from '@/training/help/HelpTip';
import { useWs } from '../context';
import { FileActions } from '../dialogs/documents';
import { LicenseFields, validateLicenseDraft } from '../sections/LicenseFields';

type Draft = Pick<License, 'category' | 'authority' | 'issueDate' | 'expiryDate' | 'file'>;

function validate(d: Draft, needsFile: boolean) {
  return { ...validateLicenseDraft(d), file: needsFile && !d.file ? 'A license document is required.' : undefined };
}

/** One license card. Edits are kept as a draft until Save; Cancel restores the saved values. */
function LicenseCard({ l, isNew, onDiscardNew, onSaveNew, title }: { l?: License; isNew?: boolean; onDiscardNew?: () => void; onSaveNew?: (d: Draft) => void; title: string }) {
  const { c, readOnly } = useWs();
  const { updateLicense, removeLicense } = useClm();
  const saved: Draft = { category: l?.category, authority: l?.authority, issueDate: l?.issueDate, expiryDate: l?.expiryDate, file: l?.file };
  const [draft, setDraft] = useState<Draft>(saved);
  const [open, setOpen] = useState(true);
  const [touched, setTouched] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const origin = l?.origin ?? 'admin';
  const needsFile = origin === 'admin';
  const errs = validate(draft, needsFile);
  // Saved licenses show their gaps immediately; a new card only after a save attempt.
  const show = (k: keyof typeof errs) => (touched || !isNew ? errs[k] : undefined);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const savedIncomplete = !isNew && Object.values(validate(saved, needsFile)).some(Boolean);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    setTouched(true);
    if (Object.values(errs).some(Boolean)) return;
    if (isNew) return onSaveNew?.(draft);
    const changes = (['category', 'authority', 'issueDate', 'expiryDate'] as const).filter((k) => draft[k] !== saved[k]);
    const label = [...changes.map((k) => ({ category: 'category', authority: 'issuing authority', issueDate: 'issue date', expiryDate: 'expiry date' })[k]), draft.file !== saved.file ? 'document' : ''].filter(Boolean).join(', ');
    updateLicense(c.id, l!.id, draft, `${label} updated`);
    setTouched(false);
  };

  return (
    <div id={l ? `license-${l.number}` : undefined} data-tour={isNew ? 'license-new' : `license-${l?.number}`} className={clsx('scroll-mt-24 rounded-xl border', savedIncomplete ? 'border-red-200' : 'border-line')}>
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="flex-1 text-sm font-medium">
          {title}
          {origin === 'borrower' && <span className="ml-2 text-xs font-normal text-ink-muted">Uploaded by the borrower</span>}
          {isNew && <span className="ml-2 text-xs font-normal text-ink-muted">Not saved yet</span>}
        </span>
        {savedIncomplete && <span className="text-xs text-red-600">Incomplete</span>}
        {!readOnly && !isNew && (
          <button type="button" onClick={() => setConfirmRemove(true)} aria-label={`Remove ${title}`} className="rounded p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        <button type="button" onClick={() => setOpen(!open)} aria-label={open ? 'Collapse' : 'Expand'} className="rounded p-1 hover:bg-surface-sunken">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="space-y-4 px-4 pb-4">
          {origin === 'borrower' && l?.file && (
            <div className="flex items-center gap-3 rounded-lg bg-surface-sunken px-3 py-2.5">
              <FileText className="h-4 w-4" />
              <div className="flex-1">
                <div className="text-sm font-medium">{l.file.name}</div>
                <div className="text-xs text-ink-muted">
                  {fileExt(l.file.name)} · {fmtSize(l.file.sizeKb)} · {fmtDateTime(l.file.uploadedAt)}
                </div>
              </div>
              <FileActions file={l.file} />
            </div>
          )}
          <LicenseFields draft={draft} onChange={set} disabled={readOnly} show={show} idPrefix={l?.id ?? 'new'} />
          {origin === 'admin' && (
            <div className="max-w-md">
              {draft.file && (
                <div className="mb-2 flex items-center gap-3 rounded-lg bg-surface-sunken px-3 py-2">
                  <FileText className="h-4 w-4" />
                  <span className="flex-1 text-sm">{draft.file.name}</span>
                  <FileActions file={draft.file as FileRef} />
                </div>
              )}
              {!readOnly && (
                <FormField label={draft.file ? 'Replace license document' : 'Upload New License'} required={!draft.file} error={show('file') || undefined}>
                  <div data-tour="license-upload">
                    <FileInput invalid={!!show('file')} accept=".pdf,.png,.jpg" onChange={(f) => f && set({ file: makeFileRef(f) })} />
                  </div>
                </FormField>
              )}
            </div>
          )}
          {!readOnly && (isNew || dirty) && (
            <div className="flex justify-end gap-2 border-t border-line pt-3">
              <Button
                size="sm"
                onClick={() => {
                  if (isNew) return onDiscardNew?.();
                  setDraft(saved);
                  setTouched(false);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={save} data-tour="license-save">
                Save
              </Button>
            </div>
          )}
        </div>
      )}
      {l && (
        <Dialog
          open={confirmRemove}
          onClose={() => setConfirmRemove(false)}
          title={`Remove ${title}?`}
          description={origin === 'borrower' ? 'The borrower-uploaded document stays in the Documents tab; only this license configuration is removed.' : 'This license and its configuration will be removed from the case.'}
          footer={
            <>
              <Button onClick={() => setConfirmRemove(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => removeLicense(c.id, l.id)}>
                Remove
              </Button>
            </>
          }
        />
      )}
    </div>
  );
}

export function LicenseTab() {
  const { c, readOnly } = useWs();
  const addLicense = useClm((s) => s.addLicense);
  const [newKey, setNewKey] = useState<number | null>(null);
  const licenses = c.edd.licenses;
  const nextNumber = Math.max(0, ...licenses.map((l) => l.number)) + 1;
  return (
    <section className="rounded-xl border border-line bg-white p-3" id="licenses" data-tour="licenses">
      <div className="flex items-center gap-3 rounded-lg bg-surface-sunken px-3 py-2.5">
        <div className="flex-1">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            Configured licenses
            <HelpTip topic="activity-license" />
          </h3>
          <p className="text-xs text-ink-muted">Each license links one uploaded document to a category and an issuing authority.</p>
        </div>
        {!readOnly && (
          <Button size="sm" onClick={() => setNewKey(Date.now())} disabled={newKey !== null} data-tour="license-add">
            <Plus className="h-3.5 w-3.5" />
            Add license
          </Button>
        )}
      </div>
      <div className="mt-3 space-y-3">
        {licenses.length === 0 && newKey === null && (
          <EmptyState title="No activity licenses" body="The borrower has not uploaded an activity license. This section does not block closing the case unless a license is added." />
        )}
        {licenses.map((l) => (
          <LicenseCard key={`${l.id}-${JSON.stringify(l)}`} l={l} title={`License ${l.number}`} />
        ))}
        {newKey !== null && (
          <LicenseCard
            key={newKey}
            isNew
            title={`License ${nextNumber}`}
            onDiscardNew={() => setNewKey(null)}
            onSaveNew={(d) => {
              addLicense(c.id, d);
              setNewKey(null);
            }}
          />
        )}
      </div>
    </section>
  );
}
