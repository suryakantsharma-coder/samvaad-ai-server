import { AlertTriangle, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { usePatient } from "../../contexts/PatientProvider";
import { PatientData } from "./AddPatientModal";
import {
  modalFooterCancelClassName,
  modalFooterDangerClassName,
  modalFooterRowClassName,
} from "./modalFooterStyles";

interface DeletePatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  patient: (PatientData & { _id?: string }) | null;
  patientName: string;
}

export const DeletePatientModal = ({
  open,
  onOpenChange,
  onDelete,
  patient,
  patientName,
}: DeletePatientModalProps): JSX.Element => {
  const { handleDeletePatient } = usePatient();
  const [submitting, setSubmitting] = useState(false);
  const handleDelete = async () => {
    const id = patient?._id;
    if (!id || submitting) return;
    setSubmitting(true);
    try {
      await handleDeletePatient(id);
      onDelete();
      onOpenChange(false);
    } catch {
      /* PatientProvider shows error toast */
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 border-none overflow-hidden gap-0">
        <DialogHeader className="flex flex-row items-center gap-2 p-4 border-b rounded-t-lg bg-[#FFF1F1]">
          <div className="flex items-center gap-2 p-[2px] rounded-[50px] bg-white">
            <AlertTriangle className="w-4 h-4 text-black" />
          </div>
          <DialogTitle className="text-sm font-semibold text-gray-700">
            Delete patient
          </DialogTitle>
        </DialogHeader>
        <div className="px-[25px] py-[25px] space-y-4">
          <p className="text-[14px] leading-relaxed text-gray-600">
            You&apos;re deleting{" "}
            <strong className="text-black">{patientName}</strong>&apos;s profile
            from the hospital database. This action will remove all associated
            appointments, prescriptions, and medical history permanently.
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
              onClick={() => void handleDelete()}
              loading={submitting}
              leadingIcon={<Trash2 className="h-4 w-4" />}
            >
              Delete patient
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
