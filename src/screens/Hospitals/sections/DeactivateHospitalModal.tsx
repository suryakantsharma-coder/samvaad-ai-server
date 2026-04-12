import { useState, type ComponentType } from "react";
import { AlertTriangle, Ban, X } from "lucide-react";
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
  modalFooterDangerClassName,
  modalFooterRowClassName,
} from "../../../components/modals/modalFooterStyles";

const ModalHeader = ({
  title,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  variant?: "default" | "danger";
}) => (
  <DialogHeader
    className={`flex flex-row items-center gap-2 p-4 border-b rounded-t-lg ${
      variant === "danger" ? "bg-[#FFF1F1]" : "bg-[#F6F6F6]"
    }`}
  >
    <div className="flex items-center gap-2 p-[2px] rounded-[50px] bg-white">
      <Icon className="w-4 h-4 text-black" />
    </div>
    <DialogTitle className="text-sm font-semibold text-gray-700">
      {title}
    </DialogTitle>
  </DialogHeader>
);

interface DeactivateHospitalModalProps {
  hospital: Hospital | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeactivated: () => void;
  deactivate: (hospitalId: string) => Promise<void>;
}

export const DeactivateHospitalModal = ({
  hospital,
  open,
  onOpenChange,
  onDeactivated,
  deactivate,
}: DeactivateHospitalModalProps): JSX.Element => {
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (!submitting) onOpenChange(false);
  };

  const handleConfirm = async () => {
    const id = hospital?._id;
    if (!id || submitting) return;
    setSubmitting(true);
    try {
      await deactivate(id);
      onDeactivated();
      onOpenChange(false);
    } catch (e) {
      showError(
        "Deactivation failed",
        e instanceof Error ? e.message : "Could not deactivate hospital.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!hospital) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 border-none overflow-hidden">
        <ModalHeader
          title="Deactivate hospital"
          icon={AlertTriangle}
          variant="danger"
        />
        <div className="px-[25px] pb-[25px] space-y-4">
          <p className="text-[14px] leading-relaxed text-gray-600">
            <strong className="text-black">{hospital.name}</strong>
            {hospital.city ? (
              <>
                {" "}
                · <span className="text-black">{hospital.city}</span>
              </>
            ) : null}{" "}
            will be marked <strong className="text-black">inactive</strong>.
            Users may lose access until the hospital is reactivated. Please
            confirm to proceed.
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
              className={modalFooterDangerClassName}
              onClick={() => void handleConfirm()}
              loading={submitting}
              leadingIcon={<Ban className="h-4 w-4" />}
            >
              Deactivate hospital
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
