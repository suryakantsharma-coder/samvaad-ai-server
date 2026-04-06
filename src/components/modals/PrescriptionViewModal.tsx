import { Download } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { downloadPrescriptionPdf } from "../../lib/prescriptionPdf";
import type { Prescription } from "../../types/prescription.type";

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

interface PrescriptionViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: Prescription | null;
}

export const PrescriptionViewModal = ({
  open,
  onOpenChange,
  prescription,
}: PrescriptionViewModalProps): JSX.Element => {
  const handleDownloadPdf = () => {
    if (prescription) downloadPrescriptionPdf(prescription);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 border-[#dedee1] overflow-hidden">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-[#dedee1] text-left">
          <DialogTitle className="font-title-3m text-black text-lg">
            Prescription record
          </DialogTitle>
          <p className="font-title-4r text-x-70 text-sm font-normal pt-1">
            Medication schedule, dosage, and follow-up for this visit.
          </p>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          {prescription && (
            <div className="rounded-[10px] border border-[#dedee1] bg-white p-5 flex flex-col gap-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="font-title-4r text-x-70 text-sm">Patient</p>
                  <p className="font-title-3m text-black text-lg break-words">
                    {prescription.patientName}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-2 px-5 py-2.5 h-auto rounded-[10px] bg-primary-2 hover:bg-primary-2/90 text-white font-title-4r shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-title-4m text-x-70">Appointment date</dt>
                  <dd className="font-title-4r mt-0.5">
                    {formatDate(prescription.appointmentDate)}
                  </dd>
                </div>
                {prescription.followUp && (
                  <div>
                    <dt className="font-title-4m text-x-70">Follow-up</dt>
                    <dd className="font-title-4r mt-0.5">
                      {prescription.followUp.value} {prescription.followUp.unit}
                    </dd>
                  </div>
                )}
              </dl>

              <div>
                <h2 className="font-title-3m text-base mb-3">Medicines</h2>
                <ul className="space-y-3">
                  {(prescription.medicines ?? []).map((m, i) => (
                    <li
                      key={`${m.name}-${i}`}
                      className="rounded-[10px] border border-[#dedee1] p-4 bg-grey-light/20"
                    >
                      <p className="font-title-4m text-black">{m.name}</p>
                      <p className="font-title-4r text-x-70 text-sm mt-1">
                        {m.dosage?.value} {m.dosage?.unit} · {m.duration?.value}{" "}
                        {m.duration?.unit} · {m.intake}
                        {(m.time?.breakfast ||
                          m.time?.lunch ||
                          m.time?.dinner) && (
                          <span>
                            {" "}
                            ·{" "}
                            {[
                              m.time?.breakfast && "Breakfast",
                              m.time?.lunch && "Lunch",
                              m.time?.dinner && "Dinner",
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        )}
                      </p>
                      {m.notes && (
                        <p className="font-title-4r text-sm mt-2 text-x-70">
                          {m.notes}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="font-title-5r text-x-70 text-xs pt-2 border-t border-[#dedee1]">
                Reference ID: {prescription._id}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
