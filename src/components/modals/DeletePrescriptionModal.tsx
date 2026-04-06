import { AlertTriangle, X } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import type { Prescription } from "../../types/prescription.type";

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
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      /* PrescriptionProvider shows error toast */
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
          <div className="flex justify-end gap-[20px] pt-4">
            <Button
              variant="ghost"
              className="w-[86px] text-gray-500 text-xs h-9 px-6 bg-[#F5F5F5] text-[14px]"
              onClick={onClose}
            >
              {/* <X className="w-4 h-4 mr-1" /> */}
              Close
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white text-xs h-9 px-6 text-[14px]"
              onClick={() => void handleConfirm()}
            >
              {/* <X className="w-4 h-4 mr-1" /> */}
              Delete prescription
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
