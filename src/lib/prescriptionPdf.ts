import { jsPDF } from "jspdf";
import type { Prescription } from "../types/prescription.type";
import {
  decodeHtmlEntities,
  buildMedicineFrequencyLine,
  formatHospitalAddress,
  formatHospitalPhone,
  getDiagnosis,
  getDoctor,
  getHospital,
  getPatientDisplayName,
} from "./prescriptionMeta";

/**
 * Formal prescription layout: hospital header, patient & diagnosis, medications, physician block.
 * Uses populated `hospital`, `patient`, `appointment`, and medicine `frequency` when present.
 */
export function downloadPrescriptionReportPdf(rx: Prescription): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 14;
  const innerW = pageW - margin * 2;
  let y = margin;

  const drawPageFrame = () => {
    doc.setFillColor(252, 250, 245);
    doc.rect(0, 0, pageW, pageH, "F");
    doc.setDrawColor(40, 100, 200);
    doc.setLineWidth(0.45);
    doc.rect(margin, margin, innerW, pageH - margin * 2, "S");
  };

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageH - margin - 10) {
      doc.addPage();
      y = margin;
      drawPageFrame();
    }
  };

  drawPageFrame();

  const hospital = getHospital(rx);
  const doctor = getDoctor(rx);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(hospital?.name ?? "Prescription", margin + 2, y + 6);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const addrLines = hospital
    ? doc.splitTextToSize(formatHospitalAddress(hospital), innerW - 4)
    : ["—"];
  doc.text(addrLines, margin + 2, y);
  y += Math.max(6, addrLines.length * 4.5);

  doc.setFontSize(9);
  doc.text(`Contact: ${hospital ? formatHospitalPhone(hospital) : "—"}`, margin + 2, y);
  y += 5;
  if (hospital?.registrationNumber) {
    doc.text(`Registration: ${hospital.registrationNumber}`, margin + 2, y);
    y += 5;
  }
  y += 3;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.line(margin + 2, y, margin + innerW - 2, y);
  y += 8;

  const addLabelValue = (label: string, value: string) => {
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${label}:`, margin + 2, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value, innerW - 52);
    doc.text(lines, margin + 42, y);
    y += Math.max(5, lines.length * 4.5);
  };

  addLabelValue("Patient Name", getPatientDisplayName(rx));
  addLabelValue("Diagnosis", getDiagnosis(rx));

  y += 4;
  ensureSpace(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Medication:", margin + 2, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  (rx.medicines ?? []).forEach((m, i) => {
    ensureSpace(36);
    const dosage = `${m.dosage?.value ?? ""} ${m.dosage?.unit ?? ""}`.trim();
    const duration = `${m.duration?.value ?? ""} ${m.duration?.unit ?? ""}`.trim();
    const block = [
      `${i + 1}. ${m.name}`,
      `Dosage: ${dosage || "—"}`,
      `Frequency: ${buildMedicineFrequencyLine(m)}`,
      `Duration: ${duration || "—"}`,
      m.notes?.trim() ? `Instructions: ${decodeHtmlEntities(m.notes.trim())}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    const wrapped = doc.splitTextToSize(block, innerW - 6);
    doc.text(wrapped, margin + 4, y);
    y += wrapped.length * 4.8 + 4;
  });

  y += 6;
  ensureSpace(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Physician Signature:", margin + 2, y);
  y += 6;
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.3);
  doc.line(margin + 2, y, margin + 75, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const drName = doctor?.fullName
    ? `Dr. ${doctor.fullName}`
    : "—";
  doc.text(drName, margin + 2, y);
  y += 6;

  if (doctor?.designation) {
    doc.text(
      `Designation: ${decodeHtmlEntities(doctor.designation)}`,
      margin + 2,
      y,
    );
    y += 5;
  }

  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`Prescription ref: ${rx._id}`, margin + 2, Math.min(y, pageH - margin - 4));

  const safeName = (rx.patientName || "prescription")
    .replace(/[^\w\s-]/g, "")
    .slice(0, 40);
  doc.save(`prescription-report-${safeName}-${rx._id.slice(-8)}.pdf`);
}

/** @deprecated Use {@link downloadPrescriptionReportPdf} for the full template; kept for imports. */
export function downloadPrescriptionPdf(rx: Prescription): void {
  downloadPrescriptionReportPdf(rx);
}
