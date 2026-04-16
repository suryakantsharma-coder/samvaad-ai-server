import { jsPDF } from "jspdf";
import type {
  Prescription,
  PrescriptionDoctorInfo,
  PrescriptionHospital,
} from "../types/prescription.type";
import { API_BASE_URL } from "../config";
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
import {
  resolvePrescriptionDemographicsForPdf,
  resolvePrescriptionHospitalLogoForPdf,
} from "./resolvePrescriptionForPdf";
import { showError } from "./toast";

/** ~10px at 96dpi → mm (extra space above doctor signature vs blue rule). */
const SIGNATURE_RULE_TOP_EXTRA_MM = (10 * 25.4) / 96;

/** ~4px at 96dpi → mm (extra vertical breathing room in header). */
const HEADER_EXTRA_V_MM = (4 * 25.4) / 96;
/** jsPDF default lineHeightFactor is ~1.15; bump so wrapped header lines match taller pitch. */
const HEADER_LINE_HEIGHT_FACTOR = 1.15 + HEADER_EXTRA_V_MM / 4.1;

/** Brand blue for titles and rules (approx. clinical template). */
const BLUE: [number, number, number] = [33, 89, 181];
const TEXT_GREY: [number, number, number] = [82, 82, 82];
const LINE_GREY: [number, number, number] = [200, 200, 200];

/** Space reserved at bottom: signature block + ref + powered-by line. */
const FOOTER_RESERVED_MM = 56 + SIGNATURE_RULE_TOP_EXTRA_MM;

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

function hospitalLogoAbsoluteUrl(
  hospital: PrescriptionHospital | undefined,
): string | null {
  const raw = hospital?.logoUrl?.trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return raw.startsWith("/") ? `${API_BASE_URL}${raw}` : `${API_BASE_URL}/${raw}`;
}

/** Only the hospital logo from the database (`logoUrl`); no default brand image. */
function prescriptionLogoUrlCandidates(
  hospital: PrescriptionHospital | undefined,
): string[] {
  const h = hospitalLogoAbsoluteUrl(hospital);
  return h ? [h] : [];
}

function rasterizeLoadedImage(
  img: HTMLImageElement,
  maxWidthPx: number,
): { dataUrl: string; width: number; height: number } | null {
  try {
    const scale = Math.min(1, maxWidthPx / Math.max(1, img.width));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    return { dataUrl: canvas.toDataURL("image/png"), width: w, height: h };
  } catch {
    return null;
  }
}

function decodeImageFromSrc(
  src: string,
  crossOrigin: "anonymous" | undefined,
): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Rasterize remote/local image to PNG for jsPDF (WebP/JPEG/PNG; SVG when the browser decodes it).
 * For URLs under `API_BASE_URL`, tries Bearer fetch first so protected `/uploads/...` works when
 * the dashboard runs on a different origin than the API.
 */
async function rasterizeImageUrlToPng(
  url: string,
  maxWidthPx: number,
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  if (typeof window === "undefined") return null;

  const apiBase = API_BASE_URL.replace(/\/$/, "");
  const token = localStorage.getItem("token");

  if (token && url.startsWith(apiBase)) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        try {
          const img = await decodeImageFromSrc(objUrl, undefined);
          if (img) {
            const r = rasterizeLoadedImage(img, maxWidthPx);
            if (r) return r;
          }
        } finally {
          URL.revokeObjectURL(objUrl);
        }
      }
    } catch {
      /* fall through to <img> paths */
    }
  }

  for (const cors of ["anonymous", undefined] as const) {
    const img = await decodeImageFromSrc(url, cors);
    if (img) {
      const r = rasterizeLoadedImage(img, maxWidthPx);
      if (r) return r;
    }
  }
  return null;
}

async function drawTopLeftHospitalLogo(
  doc: jsPDF,
  hospital: PrescriptionHospital | undefined,
  margin: number,
  logoTopMm: number,
  maxWMm: number,
  maxHMm: number,
): Promise<number> {
  if (typeof window === "undefined") return logoTopMm;
  const maxWidthPx = Math.max(80, Math.round((maxWMm / 25.4) * 96));
  for (const url of prescriptionLogoUrlCandidates(hospital)) {
    const raster = await rasterizeImageUrlToPng(url, maxWidthPx);
    if (!raster) continue;
    let wMm = (raster.width / 96) * 25.4;
    let hMm = (raster.height / 96) * 25.4;
    if (wMm > maxWMm) {
      const s = maxWMm / wMm;
      wMm *= s;
      hMm *= s;
    }
    if (hMm > maxHMm) {
      const s = maxHMm / hMm;
      wMm *= s;
      hMm *= s;
    }
    try {
      doc.addImage(raster.dataUrl, "PNG", margin, logoTopMm, wMm, hMm);
      return logoTopMm + hMm + 3;
    } catch {
      /* try next candidate */
    }
  }
  return logoTopMm;
}

async function buildPrescriptionPdfDocument(
  input: Prescription,
): Promise<jsPDF> {
  const rx = await resolvePrescriptionHospitalLogoForPdf(
    await resolvePrescriptionDemographicsForPdf(input),
  );
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const contentW = pageW - margin * 2;

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

  const logoTop = 8;
  const titleStartY = await drawTopLeftHospitalLogo(
    doc,
    hospital,
    margin,
    logoTop,
    48,
    13,
  );

  let y = Math.max(titleStartY, logoTop + 2);

  doc.setTextColor(...BLUE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  const title = hospital?.name ?? "Medical Prescription";
  const titleLines = doc.splitTextToSize(title, contentW);
  const titleLinePitchMm = 6.4;
  titleLines.forEach((line, i) => {
    doc.text(line, pageW / 2, y + i * titleLinePitchMm, { align: "center" });
  });
  y +=
    (titleLines.length > 1 ? (titleLines.length - 1) * titleLinePitchMm : 0) +
    11 +
    HEADER_EXTRA_V_MM;

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

  const rxX = margin;
  doc.setTextColor(...TEXT_GREY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("Rx", rxX, y + 6);

  const medLeft = margin + 22;
  const medW = pageW - medLeft - margin;
  const contentBottomY = pageH - FOOTER_RESERVED_MM;
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

  const refBaseline = pageH - 10;
  const poweredByBaseline = pageH - 4.5;
  const nameLineHeight = 4.15;

  doc.setFont("helvetica", "normal");
  const drSignName = formatDoctorNameWithDesignation(doctor);
  const signLines = drSignName
    ? doc.splitTextToSize(drSignName, contentW)
    : [];

  const nameFirstBaseline =
    signLines.length > 0
      ? refBaseline - 5 - (signLines.length - 1) * nameLineHeight
      : refBaseline - 5;

  const labelStr = "Doctor's Signature:";
  const labelY = nameFirstBaseline - 8;

  const footerRuleY = labelY - (6 + SIGNATURE_RULE_TOP_EXTRA_MM);
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

  doc.setFontSize(5.5);
  doc.setTextColor(160, 160, 160);
  doc.setFont("helvetica", "normal");
  doc.text("Powered by Samvaad AI", pageW / 2, poweredByBaseline, {
    align: "center",
  });

  return doc;
}

/**
 * Prescription PDF: Sarvodaya/hospital logo top-left, hospital title, body, signature,
 * ref id, and small “Powered by Samvaad AI” footer.
 */
export async function downloadPrescriptionReportPdf(
  input: Prescription,
): Promise<void> {
  try {
    const doc = await buildPrescriptionPdfDocument(input);
    const idSuffix =
      input._id && typeof input._id === "string" && input._id.length >= 8
        ? input._id.slice(-8)
        : "export";
    const rawName = (input.patientName || "prescription").trim() || "prescription";
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

export async function openPrescriptionReportPdfInNewTab(
  input: Prescription,
): Promise<void> {
  try {
    const doc = await buildPrescriptionPdfDocument(input);
    const blobUrl = doc.output("bloburl");
    window.open(blobUrl, "_blank", "noopener,noreferrer");
  } catch (err) {
    console.error("Prescription PDF open failed:", err);
    const detail =
      err instanceof Error ? err.message : "Unexpected error while building PDF.";
    showError("Print failed", `${detail} Please retry.`);
  }
}

export function downloadPrescriptionPdf(rx: Prescription): void {
  void downloadPrescriptionReportPdf(rx);
}
