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
  getDoctor,
  getHospital,
  getPatientAgeForPdf,
  getPatientDisplayName,
  getPatientGenderForPdf,
} from "./prescriptionMeta";
import { resolvePrescriptionDemographicsForPdf } from "./resolvePrescriptionForPdf";
import { showError } from "./toast";

/** ~4px at 96dpi → mm (extra vertical breathing room in header). */
const HEADER_EXTRA_V_MM = (4 * 25.4) / 96;
/** jsPDF default lineHeightFactor is ~1.15; bump so wrapped header lines match taller pitch. */
const HEADER_LINE_HEIGHT_FACTOR = 1.15 + HEADER_EXTRA_V_MM / 4.1;

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
  try {
  const rx = await resolvePrescriptionDemographicsForPdf(input);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = 16;

  const hospital = getHospital(rx);
  const doctor = getDoctor(rx);

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
  y += 11 + HEADER_EXTRA_V_MM;

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

  doc.text(leftLines, margin, y, {
    lineHeightFactor: HEADER_LINE_HEIGHT_FACTOR,
  });
  if (rightText) {
    doc.text(doc.splitTextToSize(rightText, rightW), rightX, y, {
      lineHeightFactor: HEADER_LINE_HEIGHT_FACTOR,
    });
  }

  const headerLinePitch = 4.1 + HEADER_EXTRA_V_MM;
  const leftH = leftLines.length * headerLinePitch;
  const rightH = rightText
    ? doc.splitTextToSize(rightText, rightW).length * headerLinePitch
    : 0;
  y += Math.max(leftH, rightH) + 5 + HEADER_EXTRA_V_MM;

  drawBlueRule(y);
  y += 7 + HEADER_EXTRA_V_MM;

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
  /** Space reserved at bottom for signature block + ref (keep meds out of this zone). */
  const footerReservedMm = 48;
  const contentBottomY = pageH - footerReservedMm;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  let medY = y + 12;
  (rx.medicines ?? []).forEach((m, i) => {
    const dosage = `${m.dosage?.value ?? ""} ${m.dosage?.unit ?? ""}`.trim();
    const duration = `${m.duration?.value ?? ""} ${m.duration?.unit ?? ""}`.trim();
    const medName = String(m?.name ?? "—").trim() || "—";
    const block = [
      `${i + 1}. ${medName}`,
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
    const blockHeight = wrapped.length * 4.1 + 3;
    if (medY + blockHeight > contentBottomY) {
      doc.addPage();
      medY = 16;
    }
    doc.text(wrapped, medLeft, medY);
    medY += blockHeight;
  });

  if (!(rx.medicines ?? []).length) {
    doc.setTextColor(...TEXT_GREY);
    doc.text("—", medLeft, medY);
    medY += 6;
  }

  // --- Footer: fixed layout from bottom (label + line align; name; ref) ---
  const refBaseline = pageH - 9;
  const nameLineHeight = 4.15;

  doc.setFont("helvetica", "normal");
  const drSignName = formatDoctorNameWithDesignation(doctor);
  const signLines = drSignName
    ? doc.splitTextToSize(drSignName, contentW)
    : [];

  /** Last line of name sits ~5mm above ref baseline. */
  const nameFirstBaseline =
    signLines.length > 0
      ? refBaseline - 5 - (signLines.length - 1) * nameLineHeight
      : refBaseline - 5;

  const labelStr = "Doctor's Signature:";
  const labelY = nameFirstBaseline - 8;

  const footerRuleY = labelY - 6;
  drawBlueRule(footerRuleY);

  doc.setFontSize(9);
  doc.setTextColor(...TEXT_GREY);
  doc.text(labelStr, margin, labelY);
  const labelW = doc.getTextWidth(labelStr);
  doc.setDrawColor(...LINE_GREY);
  doc.setLineWidth(0.25);
  doc.line(margin + labelW + 2, labelY + 0.9, pageW - margin, labelY + 0.9);

  if (drSignName) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(signLines, margin, nameFirstBaseline);
  }

  doc.setFontSize(7);
  doc.setTextColor(130);
  doc.text(`Prescription ref: ${rx._id}`, pageW - margin, refBaseline, {
    align: "right",
    maxWidth: 100,
  });

  const idSuffix =
    rx._id && typeof rx._id === "string" && rx._id.length >= 8
      ? rx._id.slice(-8)
      : "export";
  const rawName = (rx.patientName || "prescription").trim() || "prescription";
  const safeName = rawName.replace(/[^\w\s-]/g, "").trim() || "prescription";
  doc.save(`prescription-report-${safeName}-${idSuffix}.pdf`);
  } catch (err) {
    console.error("Prescription PDF generation failed:", err);
    const detail =
      err instanceof Error ? err.message : "Unexpected error while building PDF.";
    showError(
      "Download failed",
      `${detail} If your disk is full, free space and try again.`,
    );
  }
}

export function downloadPrescriptionPdf(rx: Prescription): void {
  void downloadPrescriptionReportPdf(rx);
}
