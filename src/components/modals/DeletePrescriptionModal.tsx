import { AlertTriangle, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import type { Prescription } from "../../types/prescription.type";
import {
  modalFooterCancelClassName,
  modalFooterDangerClassName,
  modalFooterRowClassName,
} from "./modalFooterStyles";

interface DeletePrescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  prescription: Prescription | null;
  onConfirm: () => Promise<void>;
}

export const DeletePrescriptionModal = ({
  open,
  onOpenChange,
  onClose,
  prescription,
  onConfirm,
}: DeletePrescriptionModalProps): JSX.Element => {
  const [submitting, setSubmitting] = useState(false);
  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      /* PrescriptionProvider shows error toast */
    } finally {
      setSubmitting(false);
    }
  };

  const patientLabel = prescription?.patientName ?? "this patient";
  const dateLabel = prescription?.appointmentDate
    ? new Date(prescription.appointmentDate).toLocaleDateString()
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 border-none overflow-hidden gap-0">
        <DialogHeader className="flex flex-row items-center gap-2 p-4 border-b rounded-t-lg bg-[#FFF1F1]">
          <div className="flex items-center gap-2 p-[2px] rounded-[50px] bg-white">
            <AlertTriangle className="w-4 h-4 text-black" />
          </div>
          <DialogTitle className="text-sm font-semibold text-gray-700">
            Delete prescription
          </DialogTitle>
        </DialogHeader>
        <div className="px-[25px] py-[25px] space-y-4">
          <p className="text-[14px] leading-relaxed text-gray-600">
            The prescription for{" "}
            <strong className="text-black">{patientLabel}</strong> from the
            appointment on <strong className="text-black">{dateLabel}</strong>{" "}
            will be removed permanently. Please confirm to proceed.
          </p>
          <div className={modalFooterRowClassName}>
            <Button
              variant="ghost"
              className={modalFooterCancelClassName}
              onClick={onClose}
              disabled={submitting}
              leadingIcon={<X className="h-4 w-4" />}
            >
              Close
            </Button>
            <Button
              className={modalFooterDangerClassName}
              onClick={() => void handleConfirm()}
              loading={submitting}
              leadingIcon={<Trash2 className="h-4 w-4" />}
            >
              Delete prescription
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
