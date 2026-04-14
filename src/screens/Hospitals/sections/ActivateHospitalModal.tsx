import { useState, type ComponentType } from "react";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { showError } from "../../../lib/toast";
import type { Hospital } from "../../../types/hospital.type";
import {
  modalFooterCancelClassName,
  modalFooterPrimaryClassName,
  modalFooterRowClassName,
} from "../../../components/modals/modalFooterStyles";

const ModalHeader = ({
  title,
  icon: Icon,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
}) => (
  <DialogHeader className="flex flex-row items-center gap-2 p-4 border-b rounded-t-lg bg-[#e8f8f6]">
    <div className="flex items-center gap-2 p-[2px] rounded-[50px] bg-white">
      <Icon className="w-4 h-4 text-[#0D9488]" />
    </div>
    <DialogTitle className="text-sm font-semibold text-gray-700">
      {title}
    </DialogTitle>
  </DialogHeader>
);

interface ActivateHospitalModalProps {
  hospital: Hospital | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivated: () => void;
  activate: (hospitalId: string) => Promise<void>;
}

export const ActivateHospitalModal = ({
  hospital,
  open,
  onOpenChange,
  onActivated,
  activate,
}: ActivateHospitalModalProps): JSX.Element | null => {
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (!submitting) onOpenChange(false);
  };

  const handleConfirm = async () => {
    const id = hospital?._id;
    if (!id || submitting) return;
    setSubmitting(true);
    try {
      await activate(id);
      onActivated();
      onOpenChange(false);
    } catch (e) {
      showError(
        "Activation failed",
        e instanceof Error ? e.message : "Could not activate hospital.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!hospital) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 border-none overflow-hidden">
        <ModalHeader title="Activate hospital" icon={CheckCircle2} />
        <div className="px-[25px] pb-[25px] space-y-4">
          <p className="text-[14px] leading-relaxed text-gray-600">
            <strong className="text-black">{hospital.name}</strong>
            {hospital.city ? (
              <>
                {" "}
                · <span className="text-black">{hospital.city}</span>
              </>
            ) : null}{" "}
            will be marked <strong className="text-black">active</strong>.
            Staff can sign in and use the hospital again. Confirm to proceed.
          </p>
          <div className={modalFooterRowClassName}>
            <Button
              variant="ghost"
              className={modalFooterCancelClassName}
              onClick={handleClose}
              disabled={submitting}
              leadingIcon={<X className="h-4 w-4" />}
            >
              Close
            </Button>
            <Button
              className={modalFooterPrimaryClassName}
              onClick={() => void handleConfirm()}
              loading={submitting}
              leadingIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Activate hospital
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
