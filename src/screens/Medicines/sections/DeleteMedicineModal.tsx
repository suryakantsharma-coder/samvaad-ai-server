import { useState, type ComponentType } from "react";
import { AlertTriangle, Trash2Icon, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { deleteMedicine } from "../../../data/medicines";
import { showError } from "../../../lib/toast";
import type { MedicineCatalogRow } from "../../../types/medicineCatalog.type";
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

interface DeleteMedicineModalProps {
  medicine: MedicineCatalogRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: string) => void;
}

export const DeleteMedicineModal = ({
  medicine,
  open,
  onOpenChange,
  onDeleted,
}: DeleteMedicineModalProps): JSX.Element => {
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (!submitting) onOpenChange(false);
  };

  const handleConfirm = async () => {
    const id = medicine?._id;
    if (!id || submitting) return;
    setSubmitting(true);
    try {
      await deleteMedicine(id);
      onDeleted(id);
      onOpenChange(false);
    } catch (e) {
      showError(
        "Delete failed",
        e instanceof Error ? e.message : "Could not delete medicine.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 border-none overflow-hidden">
        <ModalHeader
          title="Delete medicine"
          icon={AlertTriangle}
          variant="danger"
        />
        <div className="px-[25px] pb-[25px] space-y-4">
          <p className="text-[14px] leading-relaxed text-gray-600">
            <strong className="text-black">{medicine?.name ?? "This medicine"}</strong>
            {medicine?.medicineId ? (
              <>
                {" "}
                (<span className="text-black">{medicine.medicineId}</span>)
              </>
            ) : null}
            {medicine?.type ? (
              <>
                {" "}
                · Type: <strong className="text-black">{medicine.type}</strong>
              </>
            ) : null}{" "}
            will be permanently removed from the catalog. This cannot be undone.
            Please confirm to proceed.
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
              leadingIcon={<Trash2Icon className="h-4 w-4" />}
            >
              Delete medicine
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
