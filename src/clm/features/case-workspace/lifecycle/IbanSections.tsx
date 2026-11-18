// UC007 IBAN Review. The IBAN, bank and account values are fictional training data.

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useClm } from '@/store/caseStore';
import { Field, FieldGrid, SectionCard } from '@/clm/components/ui/Card';
import { Button } from '@/clm/components/ui/Button';
import { Dialog } from '@/clm/components/ui/Dialog';
import { HelpTip } from '@/training/help/HelpTip';
import { useWs } from '../context';
import { DecisionActions, DecisionSummary, FileRow, Masked, RejectDialog } from './shared';

export function IbanSection() {
  const { c } = useWs();
  const { approveIban, rejectRequest, ensureWorking } = useClm();
  const [reject, setReject] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const i = c.iban!;
  return (
    <SectionCard
      id="iban"
      title={
        <span className="flex items-center gap-1.5">
          IBAN <HelpTip topic="iban" label="When is an IBAN review created?" />
        </span>
      }
      subtitle="Submitted by the borrower after the automatic bank-account verification failed."
    >
      <div className="space-y-3 px-1">
        <div className="flex items-start gap-2 rounded-md bg-orange-50 px-3 py-2 text-xs text-orange-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {i.spareResult}
        </div>
        <FieldGrid cols={3}>
          <Field label="IBAN Number">
            <Masked value={i.iban} label="IBAN" />
          </Field>
          <Field label="Account Name">{i.accountName}</Field>
          <Field label="Bank Name">{i.bankName}</Field>
        </FieldGrid>
        <div className="px-2">
          <div className="label mb-1.5">Supporting document</div>
          <FileRow file={i.document} />
        </div>
        {c.decision && <DecisionSummary />}
        <DecisionActions approveLabel="Approve IBAN" onReject={() => ensureWorking(c.id) && setReject(true)} onApprove={() => ensureWorking(c.id) && setConfirm(true)} />
      </div>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Approve IBAN"
        description="The IBAN will be saved for the company and used for payouts."
        footer={
          <>
            <Button onClick={() => setConfirm(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                approveIban(c.id);
                setConfirm(false);
              }}
            >
              Approve IBAN
            </Button>
          </>
        }
      />
      <RejectDialog open={reject} onClose={() => setReject(false)} title="Reject IBAN" description="The IBAN is not saved. The borrower is informed of the reason." confirmLabel="Reject IBAN" onConfirm={(r) => rejectRequest(c.id, r)} />
    </SectionCard>
  );
}
