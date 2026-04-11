import { AlertTriangle, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import type { Doctor } from "../../types/doctor.type";
import {
  modalFooterCancelClassName,
  modalFooterDangerClassName,
  modalFooterRowClassName,
} from "./modalFooterStyles";

interface DeleteDoctorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  doctor: Doctor | null;
  onConfirm: () => Promise<void>;
}

export const DeleteDoctorModal = ({
  open,
  onOpenChange,
  onClose,
  doctor,
  onConfirm,
}: DeleteDoctorModalProps): JSX.Element => {
  const [submitting, setSubmitting] = useState(false);
  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      /* toast from DoctorProvider */
    } finally {
      setSubmitting(false);
    }
  };

  const name = doctor?.fullName ?? "this doctor";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 border-none overflow-hidden gap-0">
        <DialogHeader className="flex flex-row items-center gap-2 p-4 border-b rounded-t-lg bg-[#FFF1F1]">
          <div className="flex items-center gap-2 p-[2px] rounded-[50px] bg-white">
            <AlertTriangle className="w-4 h-4 text-black" />
          </div>
          <DialogTitle className="text-sm font-semibold text-gray-700">
            Remove doctor
          </DialogTitle>
        </DialogHeader>
        <div className="px-[25px] py-[25px] space-y-4">
          <p className="text-[14px] leading-relaxed text-gray-600">
            <strong className="text-black">{name}</strong> will be removed from
            your doctors list. This cannot be undone. Please confirm to proceed.
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
              Remove doctor
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
