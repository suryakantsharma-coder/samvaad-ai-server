import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, Loader2, FileWarning } from "lucide-react";
import { Button } from "../../components/ui/button";
import { PrescriptionHospitalDoctorInfo } from "../../components/prescription/PrescriptionHospitalDoctorInfo";
import { PrescriptionMedicinesSection } from "../../components/prescription/PrescriptionMedicinesSection";
import { fetchPublicPrescription } from "../../data/publicPrescription";
import { formatDateTime12h } from "../../lib/dateTimeDisplay";
import { downloadPrescriptionReportPdf } from "../../lib/prescriptionPdf";
import { getDiagnosis } from "../../lib/prescriptionMeta";
import type { Prescription } from "../../types/prescription.type";
import { PublicBrandHeader } from "../../components/layout/PublicBrandHeader";

export const PublicPrescription = (): JSX.Element => {
  const { prescriptionId } = useParams<{ prescriptionId: string }>();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!prescriptionId?.trim()) {
      setLoading(false);
      setError("Invalid prescription link.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPublicPrescription(prescriptionId)
      .then((p) => {
        if (cancelled) return;
        if (!p) {
          setError("Prescription not found or no longer available.");
          setPrescription(null);
          return;
        }
        setPrescription(p);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load prescription.");
          setPrescription(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [prescriptionId]);

  const handleDownloadPdf = () => {
    if (prescription) downloadPrescriptionReportPdf(prescription);
  };

  return (
    <div className="bg-app-background w-full min-h-screen flex flex-col text-black">
      <PublicBrandHeader />
      <div className="flex flex-1 flex-col gap-[25px] p-4 md:p-6">
        <div className="max-w-2xl w-full mx-auto flex flex-col gap-6">
        <header className="flex flex-col items-start gap-[5px]">
          <h1 className="mt-[-1px] font-medium text-black text-[28px] sm:text-[40px] leading-[32px] sm:leading-[44px] [font-family:'Archivo',Helvetica] tracking-[0]">
            Prescription
          </h1>
          <p className="opacity-90 font-title-3l font-[number:var(--title-3l-font-weight)] text-black text-[length:var(--title-3l-font-size)] tracking-[var(--title-3l-letter-spacing)] leading-[var(--title-3l-line-height)] [font-style:var(--title-3l-font-style)] max-w-prose mt-[5px]">
            Medication schedule, dosage, and appointment details from your care
            provider.
          </p>
        </header>

        {loading && (
          <div className="flex items-center gap-3 rounded-[10px] border border-[#dedee1] bg-white p-8 justify-center">
            <Loader2 className="w-6 h-6 text-primary-2 animate-spin" />
            <span className="font-title-4r text-x-70">Loading prescription…</span>
          </div>
        )}

        {!loading && error && (
          <div
            className="flex items-start gap-3 rounded-[10px] border border-[#dedee1] bg-white p-6"
            role="alert"
          >
            <FileWarning className="w-6 h-6 text-[#dc2626] shrink-0 mt-0.5" />
            <div>
              <p className="font-title-4m text-black">Unable to load</p>
              <p className="font-title-4r text-x-70 mt-1">{error}</p>
            </div>
          </div>
        )}

        {!loading && prescription && (
          <div id="public-prescription-print-root" className="space-y-6">
            <div className="rounded-[10px] border border-[#dedee1] bg-white p-6 flex flex-col gap-6">
              <PrescriptionHospitalDoctorInfo prescription={prescription} />

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-title-4r text-x-70 text-sm">Patient</p>
                  <p className="font-title-3m text-black text-lg">
                    {prescription.patientName}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-2 px-5 py-2.5 h-auto rounded-[10px] bg-primary-2 hover:bg-primary-2/90 text-white font-title-4r"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
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
                      {prescription.followUp.value}{" "}
                      {prescription.followUp.unit}
                    </dd>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <dt className="font-title-4m text-x-70">Diagnosis</dt>
                  <dd className="font-title-4r mt-0.5">
                    {getDiagnosis(prescription)}
                  </dd>
                </div>
              </dl>

              <PrescriptionMedicinesSection
                medicines={prescription.medicines}
                headingClassName="font-title-3m text-base mb-3"
              />

              <p className="font-title-5r text-x-70 text-xs pt-2 border-t border-[#dedee1]">
                Reference ID: {prescription._id}
              </p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
