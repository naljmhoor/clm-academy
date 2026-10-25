import { useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { AlertTriangle, ArrowRight, Bot, Building2, ChevronDown, ChevronUp, Loader2, RefreshCw, SquareUser, Upload } from 'lucide-react';
import type { SigningDocument } from '@/domain/types';
import { signingMissingDocuments, signingSummary } from '@/domain/eddRules';
import { useClm } from '@/store/caseStore';
import { fmtDateTime } from '@/clm/format';
import { SectionCard } from '@/clm/components/ui/Card';
import { Badge } from '@/clm/components/ui/Badge';
import { Button } from '@/clm/components/ui/Button';
import { Dialog } from '@/clm/components/ui/Dialog';
import { MultiSelect, Select, type Option } from '@/clm/components/ui/Select';
import { FormField } from '@/clm/components/ui/misc';
import { personName, useWs } from '../context';
import { RefreshButton, WATHQ_COOLDOWN_MS } from '../sections/common';
import { HelpTip } from '@/training/help/HelpTip';

export function OwnershipTab() {
  return (
    <div className="space-y-3">
      <OwnersSection />
      <HierarchySection />
      <AoaBanner />
      <SigningSection />
    </div>
  );
}

// ---- Owners & Executives ---------------------------------------------------

function OwnersSection() {
  const { c, readOnly } = useWs();
  const refresh = useClm((s) => s.refreshOwners);
  const o = c.edd.owners;
  const cooldownUntil = o.retrievedAt ? Date.parse(o.retrievedAt) + WATHQ_COOLDOWN_MS : undefined;
  return (
    <SectionCard
      id="owners"
      title="Owners & Executives"
      subtitle={o.status === 'failed' ? o.error : `Retrieved from Wathq ${fmtDateTime(o.retrievedAt)}`}
      subtitleTone={o.status === 'failed' ? 'error' : 'muted'}
      actions={!readOnly && <RefreshButton label="Refresh from Wathq" onClick={() => refresh(c.id)} loading={o.status === 'loading'} cooldownUntil={cooldownUntil} />}
    >
      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-surface-sunken text-left">
            <tr>
              <th className="h-10 px-3 font-medium">Name</th>
              <th className="h-10 px-3 font-medium">ID number</th>
              <th className="h-10 px-3 font-medium">Role</th>
              <th className="h-10 px-3 font-medium">Ownership %</th>
            </tr>
          </thead>
          <tbody>
            {(o.data ?? []).map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="bidi h-12 px-3">{r.name}</td>
                <td className="px-3">{r.idNumber}</td>
                <td className="px-3">{r.role}</td>
                <td className="px-3">{r.ownership !== undefined ? `${r.ownership} %` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ---- Ownership hierarchy (recursive, on-demand) ----------------------------

function HierarchyNodeView({ id, depth }: { id: string; depth: number }) {
  const { c, readOnly } = useWs();
  const retrieve = useClm((s) => s.retrieveCorporateOwners);
  const node = c.edd.hierarchy.nodes[id];
  const [open, setOpen] = useState(true);
  if (!node) return null;
  const isCompany = node.kind === 'company';
  const hasChildren = !!node.children?.length;
  const pctColour = depth > 1 ? 'text-blue-700' : 'text-ink';
  return (
    <li className="relative">
      {depth > 0 && <span className="absolute -left-4 top-0 h-6 w-4 border-b border-l border-line" aria-hidden />}
      <div className={clsx('flex items-center gap-2 rounded-lg border border-line px-3 py-2', depth === 0 ? 'bg-surface-sunken' : 'bg-white')}>
        {isCompany ? <Building2 className="h-4 w-4 shrink-0" /> : <SquareUser className="h-4 w-4 shrink-0 text-ink-soft" />}
        <span className="link bidi truncate text-sm">{node.name}</span>
        {isCompany && depth > 0 && node.retrieval !== 'done' && !readOnly && (
          <button type="button" data-tour="hierarchy-retrieve" onClick={() => retrieve(c.id, id)} disabled={node.retrieval === 'loading'} className="flex items-center gap-1 text-xs text-blue-700 hover:underline disabled:text-ink-faint">
            Retrieve Ownership
            {node.retrieval === 'loading' ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          </button>
        )}
        {node.retrieval === 'failed' && <span className="text-xs text-red-600">Retrieval failed</span>}
        <span className="flex-1" />
        {node.ownership !== undefined && <span className={clsx('text-sm font-medium', pctColour)}>{node.ownership.toFixed(2)}%</span>}
        {hasChildren && (
          <button type="button" aria-label={open ? 'Collapse' : 'Expand'} onClick={() => setOpen(!open)} className="rounded p-0.5 hover:bg-surface-sunken">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hasChildren && open && (
        <ul className="ml-8 mt-2 space-y-2">
          {node.children!.map((ch) => (
            <HierarchyNodeView key={ch} id={ch} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function HierarchySection() {
  const { c } = useWs();
  return (
    <SectionCard id="hierarchy" title="Ownership Hierarchy" subtitle={`Retrieved from Wathq · Owners are shown beneath the company they own.`}>
      <ul className="space-y-2">
        <HierarchyNodeView id={c.edd.hierarchy.rootId} depth={0} />
      </ul>
    </SectionCard>
  );
}

// ---- AOA (UC011) -------------------------------------------------------------

function AoaBanner() {
  const { c, readOnly } = useWs();
  const upload = useClm((s) => s.uploadAoa);
  const input = useRef<HTMLInputElement>(null);
  const aoa = c.edd.aoa;
  if (aoa.status === 'processing' || aoa.status === 'retrieving') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-sunken px-4 py-3 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        {aoa.status === 'retrieving' ? 'Retrieving the Articles of Association from Amaly…' : `The AOA reader is analysing ${aoa.fileName}…`}
      </div>
    );
  }
  if (aoa.status === 'extraction_failed') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-orange-300 bg-orange-50 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 text-orange-700" />
        <div className="text-sm">
          <div className="font-medium text-orange-700">AOA extraction failed</div>
          <div className="text-ink-soft">The bot couldn't extract signing authority from {aoa.fileName}. Configure the signing authority manually below.</div>
        </div>
      </div>
    );
  }
  if (aoa.status !== 'unavailable') return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-orange-300 bg-orange-50 px-4 py-3" id="aoa">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-700" />
      <div className="flex-1 text-sm">
        <div className="font-medium text-orange-700">AOA document unavailable</div>
        <div className="text-ink-soft">The bot couldn't retrieve the AOA document from Amaly, and no AOA document has been uploaded. Please upload an AOA document so the bot can analyze it and provide a result.</div>
      </div>
      {!readOnly && (
        <>
          <input
            ref={input}
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(c.id, f);
              e.target.value = '';
            }}
          />
          <Button size="sm" onClick={() => input.current?.click()} data-tour="aoa-upload">
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
        </>
      )}
    </div>
  );
}

function BotResultDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { c } = useWs();
  const { applyBotResult, chooseManualSigning } = useClm();
  const aoa = c.edd.aoa;
  const people = c.edd.stakeholders;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="xl"
      showClose
      tour="bot-result-dialog"
      title="Signing Authority Bot Result"
      description={`Read from the Articles of Association (AOA) · Source: ${aoa.source === 'upload' ? 'Uploaded document' : 'Amaly'} · ${fmtDateTime(aoa.retrievedAt)}`}
      footer={
        <>
          <Button
            onClick={() => {
              chooseManualSigning(c.id);
              onClose();
            }}
          >
            Edit manually
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              applyBotResult(c.id);
              onClose();
            }}
          >
            Apply AOA result
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {(aoa.suggestions ?? []).map((s) => {
          const doc = c.edd.signing.documents.find((d) => d.id === s.documentId);
          return (
            <div key={s.documentId} className="overflow-hidden rounded-lg border border-line">
              <div className="flex items-center gap-2 bg-surface-sunken px-3 py-2 text-sm">
                <span className="font-semibold">{doc?.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-ink-muted" />
                <span className="text-xs text-ink-muted">{s.method === 'jointly' ? 'Signs jointly' : 'Signs individually'}</span>
              </div>
              <ul className="divide-y divide-line">
                {s.signatories.map((sig) => {
                  const p = people.find((x) => x.id === sig.stakeholderId);
                  const initials = (p?.nameEn ?? p?.nameAr ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('');
                  return (
                    <li key={sig.stakeholderId} className="flex items-center gap-3 px-3 py-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium">{initials}</span>
                      <span className="flex-1">
                        <span className="bidi block text-sm">{p?.nameAr ?? p?.nameEn}</span>
                        {p?.nameAr && p.nameEn && <span className="block text-xs text-ink-muted">{p.nameEn}</span>}
                      </span>
                      {sig.label && <span className="rounded-md border border-line px-2 py-0.5 text-xs font-medium">{sig.label}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </Dialog>
  );
}

// ---- Signing authority (UC012) -------------------------------------------

function SignatoryField({ label, doc, options, onChange, disabled, invalid }: { label: string; doc: SigningDocument; options: Option[]; onChange: (ids: string[]) => void; disabled: boolean; invalid: boolean }) {
  const n = doc.signatoryIds.length;
  return (
    <div>
      <FormField label={label} required={doc.required}>
        <MultiSelect value={doc.signatoryIds} onChange={onChange} options={options} disabled={disabled} invalid={invalid} placeholder="Select signatories…" />
      </FormField>
      {n > 0 && (
        <div className="mt-2 flex items-center gap-3 rounded-md bg-surface-sunken px-3 py-2 text-xs text-ink-soft">
          <span className="rounded bg-neutral-200/70 px-2 py-0.5 font-semibold text-ink-soft">
            {n} signator{n === 1 ? 'y' : 'ies'}
          </span>
          {n === 1 ? 'This signatory signs the document alone.' : `All ${n} selected signatories must sign this document.`}
        </div>
      )}
    </div>
  );
}

function Accordion({ title, required, summary, children, id }: { title: string; required?: boolean; summary?: string; children: React.ReactNode; id?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div id={id} className="rounded-lg border border-line">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3 py-3 text-left" aria-expanded={open}>
        <span className="flex-1 text-sm font-medium">
          {title}
          {required && <span className="text-red-600"> *</span>}
        </span>
        {summary && <span className="text-2xs text-ink-muted">{summary}</span>}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="space-y-4 px-3 pb-3">{children}</div>}
    </div>
  );
}

function SigningSection() {
  const { c } = useWs();
  // Remount the editor whenever the saved configuration changes (save, bot apply, reset).
  return <SigningEditor key={`${c.id}-${c.edd.signing.savedAt ?? 'initial'}`} />;
}

function SigningEditor() {
  const { c, readOnly } = useWs();
  const saveSigning = useClm((s) => s.saveSigning);
  const s = c.edd.signing;
  const [manager, setManager] = useState(s.defaultManagerId);
  const [docs, setDocs] = useState<SigningDocument[]>(s.documents);
  const [bot, setBot] = useState(false);
  const [touched, setTouched] = useState(false);
  const dirty = manager !== s.defaultManagerId || JSON.stringify(docs) !== JSON.stringify(s.documents);

  const persons = c.edd.stakeholders.filter((p) => p.kind === 'person');
  const options: Option[] = useMemo(
    () =>
      persons.map((p) => ({
        value: p.id,
        label: personName(p),
        hint: p.nameEn,
        render: (
          <span className="flex items-center justify-between gap-2">
            <span className="bidi">{personName(p)}</span>
            <span className="text-xs text-ink-muted">
              {p.role}
              {p.ownership !== undefined ? ` · ${p.ownership}%` : ''}
            </span>
          </span>
        ),
      })),
    [persons],
  );

  const saved = { ...c.edd, signing: s };
  const missing = signingMissingDocuments(saved);
  const incomplete = missing.length > 0 || !s.defaultManagerId;
  const canBot = c.edd.aoa.status === 'extracted' && !!c.edd.aoa.suggestions?.length;
  const setDoc = (id: string, ids: string[]) => setDocs((ds) => ds.map((d) => (d.id === id ? { ...d, signatoryIds: ids } : d)));
  const draftMissing = docs.filter((d) => d.required && !d.signatoryIds.length);

  const subtitle = !incomplete
    ? 'Choose who may sign each legal document. The number of signatories you select decides how it is signed.'
    : !s.method
      ? 'Signing authority has not been configured yet.'
      : `Still required: ${[!s.defaultManagerId && 'a default authorized manager', missing.length && `a signatory on ${missing.join(', ')}`].filter(Boolean).join(' and ')}.`;

  const standalone = docs.filter((d) => !d.groupId);
  return (
    <SectionCard
      id="signing"
      title={
        <span className="flex items-center gap-1.5">
          Signing Authority <HelpTip topic="signing-authority" label="What does joint signing mean?" />
        </span>
      }
      titleAside={s.method && <Badge tone="blue">{s.method === 'bot' ? 'From AOA result' : 'Manually completed'}</Badge>}
      subtitle={subtitle}
      subtitleTone={incomplete ? 'error' : 'muted'}
      actions={
        <Button size="sm" onClick={() => setBot(true)} disabled={!canBot} title={canBot ? undefined : 'No AOA bot result is available yet'} data-tour="view-bot-result">
          <Bot className="h-3.5 w-3.5" />
          View Bot Result
        </Button>
      }
    >
      <div className="space-y-3 px-1">
        <div className="max-w-sm">
          <FormField label="Default authorized manager" required error={touched && !manager ? 'Select the default authorized manager.' : undefined}>
            <Select value={manager} onChange={setManager} options={options} disabled={readOnly} invalid={touched && !manager} placeholder="Select manager" />
          </FormField>
        </div>
        <div className="space-y-3" data-tour="signing-docs">
        {standalone.map((d) => (
          <Accordion key={d.id} id={`signing-${d.id}`} title={d.label} required={d.required} summary={signingSummary(d.signatoryIds.length)}>
            <SignatoryField label="Authorized signatories" doc={d} options={options} onChange={(ids) => setDoc(d.id, ids)} disabled={readOnly} invalid={touched && d.required && !d.signatoryIds.length} />
          </Accordion>
        ))}
        {s.groups.map((g) => {
          const members = docs.filter((d) => d.groupId === g.id);
          const configured = members.filter((m) => m.signatoryIds.length).length;
          return (
            <Accordion key={g.id} title={g.label} summary={configured ? `${configured} of ${members.length} configured` : 'Not configured'}>
              {members.map((d) => (
                <SignatoryField key={d.id} label={`Authorized signatories (${d.label})`} doc={d} options={options} onChange={(ids) => setDoc(d.id, ids)} disabled={readOnly} invalid={false} />
              ))}
            </Accordion>
          );
        })}
        </div>
        {!readOnly && (
          <div className="flex items-center justify-end gap-2 pt-1">
            {touched && (draftMissing.length > 0 || !manager) && <span className="mr-auto text-xs text-red-600">Every required document needs at least one signatory.</span>}
            <Button
              disabled={!dirty}
              onClick={() => {
                setManager(s.defaultManagerId);
                setDocs(s.documents);
                setTouched(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!dirty}
              onClick={() => {
                setTouched(true);
                saveSigning(c.id, manager, docs);
              }}
            >
              Save changes
            </Button>
          </div>
        )}
      </div>
      <BotResultDialog open={bot} onClose={() => setBot(false)} />
    </SectionCard>
  );
}
