import { Download, Printer } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { PrescriptionHospitalDoctorInfo } from "../prescription/PrescriptionHospitalDoctorInfo";
import { PrescriptionMedicinesSection } from "../prescription/PrescriptionMedicinesSection";
import { formatDateTime12h } from "../../lib/dateTimeDisplay";
import {
  downloadPrescriptionReportPdf,
  openPrescriptionReportPdfInNewTab,
} from "../../lib/prescriptionPdf";
import {
  modalFooterOutlineClassName,
  modalFooterPrimaryClassName,
} from "./modalFooterStyles";
import { getDiagnosis } from "../../lib/prescriptionMeta";
import type { Prescription } from "../../types/prescription.type";

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
  const [pdfAction, setPdfAction] = useState<null | "print" | "download">(null);
  const pdfBusy = pdfAction !== null;

  const handleDownloadPdf = async () => {
    if (!prescription || pdfBusy) return;
    setPdfAction("download");
    try {
      await downloadPrescriptionReportPdf(prescription);
    } finally {
      setPdfAction(null);
    }
  };

  const handlePrintPdf = async () => {
    if (!prescription || pdfBusy) return;
    setPdfAction("print");
    try {
      await openPrescriptionReportPdfInNewTab(prescription);
    } finally {
      setPdfAction(null);
    }
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
              <PrescriptionHospitalDoctorInfo prescription={prescription} />

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="font-title-4r text-x-70 text-sm">Patient</p>
                  <p className="font-title-3m text-black text-lg break-words">
                    {prescription.patientName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    onClick={() => void handlePrintPdf()}
                    disabled={pdfBusy}
                    loading={pdfAction === "print"}
                    leadingIcon={<Printer className="h-4 w-4" />}
                    className={`${modalFooterOutlineClassName} shrink-0 font-title-4r`}
                  >
                    Print PDF
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleDownloadPdf()}
                    disabled={pdfBusy}
                    loading={pdfAction === "download"}
                    leadingIcon={<Download className="h-4 w-4" />}
                    className={`${modalFooterPrimaryClassName} shrink-0 font-title-4r`}
                  >
                    Download PDF
                  </Button>
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-title-4m text-x-70">Appointment date</dt>
                  <dd className="font-title-4r mt-0.5">
                    {formatDateTime12h(prescription.appointmentDate)}
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
                <div className="sm:col-span-2">
                  <dt className="font-title-4m text-x-70">Diagnosis</dt>
                  <dd className="font-title-4r mt-0.5">
                    {getDiagnosis(prescription)}
                  </dd>
                </div>
                {prescription.extraNotes?.trim() ? (
                  <div className="sm:col-span-2">
                    <dt className="font-title-4m text-x-70">Extra notes</dt>
                    <dd className="font-title-4r mt-0.5 whitespace-pre-wrap break-words">
                      {prescription.extraNotes}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <PrescriptionMedicinesSection medicines={prescription.medicines} />

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
