// UC008 Request Compliance Documents — an action available from the Entity Profile and the EDD Documents tab.

import { useState } from 'react';
import { Download, Eye, Send } from 'lucide-react';
import type { ComplianceRequest, Entity } from '@/domain/types';
import { COMPLIANCE_DOCUMENTS } from '@/mock/masterData';
import { useClm } from '@/store/caseStore';
import { fmtDateTime } from '@/clm/format';
import { Badge } from '@/clm/components/ui/Badge';
import { Button } from '@/clm/components/ui/Button';
import { Dialog } from '@/clm/components/ui/Dialog';
import { MultiSelect } from '@/clm/components/ui/Select';
import { FormField } from '@/clm/components/ui/misc';
import { FileActions } from '../case-workspace/dialogs/documents';

export function RequestDocumentsDialog({ entity, caseId, onClose }: { entity: Entity; caseId?: string; onClose: () => void }) {
  const request = useClm((s) => s.requestComplianceDocuments);
  const [docs, setDocs] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const pending = new Set((entity.complianceRequests ?? []).filter((r) => r.status === 'pending').map((r) => r.docType));
  return (
    <Dialog
      open
      onClose={onClose}
      tour="request-docs-dialog"
      title="Request compliance documents"
      description="The borrower receives one upload task for the selected documents."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            data-tour="request-docs-send"
            onClick={() => {
              setTouched(true);
              if (!docs.length) return;
              request(entity.id, docs, caseId);
              onClose();
            }}
          >
            <Send className="h-3.5 w-3.5" />
            Send request
          </Button>
        </>
      }
    >
      <FormField label="Documents" required error={touched && !docs.length ? 'Select at least one document.' : undefined}>
        <div data-tour="request-docs-select">
          <MultiSelect
            value={docs}
            onChange={setDocs}
            invalid={touched && !docs.length}
            placeholder="Select documents"
            options={COMPLIANCE_DOCUMENTS.map((d) => ({ value: d, label: d, disabled: pending.has(d), note: pending.has(d) ? 'Already requested' : undefined }))}
          />
        </div>
      </FormField>
      <p className="mt-3 text-xs text-ink-muted">Task created automatically: Compliance Documents Task · Priority High · Due in one month. A document that is already pending can’t be requested again.</p>
    </Dialog>
  );
}

/** Rows for requested compliance documents, shown above the other documents. */
export function ComplianceRows({ requests, colSpanAfterType = 0 }: { requests: ComplianceRequest[]; colSpanAfterType?: number }) {
  return (
    <>
      {requests.map((r) => (
        <tr key={r.id} className="border-t border-line" data-tour={`compliance-row-${r.status}`}>
          <td className="h-12 max-w-[220px] truncate px-3">{r.file?.name ?? r.docType}</td>
          <td className="px-3">{r.docType}</td>
          {colSpanAfterType > 0 && <td className="px-3" colSpan={colSpanAfterType} />}
          <td className="px-3">{r.status === 'uploaded' ? 'Borrower' : '-'}</td>
          <td className="px-3">
            <Badge tone={r.status === 'uploaded' ? 'green' : 'orange'}>{r.status === 'uploaded' ? 'Uploaded' : 'Pending'}</Badge>
          </td>
          <td className="px-3">{fmtDateTime(r.uploadedAt ?? r.requestedAt)}</td>
          <td className="px-3">
            {r.file ? (
              <FileActions file={r.file} />
            ) : (
              <span className="flex items-center gap-1.5 opacity-40" title="Available after the borrower uploads">
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-line">
                  <Eye className="h-3.5 w-3.5" />
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-line">
                  <Download className="h-3.5 w-3.5" />
                </span>
              </span>
            )}
          </td>
        </tr>
      ))}
    </>
  );
}
