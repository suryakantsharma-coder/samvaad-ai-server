import { CircleCheck, FileText, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import {
  modalFooterCancelClassName,
  modalFooterPrimaryClassName,
  modalFooterRowClassName,
  modalHeaderCloseButtonClassName,
} from "./modalFooterStyles";
import {
  addObservationEntry,
  createObservation,
  searchObservationsByPatient,
} from "../../data/observation";
import { showError, showSuccess } from "../../lib/toast";

interface ObservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
}

interface ObservationSearchResponse {
  data?: {
    observation?: { _id?: string };
    observations?: Array<{ _id?: string }>;
    items?: Array<{ _id?: string }>;
  };
}

function resolveObservationId(payload: ObservationSearchResponse): string | null {
  const direct = payload?.data?.observation?._id;
  if (direct) return direct;
  const firstFromList = payload?.data?.observations?.[0]?._id;
  if (firstFromList) return firstFromList;
  const firstFromItems = payload?.data?.items?.[0]?._id;
  if (firstFromItems) return firstFromItems;
  return null;
}

export const ObservationModal = ({
  open,
  onOpenChange,
  patientId,
  patientName,
}: ObservationModalProps): JSX.Element => {
  const [submitting, setSubmitting] = useState(false);
  const [observationText, setObservationText] = useState("");

  useEffect(() => {
    if (!open) return;
    setObservationText("");
  }, [open]);

  const handleClose = () => {
    if (submitting) return;
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    const trimmedText = observationText.trim();
    if (!patientId.trim()) {
      showError("Error", "Patient not selected.");
      return;
    }
    if (!trimmedText) {
      showError("Validation", "Please enter an observation.");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      const time = new Date().toISOString();
      const search = (await searchObservationsByPatient(
        patientId,
      )) as ObservationSearchResponse;
      const observationId = resolveObservationId(search);

      if (observationId) {
        await addObservationEntry(observationId, { text: trimmedText, time });
      } else {
        await createObservation({
          patientId,
          observations: [{ text: trimmedText, time }],
        });
      }

      showSuccess("Success!", "Observation saved successfully.");
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save observation";
      showError("Error", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] w-[90vw] p-0 gap-0 rounded-[10px] border border-[#dedee1] overflow-hidden [&>button]:hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between gap-2 px-5 py-4 border-b border-[#dedee1] bg-grey-light rounded-t-[10px]">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center p-[2px] rounded-[50px] bg-white border border-[#dedee1]">
              <FileText className="w-4 h-4 text-black" />
            </div>
            <DialogTitle className="font-title-3m text-sm font-semibold text-gray-700">
              Add Observation
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className={modalHeaderCloseButtonClassName}
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </DialogHeader>

        <div className="px-5 py-5 flex flex-col gap-[15px] overflow-y-auto">
          <div className="rounded-[10px] border border-[#dedee1] bg-[#F8F8F8] px-3 py-2">
            <p className="font-title-5l text-[#57575f] text-sm">
              Patient:{" "}
              <span className="font-title-4m text-black">
                {patientName || "Unknown"}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-title-4m text-black">
              Observation<span className="text-[#ff0004]">*</span>
            </label>
            <textarea
              value={observationText}
              onChange={(e) => setObservationText(e.target.value)}
              placeholder="Type patient observation..."
              rows={5}
              className="w-full rounded-[10px] border border-[#dedee1] bg-white px-4 py-2 text-sm text-black placeholder:text-x-70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className={modalFooterRowClassName}>
            <Button
              onClick={handleClose}
              variant="ghost"
              disabled={submitting}
              className={modalFooterCancelClassName}
              leadingIcon={<X className="h-4 w-4" />}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              loading={submitting}
              className={modalFooterPrimaryClassName}
              leadingIcon={<CircleCheck className="h-4 w-4" />}
            >
              Save Observation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
