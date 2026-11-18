// Simulated borrower-side view (UC008 task, UC009 renew activity license) for reference inside CLM.
// It mirrors the borrower app layout in Arabic. Nothing here talks to a real borrower app.

import { useState } from 'react';
import clsx from 'clsx';
import { Bell, CheckCircle2, FileUp, MessageSquareText, Smartphone } from 'lucide-react';
import type { BorrowerTask } from '@/domain/types';
import { useClm, useEntity } from '@/store/caseStore';
import { Dialog } from '@/clm/components/ui/Dialog';
import { Button } from '@/clm/components/ui/Button';
import { fmtDate } from '@/clm/format';

const STATUS_AR: Record<BorrowerTask['status'], { label: string; cls: string }> = {
  pending: { label: 'بانتظارك', cls: 'bg-orange-50 text-orange-700' },
  completed: { label: 'مكتملة', cls: 'bg-green-50 text-green-700' },
  rejected: { label: 'مرفوضة', cls: 'bg-red-50 text-red-700' },
};
const TITLE_AR: Record<BorrowerTask['kind'], string> = {
  license_renewal: 'إرفاق رخصة النشاط المجددة',
  compliance_documents: 'رفع مستندات الامتثال',
};

function Notifications({ kind }: { kind: BorrowerTask['kind'] }) {
  if (kind !== 'license_renewal') {
    return <p className="text-xs text-ink-muted">The borrower is notified through the existing task notification (unchanged by UC008).</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 text-xs" data-tour="borrower-notifications">
      <div className="rounded-lg border border-line p-3">
        <div className="mb-1.5 flex items-center gap-1.5 font-semibold">
          <MessageSquareText className="h-3.5 w-3.5" /> SMS
        </div>
        <p dir="rtl" className="leading-5">عميلنا العزيز، انتهت صلاحية إحدى رخص النشاط الخاصة بالشركة. يرجى رفع الرخصة المجددة عبر المنصة. {'{رابط المهمة}'}</p>
        <p className="mt-2 leading-5 text-ink-muted">Dear Client, one of your entity’s activity licenses has expired. Please upload the renewed license through the platform. {'{Task short link}'}</p>
      </div>
      <div className="rounded-lg border border-line p-3">
        <div className="mb-1.5 flex items-center gap-1.5 font-semibold">
          <Bell className="h-3.5 w-3.5" /> App notification
        </div>
        <p dir="rtl" className="font-semibold">رخصة النشاط منتهية</p>
        <p dir="rtl">يرجى رفع الرخصة المجددة للشركة.</p>
        <p className="mt-2 font-semibold text-ink-muted">Activity License Expired</p>
        <p className="text-ink-muted">Your entity’s activity license has expired. Please upload the renewed license.</p>
      </div>
    </div>
  );
}

export function BorrowerPreview({ entityId, focusTaskId, onClose }: { entityId: string; focusTaskId?: string; onClose: () => void }) {
  const entity = useEntity(entityId);
  const cases = useClm((s) => s.cases);
  const { simulateBorrowerLicenseUpload, simulateComplianceUpload } = useClm();
  const tasks = entity?.borrowerTasks ?? [];
  const [selected, setSelected] = useState(focusTaskId ?? tasks[0]?.id);
  if (!entity) return null;
  const task = tasks.find((t) => t.id === selected);
  const licenseCase = task?.kind === 'license_renewal' ? cases.find((c) => c.id === task.caseId) : undefined;
  const requests = (entity.complianceRequests ?? []).filter((r) => r.taskId === task?.id);

  return (
    <Dialog
      open
      onClose={onClose}
      width="xl"
      showClose
      tour="borrower-preview"
      title={
        <span className="flex items-center gap-2">
          <Smartphone className="h-4 w-4" /> Borrower side — simulated preview
        </span>
      }
      description="What the borrower sees in the borrower app. Simulated for training: use the buttons to act as the borrower."
    >
      <div className="space-y-3">
        <div dir="rtl" className="overflow-hidden rounded-xl border border-line bg-[#f7f7f8]" data-tour="borrower-portal">
          <div className="flex items-center justify-between border-b border-line bg-white px-4 py-3">
            <div className="text-sm font-semibold">{entity.nameAr}</div>
            <div className="text-xs text-ink-muted">المهام ({tasks.length})</div>
          </div>
          <div className="grid grid-cols-[220px_1fr] gap-0">
            <ul className="space-y-2 border-l border-line p-3">
              {tasks.length === 0 && <li className="text-xs text-ink-muted">لا توجد مهام</li>}
              {tasks.map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => setSelected(t.id)} className={clsx('w-full rounded-lg border bg-white p-2.5 text-right', t.id === selected ? 'border-ink' : 'border-line')}>
                    <span className={clsx('mb-1 inline-block rounded px-1.5 text-2xs font-semibold', STATUS_AR[t.status].cls)}>{STATUS_AR[t.status].label}</span>
                    <span className="block text-sm font-semibold">{TITLE_AR[t.kind]}</span>
                    <span className="block text-2xs text-ink-muted">الموعد النهائي <bdi dir="ltr">{fmtDate(t.dueAt)}</bdi></span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="min-h-[220px] bg-white p-4">
              {!task && <p className="text-sm text-ink-muted">اختر مهمة</p>}
              {task?.kind === 'license_renewal' && licenseCase?.licenseExpiry && (
                <div className="space-y-3 text-sm">
                  <h4 className="text-base font-semibold">تفاصيل المهمة</h4>
                  <p className="text-xs text-ink-muted">تتطلب المهمة إرفاق رخصة النشاط المجددة الخاصة بنشاط المنشأة، وذلك لاستكمال ملف المنشأة.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-2xs text-ink-muted">الرخصة المنتهية</div>
                      <div>License {licenseCase.licenseExpiry.expired.number}</div>
                    </div>
                    <div>
                      <div className="text-2xs text-ink-muted">تاريخ الانتهاء</div>
                      <div dir="ltr" className="text-right">{fmtDate(licenseCase.licenseExpiry.expired.expiryDate)}</div>
                    </div>
                  </div>
                  {task.status === 'rejected' && <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">تم رفض الرخصة: {task.note}</div>}
                  {licenseCase.licenseExpiry.renewed ? (
                    <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">
                      <CheckCircle2 className="h-4 w-4" /> تم تحديث رخصة النشاط بنجاح — {licenseCase.licenseExpiry.renewed.file.name}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-line p-3">
                      <div className="mb-2 text-xs">رخصة النشاط المجددة *</div>
                      <Button size="sm" variant="primary" onClick={() => simulateBorrowerLicenseUpload(licenseCase.id)} data-tour="borrower-upload-license">
                        <FileUp className="h-3.5 w-3.5" />
                        رفع وحفظ (محاكاة)
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {task?.kind === 'compliance_documents' && (
                <div className="space-y-2 text-sm">
                  <h4 className="text-base font-semibold">المستندات المطلوبة</h4>
                  {requests.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2">
                      <span dir="ltr">{r.docType}</span>
                      {r.status === 'uploaded' ? (
                        <span className="text-xs text-green-700">تم الرفع</span>
                      ) : (
                        <Button size="sm" onClick={() => simulateComplianceUpload(entity.id, r.id)} data-tour="borrower-upload-doc">
                          <FileUp className="h-3.5 w-3.5" /> رفع (محاكاة)
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {task && <Notifications kind={task.kind} />}
      </div>
    </Dialog>
  );
}
