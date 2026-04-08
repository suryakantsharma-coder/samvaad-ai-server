import { jsPDF } from "jspdf";
import type {
  Prescription,
  PrescriptionDoctorInfo,
} from "../types/prescription.type";
import {
  decodeHtmlEntities,
  buildMedicineFrequencyLine,
  formatHospitalAddress,
  formatHospitalPhone,
  getDiagnosis,
  getDoctor,
  getHospital,
  getPatientAgeForPdf,
  getPatientDisplayName,
  getPatientGenderForPdf,
} from "./prescriptionMeta";
import { resolvePrescriptionDemographicsForPdf } from "./resolvePrescriptionForPdf";

/** Brand blue for titles and rules (approx. clinical template). */
const BLUE: [number, number, number] = [33, 89, 181];
const TEXT_GREY: [number, number, number] = [82, 82, 82];
const LINE_GREY: [number, number, number] = [200, 200, 200];

function formatPdfDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/** "Dr. Name, Designation" when designation exists; otherwise "Dr. Name". */
function formatDoctorNameWithDesignation(
  doctor: PrescriptionDoctorInfo | undefined,
): string {
  if (!doctor?.fullName?.trim()) return "";
  const name = `Dr. ${decodeHtmlEntities(doctor.fullName.trim())}`;
  const des = doctor.designation?.trim()
    ? decodeHtmlEntities(doctor.designation.trim())
    : "";
  return des ? `${name}, ${des}` : name;
}

/**
 * Prescription PDF: white page, blue header title & dividers, doctor/hospital header row,
 * patient name / age / gender / date (no address), Rx + medication body, signature footer.
 */
export async function downloadPrescriptionReportPdf(
  input: Prescription,
): Promise<void> {
  const rx = await resolvePrescriptionDemographicsForPdf(input);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = 16;

  const hospital = getHospital(rx);
  const doctor = getDoctor(rx);

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageH - 22) {
      doc.addPage();
      y = 16;
    }
  };

  const drawBlueRule = (yy: number) => {
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.7);
    doc.line(margin, yy, pageW - margin, yy);
  };

  const drawLightUnderline = (x: number, yy: number, width: number) => {
    doc.setDrawColor(...LINE_GREY);
    doc.setLineWidth(0.25);
    doc.line(x, yy + 0.8, x + width, yy + 0.8);
  };

  // --- Header: hospital name (center, blue, bold) ---
  doc.setTextColor(...BLUE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  const title = hospital?.name ?? "Medical Prescription";
  doc.text(title, pageW / 2, y, { align: "center" });
  y += 11;

  // --- Doctor left | Contact right (same 9pt grey tone) ---
  doc.setTextColor(...TEXT_GREY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const leftW = contentW * 0.56;
  const colGap = 6;
  const rightX = margin + leftW + colGap;
  const rightW = contentW - leftW - colGap;

  const drTitle = formatDoctorNameWithDesignation(doctor) || "—";
  const clinicAddr = hospital ? formatHospitalAddress(hospital) : "—";
  const leftBlock = `${drTitle}\n${clinicAddr}`;
  const leftLines = doc.splitTextToSize(leftBlock, leftW);

  const ph = hospital ? formatHospitalPhone(hospital) : "";
  const rightParts: string[] = [];
  if (ph) rightParts.push(`PH: ${ph}`);
  if (hospital?.email?.trim()) rightParts.push(`Email: ${hospital.email.trim()}`);
  else if (doctor?.email?.trim())
    rightParts.push(`Email: ${doctor.email.trim()}`);
  const rightText = rightParts.length ? rightParts.join("\n") : "";

  doc.text(leftLines, margin, y);
  if (rightText) {
    doc.text(doc.splitTextToSize(rightText, rightW), rightX, y);
  }

  const leftH = leftLines.length * 4.1;
  const rightH = rightText
    ? doc.splitTextToSize(rightText, rightW).length * 4.1
    : 0;
  y += Math.max(leftH, rightH) + 5;

  drawBlueRule(y);
  y += 7;

  // --- Patient details (no address): consistent 9pt grey labels, black values ---
  doc.setFontSize(9);
  const nameVal = getPatientDisplayName(rx);
  const ageVal = getPatientAgeForPdf(rx);
  const genderVal = getPatientGenderForPdf(rx);
  const dateVal = formatPdfDate(rx.appointmentDate);

  const row1Y = y;
  doc.setTextColor(...TEXT_GREY);
  doc.setFont("helvetica", "normal");
  doc.text("Patient Name:", margin, row1Y);
  doc.setTextColor(0, 0, 0);
  doc.text(nameVal, margin + 26, row1Y);
  drawLightUnderline(margin + 26, row1Y, 58);

  doc.setTextColor(...TEXT_GREY);
  doc.text("Age:", margin + 92, row1Y);
  doc.setTextColor(0, 0, 0);
  doc.text(ageVal, margin + 100, row1Y);
  drawLightUnderline(margin + 100, row1Y, 18);

  doc.setTextColor(...TEXT_GREY);
  doc.text("Gender:", margin + 128, row1Y);
  doc.setTextColor(0, 0, 0);
  doc.text(genderVal, margin + 142, row1Y);
  drawLightUnderline(margin + 142, row1Y, 38);

  y = row1Y + 6;

  doc.setTextColor(...TEXT_GREY);
  doc.text("Date:", margin, y);
  doc.setTextColor(0, 0, 0);
  doc.text(dateVal, margin + 26, y);
  drawLightUnderline(margin + 26, y, 45);
  y += 8;

  const dx = getDiagnosis(rx);
  if (dx && dx !== "—") {
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_GREY);
    doc.text("Diagnosis / notes:", margin, y);
    doc.setTextColor(0, 0, 0);
    const dxLines = doc.splitTextToSize(decodeHtmlEntities(dx), contentW - 38);
    doc.text(dxLines, margin + 38, y);
    y += dxLines.length * 3.8 + 4;
    doc.setFontSize(9);
  }

  drawBlueRule(y);
  y += 8;

  // --- Rx + medications ---
  const rxX = margin;
  doc.setTextColor(...TEXT_GREY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("Rx", rxX, y + 6);

  const medLeft = margin + 22;
  const medW = pageW - medLeft - margin;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  let medY = y + 12;
  (rx.medicines ?? []).forEach((m, i) => {
    ensureSpace(28);
    if (medY > pageH - 22) {
      doc.addPage();
      medY = 16;
    }
    const dosage = `${m.dosage?.value ?? ""} ${m.dosage?.unit ?? ""}`.trim();
    const duration = `${m.duration?.value ?? ""} ${m.duration?.unit ?? ""}`.trim();
    const block = [
      `${i + 1}. ${m.name}`,
      `Dosage: ${dosage || "—"}`,
      `Frequency: ${buildMedicineFrequencyLine(m)}`,
      `Duration: ${duration || "—"}`,
      m.notes?.trim()
        ? `Instructions: ${decodeHtmlEntities(m.notes.trim())}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
    const wrapped = doc.splitTextToSize(block, medW);
    doc.text(wrapped, medLeft, medY);
    medY += wrapped.length * 4.1 + 3;
  });

  if (!(rx.medicines ?? []).length) {
    doc.setTextColor(...TEXT_GREY);
    doc.text("—", medLeft, medY);
    medY += 6;
  }

  y = medY + 8;
  ensureSpace(35);
  drawBlueRule(y);
  y += 10;

  // --- Footer: Doctor's signature ---
  doc.setTextColor(...TEXT_GREY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Doctor's Signature:", margin, y);
  drawLightUnderline(margin + 42, y, 75);
  y += 10;

  doc.setTextColor(0, 0, 0);
  const drSignName = formatDoctorNameWithDesignation(doctor);
  if (drSignName) {
    doc.setFontSize(9);
    const signLines = doc.splitTextToSize(drSignName, contentW);
    doc.text(signLines, margin, y);
    y += signLines.length * 4.1;
  }

  doc.setFontSize(7);
  doc.setTextColor(130);
  doc.text(`Prescription ref: ${rx._id}`, margin, Math.min(y + 4, pageH - 10));

  const safeName = (rx.patientName || "prescription")
    .replace(/[^\w\s-]/g, "")
    .slice(0, 40);
  doc.save(`prescription-report-${safeName}-${rx._id.slice(-8)}.pdf`);
}

export function downloadPrescriptionPdf(rx: Prescription): void {
  void downloadPrescriptionReportPdf(rx);
}
