import { Trash2Icon, XIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { usePatient } from "../../contexts/PatientProvider";
import { PatientData } from "./AddPatientModal";

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
  const handleDelete = () => {
    onDelete();
    handleDeletePatient(patient?._id || "");
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[550px] w-[90vw] p-0 gap-0 rounded-[10px]">
        <div className="px-5 py-5 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h3 className="font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] [font-style:var(--title-3m-font-style)]">
              You're deleting {patientName}'s profile from the hospital
              database.
            </h3>
            <p className="font-title-4r font-[number:var(--title-4r-font-weight)] text-x-70 text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
              This action will remove all associated appointments,
              prescriptions, and medical history permanently.
            </p>
          </div>

          <div className="flex justify-end gap-[15px]">
            <Button
              onClick={handleClose}
              variant="ghost"
              className="inline-flex items-center gap-[5px] px-[15px] py-1.5 bg-grey-light hover:bg-grey-light/80 rounded-[50px] h-[44px]"
            >
              <XIcon className="w-5 h-5" />
              <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                Close
              </span>
            </Button>
            <Button
              onClick={handleDelete}
              className="inline-flex items-center gap-[5px] px-[15px] py-1.5 bg-[#ff0004] hover:bg-[#ff0004]/90 rounded-[50px] h-[44px]"
            >
              <Trash2Icon className="w-5 h-5" />
              <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-white text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                Delete
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
