// Application state for the simulated CLM. Every user-visible action is an intent here,
// and every intent writes to the case's activity log (UC001/UC002 audit rules).

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ActivityEntry,
  Address,
  AddressSource,
  AmlResult,
  CaseRecord,
  CaseStatus,
  Comment,
  Entity,
  FileRef,
  License,
  Priority,
  Resolution,
  SigningDocument,
  User,
} from '@/domain/types';
import { STATUS_LABEL } from '@/domain/transitions';
import { amlOverall } from '@/domain/eddRules';
import { createSeed, CURRENT_USER_ID } from '@/mock/seed';
import * as api from '@/mock/integrations';
import { toast } from './toastStore';

const STORAGE_KEY = 'clm-academy:data:v1';
const PRIORITY_LABEL: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High' };

let idSeq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(idSeq++).toString(36)}`;
const nowIso = () => new Date().toISOString();

export function makeFileRef(file: File): FileRef {
  return { id: uid('f'), name: file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)), uploadedAt: nowIso(), mime: file.type || 'application/octet-stream' };
}

export interface CloseInput {
  resolution: Resolution;
  reason: string;
}

interface CaseState {
  users: User[];
  entities: Entity[];
  cases: CaseRecord[];
  currentUserId: string;

  resetAll: () => void;
  /** Restore specific cases (and their entities) to the seed state — used by tours and practice. */
  resetCases: (caseIds: string[]) => void;

  // Queue / header actions
  changeStatus: (caseId: string, to: Exclude<CaseStatus, 'closed' | 'need_info'>) => void;
  requestInfo: (caseId: string, details: string) => void;
  closeCase: (caseId: string, input: CloseInput) => void;
  setPriority: (caseId: string, p: Priority) => void;
  setAssignee: (caseId: string, userId: string | undefined) => void;

  // Comments
  addComment: (caseId: string, body: string, attachments: FileRef[]) => void;
  editComment: (caseId: string, commentId: string, body: string) => void;
  deleteComment: (caseId: string, commentId: string) => void;

  // Integrations & EDD sections
  runEddJobs: (caseId: string) => Promise<void>;
  retryKyb: (caseId: string) => Promise<void>;
  fetchSplAddress: (caseId: string) => Promise<api.CallResult<Address>>;
  fetchShortAddress: (caseId: string, shortAddress: string) => Promise<api.CallResult<Address>>;
  confirmAddress: (caseId: string, address: Address, source: AddressSource) => void;
  retryZatca: (caseId: string) => Promise<void>;
  setManualVat: (caseId: string, vatNumber: string) => void;
  retryAml: (caseId: string) => Promise<void>;
  decideAml: (caseId: string, partyId: string, decision: 'approved' | 'rejected' | 'ignored' | 'reported') => void;
  retrieveMasdr: (caseId: string) => Promise<void>;
  refreshOwners: (caseId: string) => Promise<void>;
  retrieveCorporateOwners: (caseId: string, nodeId: string) => Promise<void>;
  uploadAoa: (caseId: string, file: File) => Promise<void>;
  applyBotResult: (caseId: string) => void;
  chooseManualSigning: (caseId: string) => void;
  saveSigning: (caseId: string, defaultManagerId: string | undefined, documents: SigningDocument[]) => void;

  // Activity licenses
  addLicense: (caseId: string, data: Pick<License, 'file' | 'category' | 'authority' | 'issueDate' | 'expiryDate'>) => void;
  updateLicense: (caseId: string, licenseId: string, patch: Partial<License>, logLabel?: string) => void;
  removeLicense: (caseId: string, licenseId: string) => void;

  // Documents
  uploadDocument: (caseId: string, type: string, file: File) => void;
}

export const useClm = create<CaseState>()(
  persist(
    (set, get) => {
      const me = () => get().currentUserId;
      const getCase = (id: string) => get().cases.find((c) => c.id === id);
      const entityOf = (c: CaseRecord) => get().entities.find((e) => e.id === c.entityId)!;

      /** Clone-and-mutate update of one case. */
      const update = (caseId: string, recipe: (draft: CaseRecord) => void) =>
        set((s) => ({
          cases: s.cases.map((c) => {
            if (c.id !== caseId) return c;
            const draft = structuredClone(c);
            recipe(draft);
            return draft;
          }),
        }));

      const log = (draft: CaseRecord, entry: Omit<ActivityEntry, 'id' | 'at' | 'actorId'> & { actorId?: ActivityEntry['actorId'] }) => {
        draft.activity.unshift({ id: uid('act'), at: nowIso(), actorId: entry.actorId ?? me(), ...entry });
      };

      const pauseSla = (d: CaseRecord) => {
        d.pausedSince = nowIso();
      };
      const resumeSla = (d: CaseRecord) => {
        if (d.pausedSince) {
          d.pausedMs += Date.now() - Date.parse(d.pausedSince);
          d.pausedSince = undefined;
        }
      };

      return {
        ...createSeed(),
        currentUserId: CURRENT_USER_ID,

        resetAll: () => set({ ...createSeed(), currentUserId: CURRENT_USER_ID }),

        resetCases: (caseIds) => {
          const seed = createSeed();
          set((s) => ({
            cases: s.cases.map((c) => (caseIds.includes(c.id) ? (seed.cases.find((x) => x.id === c.id) ?? c) : c)),
          }));
        },

        changeStatus: (caseId, to) => {
          const before = getCase(caseId);
          if (!before || before.status === to) return;
          update(caseId, (d) => {
            if (d.status === 'need_info') resumeSla(d);
            log(d, { action: 'changed the case status', from: STATUS_LABEL[d.status], to: STATUS_LABEL[to] });
            d.status = to;
          });
          toast('Case status updated.');
          // UC013 Main flow 1–2: moving to In Progress runs the EDD jobs once.
          if (to === 'in_progress' && !before.jobsTriggered) void get().runEddJobs(caseId);
        },

        requestInfo: (caseId, details) => {
          update(caseId, (d) => {
            log(d, { action: 'changed the case status', from: STATUS_LABEL[d.status], to: 'Need Info' });
            d.status = 'need_info';
            pauseSla(d);
            d.comments.unshift({ id: uid('c'), authorId: me(), body: details, createdAt: nowIso(), attachments: [], kind: 'info_request' });
          });
          toast('Case status updated.');
        },

        closeCase: (caseId, { resolution, reason }) => {
          update(caseId, (d) => {
            if (d.status === 'need_info') resumeSla(d);
            log(d, {
              action: 'changed the case status',
              field: 'Resolution',
              from: STATUS_LABEL[d.status],
              to: resolution === 'approved' ? 'Approved' : 'Rejected',
              tone: resolution === 'approved' ? 'positive' : 'negative',
            });
            d.status = 'closed';
            d.resolution = resolution;
            d.resolutionReason = reason;
            d.closedAt = nowIso();
            d.closedById = me();
          });
          toast('Case closed.');
        },

        setPriority: (caseId, p) => {
          update(caseId, (d) => {
            if (d.priority === p) return;
            log(d, { action: 'changed the priority', from: PRIORITY_LABEL[d.priority], to: PRIORITY_LABEL[p] });
            d.priority = p;
          });
          toast('Priority updated.');
        },

        setAssignee: (caseId, userId) => {
          const users = get().users;
          update(caseId, (d) => {
            if (d.assigneeId === userId) return;
            const name = (id?: string) => users.find((u) => u.id === id)?.name ?? 'Unassigned';
            log(d, { action: d.assigneeId ? 'reassigned the case' : 'assigned the case', from: name(d.assigneeId), to: name(userId) });
            d.assigneeId = userId;
          });
          toast('Assignee updated.');
        },

        addComment: (caseId, body, attachments) => {
          update(caseId, (d) => {
            d.comments.unshift({ id: uid('c'), authorId: me(), body, createdAt: nowIso(), attachments });
            log(d, { action: 'added a comment' });
          });
        },
        editComment: (caseId, commentId, body) =>
          update(caseId, (d) => {
            const c = d.comments.find((x: Comment) => x.id === commentId);
            if (c) {
              c.body = body;
              c.editedAt = nowIso();
            }
          }),
        deleteComment: (caseId, commentId) =>
          update(caseId, (d) => {
            d.comments = d.comments.filter((x) => x.id !== commentId);
            log(d, { action: 'deleted a comment' });
          }),

        // ---- EDD jobs ------------------------------------------------------

        runEddJobs: async (caseId) => {
          const c = getCase(caseId);
          if (!c) return;
          update(caseId, (d) => {
            d.jobsTriggered = true;
            d.edd.address = { ...d.edd.address, status: 'loading' };
            d.edd.zatca = { ...d.edd.zatca, status: 'loading' };
            d.edd.aoa = { status: 'retrieving' };
            log(d, { actorId: 'system', action: 'started the EDD jobs', detail: 'SPL, ZATCA, AML screening (Mozn), Articles of Association (Amaly)' });
          });
          const entity = entityOf(c);
          const [spl, zatca] = await Promise.all([
            api.callSpl(entity, c.scenario.spl, c.edd.address.attempts + 1),
            api.callZatca(entity, c.scenario.zatca, c.edd.zatca.attempts + 1),
          ]);
          update(caseId, (d) => {
            d.edd.address = spl.ok
              ? { status: 'success', data: spl.data, retrievedAt: nowIso(), attempts: d.edd.address.attempts + 1, source: 'spl' }
              : { ...d.edd.address, status: 'failed', error: spl.error, attempts: d.edd.address.attempts + 1 };
            d.edd.zatca = zatca.ok
              ? { status: 'success', data: zatca.data, retrievedAt: nowIso(), attempts: d.edd.zatca.attempts + 1, entryMethod: zatca.data.vatNumber ? 'retrieved' : undefined }
              : { ...d.edd.zatca, status: 'failed', error: zatca.error, attempts: d.edd.zatca.attempts + 1 };
            log(d, { actorId: 'system', action: spl.ok ? 'retrieved the national address from SPL' : 'failed to retrieve the national address from SPL', detail: spl.ok ? undefined : spl.error });
            log(d, { actorId: 'system', action: zatca.ok ? 'retrieved VAT & Zakat information from ZATCA' : 'failed to retrieve VAT & Zakat information from ZATCA' });
          });
          await get().retryAml(caseId);
          await api.callAoaBot();
          update(caseId, (d) => {
            if (d.scenario.aoa === 'available') {
              d.edd.aoa = { status: 'processing', source: 'amaly', fileName: 'Articles_of_Association.pdf', retrievedAt: nowIso() };
              d.documents.unshift({ id: uid('doc'), name: 'Articles_of_Association.pdf', type: 'Articles of Association', uploadedById: 'system', uploadedAt: nowIso(), file: { id: uid('f'), name: 'Articles_of_Association.pdf', sizeKb: 412, uploadedAt: nowIso(), mime: 'application/pdf' } });
              log(d, { actorId: 'system', action: 'retrieved the Articles of Association from Amaly' });
            } else {
              d.edd.aoa = { status: 'unavailable' };
              log(d, { actorId: 'system', action: 'could not retrieve the Articles of Association from Amaly' });
            }
          });
          if (getCase(caseId)?.edd.aoa.status === 'processing') await finishAoa(caseId);
        },

        retryKyb: async (caseId) => {
          const c = getCase(caseId)!;
          update(caseId, (d) => void (d.edd.kyb.status = 'loading'));
          const res = await api.callWathq(entityOf(c), c.scenario.wathq, c.edd.kyb.attempts + 1);
          update(caseId, (d) => {
            d.edd.kyb = res.ok
              ? { status: 'success', data: res.data, retrievedAt: nowIso(), attempts: d.edd.kyb.attempts + 1 }
              : { ...d.edd.kyb, status: 'failed', error: res.error, attempts: d.edd.kyb.attempts + 1 };
            log(d, { action: res.ok ? 'refreshed company information from Wathq' : 'failed to refresh company information from Wathq' });
          });
          toast(res.ok ? 'Information refreshed.' : res.error, res.ok ? 'success' : 'error');
        },

        fetchSplAddress: async (caseId) => {
          // The retrieved address is only stored after the admin confirms it (UC006 AF-2).
          const c = getCase(caseId)!;
          const attempt = c.edd.address.attempts + 1;
          const res = await api.callSpl(entityOf(c), c.scenario.spl, attempt);
          update(caseId, (d) => {
            d.edd.address.attempts = attempt;
            if (!res.ok) {
              if (!d.edd.address.data) d.edd.address.status = 'failed';
              d.edd.address.error = res.error;
            }
            log(d, { action: res.ok ? 'retried the SPL request' : 'retried the SPL request — failed', detail: res.ok ? undefined : res.error });
          });
          if (!res.ok) toast(res.error, 'error');
          return res;
        },

        fetchShortAddress: async (caseId, shortAddress) => {
          const c = getCase(caseId)!;
          const attempt = c.edd.address.attempts + 1;
          const res = await api.callSplShortAddress(entityOf(c), shortAddress, c.scenario.shortAddress, attempt);
          update(caseId, (d) => {
            d.edd.address.attempts = attempt;
            log(d, { action: res.ok ? `retrieved an address using short address ${shortAddress.toUpperCase()}` : `short address retrieval failed for ${shortAddress.toUpperCase()}` });
          });
          return res;
        },

        confirmAddress: (caseId, address, source) => {
          update(caseId, (d) => {
            const prev = d.edd.address.data;
            d.edd.address = { status: 'success', data: address, retrievedAt: nowIso(), attempts: d.edd.address.attempts, source };
            const changed = (Object.keys(address) as (keyof Address)[]).filter((k) => (address[k] ?? '') !== (prev?.[k] ?? ''));
            log(d, {
              action: 'edited the national address',
              detail: `Source: ${source === 'manual' ? 'Manual entry' : source === 'short_address' ? 'Short address (SPL)' : 'SPL'} · ${changed.length} field${changed.length === 1 ? '' : 's'} changed`,
            });
          });
          toast('National address updated.');
        },

        retryZatca: async (caseId) => {
          const c = getCase(caseId)!;
          update(caseId, (d) => void (d.edd.zatca.status = 'loading'));
          const res = await api.callZatca(entityOf(c), c.scenario.zatca, c.edd.zatca.attempts + 1);
          update(caseId, (d) => {
            const manualVat = d.edd.zatca.entryMethod === 'manual' ? d.edd.zatca.data?.vatNumber : undefined;
            d.edd.zatca = res.ok
              ? { status: 'success', data: { ...res.data, vatNumber: res.data.vatNumber ?? manualVat }, retrievedAt: nowIso(), attempts: d.edd.zatca.attempts + 1, entryMethod: res.data.vatNumber ? 'retrieved' : d.edd.zatca.entryMethod }
              : { ...d.edd.zatca, status: d.edd.zatca.data ? 'success' : 'failed', error: res.error, attempts: d.edd.zatca.attempts + 1 };
            log(d, { action: res.ok ? 'retried ZATCA retrieval' : 'retried ZATCA retrieval — failed' });
          });
          toast(res.ok ? 'Information refreshed.' : 'Failed to retrieve VAT & Zakat information from ZATCA.', res.ok ? 'success' : 'error');
        },

        setManualVat: (caseId, vatNumber) => {
          update(caseId, (d) => {
            const prev = d.edd.zatca.data?.vatNumber;
            d.edd.zatca.data = { ...(d.edd.zatca.data ?? { certificateNumber: '', certificateStatus: 'Valid', issueDate: '', expiryDate: '' }), vatNumber, vatStatus: d.edd.zatca.data?.vatStatus };
            d.edd.zatca.entryMethod = 'manual';
            if (d.edd.zatca.status !== 'success') d.edd.zatca.status = d.edd.zatca.data.certificateNumber ? 'success' : d.edd.zatca.status;
            log(d, { action: 'entered the VAT number manually', field: 'VAT number', from: prev ?? 'Not returned', to: vatNumber });
          });
          toast('VAT number saved.');
        },

        retryAml: async (caseId) => {
          update(caseId, (d) => {
            d.edd.aml.parties.forEach((p) => {
              if (!['approved', 'rejected', 'reported'].includes(p.result)) p.result = 'in_progress';
            });
          });
          await api.callAmlScreening();
          const c = getCase(caseId)!;
          update(caseId, (d) => {
            d.edd.aml.attempts += 1;
            d.edd.aml.screenedAt = nowIso();
            d.edd.aml.parties.forEach((p, i) => {
              if (p.result !== 'in_progress') return;
              if (c.scenario.aml === 'fail') p.result = 'failed';
              else if (c.scenario.aml === 'pending_review' && i === 2) {
                p.result = 'pending_review';
                p.matchSummary = 'Potential PEP match (domestic) — name similarity 87 %, date of birth not confirmed.';
              } else if (p.matchSummary && p.result === 'in_progress') p.result = 'pending_review';
              else p.result = 'clear';
            });
            const overall = amlOverall(d.edd.aml.parties);
            log(d, { actorId: 'system', action: 'completed AML screening (Mozn)', detail: overall === 'verified' ? 'All parties clear' : overall === 'pending_review' ? 'At least one result requires review' : 'Screening incomplete' });
          });
        },

        decideAml: (caseId, partyId, decision) => {
          const map: Record<typeof decision, AmlResult> = { approved: 'approved', rejected: 'rejected', ignored: 'clear', reported: 'reported' };
          const label = { approved: 'Approved', rejected: 'Rejected', ignored: 'Ignored', reported: 'Reported to MOZN' }[decision];
          update(caseId, (d) => {
            const p = d.edd.aml.parties.find((x) => x.id === partyId);
            if (!p) return;
            log(d, { action: 'recorded an AML decision', field: p.name, from: 'Pending Review', to: label, tone: decision === 'rejected' ? 'negative' : 'neutral' });
            p.result = map[decision];
            p.decidedBy = me();
            p.decidedAt = nowIso();
            // UC008 AF-4: an AML rejection closes the EDD immediately.
            if (decision === 'rejected' && d.status !== 'closed') {
              if (d.status === 'need_info') resumeSla(d);
              log(d, { actorId: 'system', action: 'closed the case', field: 'Resolution', from: STATUS_LABEL[d.status], to: 'Rejected', tone: 'negative' });
              d.status = 'closed';
              d.resolution = 'rejected';
              d.resolutionReason = `AML Rejected — ${p.name}.`;
              d.closedAt = nowIso();
              d.closedById = me();
            }
          });
          toast(decision === 'rejected' ? 'AML result rejected. The EDD case was closed as Rejected.' : 'AML decision saved.');
        },

        retrieveMasdr: async (caseId) => {
          const c = getCase(caseId)!;
          update(caseId, (d) => void (d.edd.workforce.status = 'loading'));
          const res = await api.callMasdr(entityOf(c), c.scenario.masdr, c.edd.workforce.attempts + 1);
          update(caseId, (d) => {
            d.edd.workforce = res.ok
              ? { status: 'success', data: res.data, retrievedAt: nowIso(), attempts: d.edd.workforce.attempts + 1 }
              : { ...d.edd.workforce, status: 'failed', error: res.error, attempts: d.edd.workforce.attempts + 1 };
            log(d, { action: res.ok ? 'retrieved workforce information from Masdr' : 'failed to retrieve workforce information from Masdr' });
          });
          if (res.ok) toast('Information refreshed.');
        },

        refreshOwners: async (caseId) => {
          const c = getCase(caseId)!;
          update(caseId, (d) => void (d.edd.owners.status = 'loading'));
          const res = await api.callWathq(entityOf(c), c.scenario.wathq, c.edd.owners.attempts + 1);
          update(caseId, (d) => {
            d.edd.owners.attempts += 1;
            if (res.ok) {
              d.edd.owners.status = 'success';
              d.edd.owners.retrievedAt = nowIso();
            } else {
              d.edd.owners.status = d.edd.owners.data ? 'success' : 'failed';
              d.edd.owners.error = res.error;
            }
            log(d, { action: res.ok ? 'refreshed owners & executives from Wathq' : 'failed to refresh owners & executives from Wathq' });
          });
          toast(res.ok ? 'Information refreshed.' : res.error, res.ok ? 'success' : 'error');
        },

        retrieveCorporateOwners: async (caseId, nodeId) => {
          const c = getCase(caseId)!;
          const depth = nodeId.split('.').length - 1;
          update(caseId, (d) => void (d.edd.hierarchy.nodes[nodeId].retrieval = 'loading'));
          const res = await api.callOwnersApi(nodeId, depth);
          update(caseId, (d) => {
            const node = d.edd.hierarchy.nodes[nodeId];
            if (!res.ok) {
              node.retrieval = 'failed';
              return;
            }
            res.data.forEach((child) => (d.edd.hierarchy.nodes[child.id] = child));
            node.children = res.data.map((x) => x.id);
            node.retrieval = 'done';
            log(d, { action: 'retrieved ownership', detail: c.edd.hierarchy.nodes[nodeId].name });
          });
        },

        uploadAoa: async (caseId, file) => {
          const ref = makeFileRef(file);
          update(caseId, (d) => {
            d.edd.aoa = { status: 'processing', source: 'upload', fileName: ref.name, retrievedAt: nowIso() };
            d.documents.unshift({ id: uid('doc'), name: ref.name, type: 'Articles of Association', uploadedById: me(), uploadedAt: nowIso(), file: ref });
            log(d, { action: 'uploaded the Articles of Association', detail: ref.name });
          });
          await finishAoa(caseId);
        },

        applyBotResult: (caseId) => {
          update(caseId, (d) => {
            const sugg = d.edd.aoa.suggestions ?? [];
            d.edd.signing.documents = d.edd.signing.documents.map((doc) => {
              const s = sugg.find((x) => x.documentId === doc.id);
              return s ? { ...doc, signatoryIds: s.signatories.map((x) => x.stakeholderId) } : doc;
            });
            if (!d.edd.signing.defaultManagerId) d.edd.signing.defaultManagerId = sugg[0]?.signatories[0]?.stakeholderId;
            d.edd.signing.method = 'bot';
            d.edd.signing.savedAt = nowIso();
            d.edd.aoa.decision = 'applied';
            log(d, { action: 'applied the AOA bot result to signing authority' });
          });
          toast('AOA result applied.');
        },

        chooseManualSigning: (caseId) =>
          update(caseId, (d) => {
            d.edd.aoa.decision = 'manual';
            log(d, { action: 'rejected the AOA bot suggestion and chose manual entry' });
          }),

        saveSigning: (caseId, defaultManagerId, documents) => {
          update(caseId, (d) => {
            d.edd.signing.defaultManagerId = defaultManagerId;
            d.edd.signing.documents = documents;
            d.edd.signing.method = 'manual';
            d.edd.signing.savedAt = nowIso();
            log(d, { action: 'updated the signing authority', detail: `${documents.filter((x) => x.signatoryIds.length).length} of ${documents.length} documents configured` });
          });
          toast('Authorized signatories updated.');
        },

        addLicense: (caseId, data) => {
          update(caseId, (d) => {
            const number = Math.max(0, ...d.edd.licenses.map((l) => l.number)) + 1;
            d.edd.licenses.push({ id: uid('lic'), number, origin: 'admin', ...data });
            if (data.file) d.documents.unshift({ id: uid('doc'), name: data.file.name, type: 'Activity License', uploadedById: me(), uploadedAt: nowIso(), file: data.file });
            log(d, { action: 'added an activity license', detail: `License ${number} · ${data.category ?? ''} · ${data.authority ?? ''}` });
          });
          toast('Activity license added.');
        },

        updateLicense: (caseId, licenseId, patch, logLabel) =>
          update(caseId, (d) => {
            const l = d.edd.licenses.find((x) => x.id === licenseId);
            if (!l) return;
            Object.assign(l, patch);
            if (logLabel) log(d, { action: 'updated an activity license', detail: `License ${l.number} · ${logLabel}` });
          }),

        removeLicense: (caseId, licenseId) =>
          update(caseId, (d) => {
            const l = d.edd.licenses.find((x) => x.id === licenseId);
            d.edd.licenses = d.edd.licenses.filter((x) => x.id !== licenseId);
            if (l) log(d, { action: 'removed an activity license', detail: `License ${l.number}` });
          }),

        uploadDocument: (caseId, type, file) => {
          const ref = makeFileRef(file);
          update(caseId, (d) => {
            d.documents.unshift({ id: uid('doc'), name: ref.name, type, uploadedById: me(), uploadedAt: nowIso(), file: ref });
            log(d, { action: 'uploaded a document', detail: `${type} — ${ref.name}` });
          });
          toast('Document uploaded.');
        },
      };

      async function finishAoa(caseId: string) {
        await api.callAoaBot();
        const c = getCase(caseId);
        if (!c) return;
        update(caseId, (d) => {
          if (c.scenario.aoaExtraction === 'fail') {
            d.edd.aoa.status = 'extraction_failed';
            log(d, { actorId: 'system', action: 'AOA reader could not extract signing authority' });
            return;
          }
          d.edd.aoa.status = 'extracted';
          d.edd.aoa.suggestions = api.generateBotSuggestions(
            d.edd.stakeholders,
            d.edd.signing.documents.filter((x) => !x.groupId).map((x) => x.id),
          );
          log(d, { actorId: 'system', action: 'AOA reader extracted signing authority' });
        });
      }
    },
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (s) => ({ users: s.users, entities: s.entities, cases: s.cases, currentUserId: s.currentUserId }),
    },
  ),
);

export const useCase = (id: string | undefined) => useClm((s) => s.cases.find((c) => c.id === id));
export const useEntity = (id: string | undefined) => useClm((s) => s.entities.find((e) => e.id === id));
export const useUsers = () => useClm((s) => s.users);
export const useCurrentUser = () => useClm((s) => s.users.find((u) => u.id === s.currentUserId)!);
