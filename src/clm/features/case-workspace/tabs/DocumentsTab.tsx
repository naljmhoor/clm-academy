import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DOCUMENT_TYPES } from '@/mock/masterData';
import { useClm, useUsers } from '@/store/caseStore';
import { fmtDateTime } from '@/clm/format';
import { Button } from '@/clm/components/ui/Button';
import { Dialog } from '@/clm/components/ui/Dialog';
import { Select } from '@/clm/components/ui/Select';
import { EmptyState, FileInput, FormField } from '@/clm/components/ui/misc';
import { useWs } from '../context';
import { FileActions } from '../dialogs/documents';

function UploadDialog({ onClose }: { onClose: () => void }) {
  const { c } = useWs();
  const upload = useClm((s) => s.uploadDocument);
  const [type, setType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);
  return (
    <Dialog
      open
      onClose={onClose}
      title="Upload a Document"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              setTouched(true);
              if (!type || !file) return;
              upload(c.id, type, file);
              onClose();
            }}
          >
            Upload
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Document Type" required error={touched && !type ? 'Select a document type.' : undefined}>
          <Select value={type} onChange={setType} invalid={touched && !type} placeholder="Select a type" options={DOCUMENT_TYPES.map((t) => ({ value: t, label: t }))} />
        </FormField>
        <FormField label="Document" required error={touched && !file ? 'Choose a file to upload.' : undefined}>
          <FileInput file={file} onChange={setFile} invalid={touched && !file} />
        </FormField>
      </div>
    </Dialog>
  );
}

export function DocumentsTab() {
  const { c, readOnly } = useWs();
  const users = useUsers();
  const [upload, setUpload] = useState(false);
  const TH = 'h-10 px-3 text-left text-sm font-medium';
  return (
    <section className="rounded-xl border border-line bg-white p-3" id="documents" data-tour="documents">
      <div className="flex items-center gap-3 rounded-lg bg-surface-sunken px-3 py-2.5">
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Documents</h3>
          <p className="text-xs text-ink-muted">All documents uploaded by the client or manually added by the admin are displayed here.</p>
        </div>
        {!readOnly && (
          <Button size="sm" onClick={() => setUpload(true)}>
            <Plus className="h-3.5 w-3.5" />
            Upload Document
          </Button>
        )}
      </div>
      <div className="mt-3 overflow-hidden rounded-lg border border-line">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-surface-sunken">
            <tr>
              <th className={TH}>Document Name</th>
              <th className={TH}>Document Type</th>
              <th className={TH}>Upload By</th>
              <th className={TH}>Upload Date</th>
              <th className={TH}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {c.documents.map((d) => (
              <tr key={d.id} className="border-t border-line">
                <td className="h-12 max-w-[220px] truncate px-3" title={d.name}>
                  {d.name}
                </td>
                <td className="px-3">{d.type}</td>
                <td className="px-3">{d.uploadedById === 'system' ? 'System' : users.find((u) => u.id === d.uploadedById)?.name}</td>
                <td className="px-3">{fmtDateTime(d.uploadedAt)}</td>
                <td className="px-3">
                  <FileActions file={d.file} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {c.documents.length === 0 && <EmptyState title="No documents yet" />}
      </div>
      {upload && <UploadDialog onClose={() => setUpload(false)} />}
    </section>
  );
}
