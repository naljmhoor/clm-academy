import { useState } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import type { FileRef } from '@/domain/types';
import { fileExt, fmtDateTime, fmtSize } from '@/clm/format';
import { Dialog } from '@/clm/components/ui/Dialog';
import { Button } from '@/clm/components/ui/Button';

/** Builds a one-page PDF so "Download" produces a real (synthetic) file. */
function trainingPdf(title: string): Blob {
  const text = `CLM Academy - synthetic training document: ${title}`.replace(/[()\\]/g, '');
  const stream = `BT /F1 12 Tf 60 760 Td (${text}) Tj ET`;
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([out], { type: 'application/pdf' });
}

export function downloadFile(file: FileRef) {
  const url = URL.createObjectURL(trainingPdf(file.name));
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name.toLowerCase().endsWith('.pdf') ? file.name : `${file.name}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function FilePreviewDialog({ file, onClose }: { file: FileRef; onClose: () => void }) {
  return (
    <Dialog open onClose={onClose} width="xl" showClose title={file.name} description={`${fileExt(file.name)} · ${fmtSize(file.sizeKb)} · ${fmtDateTime(file.uploadedAt)}`} footer={<Button onClick={() => downloadFile(file)}><Download className="h-3.5 w-3.5" />Download</Button>}>
      <div className="flex h-80 flex-col items-center justify-center rounded-lg border border-line bg-surface-sunken text-center">
        <FileText className="h-10 w-10 text-ink-muted" />
        <div className="mt-3 text-sm font-medium">Document preview</div>
        <p className="mt-1 max-w-sm text-xs text-ink-muted">Training documents are synthetic placeholders. In CLM the document opens in the built-in viewer.</p>
      </div>
    </Dialog>
  );
}

export function FileActions({ file }: { file: FileRef }) {
  const [preview, setPreview] = useState(false);
  return (
    <span className="flex items-center gap-1.5">
      <button type="button" onClick={() => setPreview(true)} aria-label={`View ${file.name}`} title="View" className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white hover:bg-surface-sunken">
        <Eye className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => downloadFile(file)} aria-label={`Download ${file.name}`} title="Download" className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white hover:bg-surface-sunken">
        <Download className="h-3.5 w-3.5" />
      </button>
      {preview && <FilePreviewDialog file={file} onClose={() => setPreview(false)} />}
    </span>
  );
}
