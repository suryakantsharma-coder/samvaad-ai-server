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
  getPatientPhoneForPdf,
  getPatientWeightForPdf,
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

/** Space reserved at bottom: signature block + ref + brand logo strip. */
const FOOTER_RESERVED_MM = 56 + SIGNATURE_RULE_TOP_EXTRA_MM;
/** Shared body typography for medicine and extra notes in prescription PDFs. */
const PRESCRIPTION_BODY_FONT_PT = 10.5;
const PRESCRIPTION_BODY_LINE_MM = 4.8;

/** Same asset as auth header (`AuthSplitLayout`): `public/Logo-light-bg.svg`. */
const SAMVAAD_BRAND_LOGO_PATH = "/Logo-light-bg.svg";

function samvaadBrandLogoAbsoluteUrl(): string | null {
  if (typeof window === "undefined") return null;
  return `${window.location.origin}${SAMVAAD_BRAND_LOGO_PATH}`;
}

/** Footer “Powered by” font size (pt); used for vertical centering math. */
const FOOTER_BRAND_FONT_PT = 6.8;

/**
 * “Powered by” + Samvaad mark as one row, bottom-centered, vertically centered as a pair (items-center).
 * Same asset as login header; SVG → PNG for jsPDF.
 */
async function drawFooterSamvaadLogo(
  doc: jsPDF,
  pageW: number,
  rowBottomMm: number,
  maxWMm: number,
  maxHMm: number,
): Promise<void> {
  const label = "Powered by ";
  doc.setFontSize(FOOTER_BRAND_FONT_PT);
  doc.setTextColor(160, 160, 160);
  doc.setFont("helvetica", "normal");
  const labelW = doc.getTextWidth(label);
  const gapMm = 1.2;

  let wMm = 0;
  let hMm = 0;
  let pngDataUrl: string | null = null;
  const url = samvaadBrandLogoAbsoluteUrl();
  if (url) {
    const maxWidthPx = Math.max(64, Math.round((maxWMm / 25.4) * 96));
    try {
      const raster = await rasterizeImageUrlToPng(url, maxWidthPx);
      if (raster) {
        pngDataUrl = raster.dataUrl;
        wMm = (raster.width / 96) * 25.4;
        hMm = (raster.height / 96) * 25.4;
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
      }
    } catch {
      /* text-only footer below */
    }
  }

  const fontMm = (FOOTER_BRAND_FONT_PT * 25.4) / 72;
  /** Line box height ≈ one line of footer text (align with logo height). */
  const textLineMm = fontMm * 1.2;
  const rowH = pngDataUrl ? Math.max(hMm, textLineMm) : textLineMm;
  const midY = rowBottomMm - rowH / 2;
  /** jsPDF draws text on baseline; optical vertical center sits above baseline (~x-height center). */
  const textBaselineY = midY + 0.36 * fontMm;

  const groupW = pngDataUrl ? labelW + gapMm + wMm : labelW;
  const startX = pageW / 2 - groupW / 2;

  doc.text(label, startX, textBaselineY);
  if (pngDataUrl) {
    const imgTopY = midY - hMm / 2;
    doc.addImage(pngDataUrl, "PNG", startX + labelW + gapMm, imgTopY, wMm, hMm);
  }
}

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

function hospitalLogoAbsoluteUrlCandidates(
  hospital: PrescriptionHospital | undefined,
): string[] {
  const raw = hospital?.logoUrl?.trim();
  if (!raw) return [];
  if (raw.startsWith("http://") || raw.startsWith("https://")) return [raw];

  const base = API_BASE_URL.replace(/\/$/, "");
  const clean = raw.replace(/^\/+/, "");
  const pathVariants = new Set<string>();

  console.log("base", base);
  console.log("clean", clean);
  console.log("pathVariants", pathVariants);

  // Stored as full relative path (common): "/uploads/hospitals/x.png" or "uploads/hospitals/x.png"
  pathVariants.add(`/${clean}`);

  // Stored as filename only (common in prod DB migrations/uploads): "x.png"
  if (!clean.startsWith("uploads/")) {
    pathVariants.add(`/uploads/${clean}`);
    pathVariants.add(`/uploads/hospitals/${clean}`);
  }

  console.log("pathVariants", pathVariants);
  console.log(
    "Array.from(pathVariants).map((p) => `${base}${encodeURI(p)}`",
    Array.from(pathVariants).map((p) => `${base}${encodeURI(p)}`),
  );

  return Array.from(pathVariants).map((p) => `${base}${encodeURI(p)}`);
}

/** Only hospital logo candidates from DB `logoUrl`; no default brand image. */
function prescriptionLogoUrlCandidates(
  hospital: PrescriptionHospital | undefined,
): string[] {
  return hospitalLogoAbsoluteUrlCandidates(hospital);
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

/** In dev, rewrite API URLs to `/api-proxy/...` so `fetch` is same-origin (see `vite.config.ts`). */
function urlForPdfImageFetch(url: string): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  if (!url.startsWith(base)) return url;
  const path = url.slice(base.length) || "/";
  if (import.meta.env.DEV) {
    return `/api-proxy${path.startsWith("/") ? path : `/${path}`}`;
  }
  return url;
}

async function fetchImageBlobForPdf(url: string): Promise<Blob | null> {
  if (typeof window === "undefined") return null;
  const apiBase = API_BASE_URL.replace(/\/$/, "");
  const token = localStorage.getItem("token");
  const fetchUrl = urlForPdfImageFetch(url);

  if (token && url.startsWith(apiBase)) {
    try {
      const res = await fetch(fetchUrl, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) return await res.blob();
    } catch {
      /* fall through */
    }
  }
  try {
    const res = await fetch(fetchUrl, {
      mode: "cors",
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) return await res.blob();
  } catch {
    /* fall through */
  }
  try {
    const res = await fetch(fetchUrl, { mode: "cors", cache: "no-store" });
    if (res.ok) return await res.blob();
  } catch {
    /* fall through */
  }
  return null;
}

/** Center-crop to square, PNG data URL (pixels from Blob are not canvas-tainted). */
async function squareCropBlobToPngDataUrl(
  blob: Blob,
  targetPx: number,
): Promise<string | null> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob);
      try {
        const iw = bitmap.width;
        const ih = bitmap.height;
        if (iw < 1 || ih < 1) return null;
        const side = Math.min(iw, ih);
        const sx = (iw - side) / 2;
        const sy = (ih - side) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = targetPx;
        canvas.height = targetPx;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, targetPx, targetPx);
        return canvas.toDataURL("image/png");
      } finally {
        bitmap.close();
      }
    } catch {
      /* fall through */
    }
  }
  const objUrl = URL.createObjectURL(blob);
  try {
    const img = await decodeImageFromSrc(objUrl, undefined);
    if (!img) return null;
    return squareCropImageToPngDataUrl(img, targetPx);
  } finally {
    URL.revokeObjectURL(objUrl);
  }
}

function squareCropImageToPngDataUrl(
  img: HTMLImageElement,
  targetPx: number,
): string | null {
  try {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (iw < 1 || ih < 1) return null;
    const side = Math.min(iw, ih);
    const sx = (iw - side) / 2;
    const sy = (ih - side) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = targetPx;
    canvas.height = targetPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, sx, sy, side, side, 0, 0, targetPx, targetPx);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/**
 * Load hospital logo URL into PDF as a square (center crop). Prefers fetch→Blob; falls back to
 * `Image` + `crossOrigin = "anonymous"` (your snippet) when CORS allows.
 */
async function addHospitalLogoSquareToPdf(
  doc: jsPDF,
  url: string,
  x: number,
  y: number,
  widthMm: number,
): Promise<boolean> {
  if (typeof window === "undefined" || !url.trim()) return false;
  const targetPx = Math.max(64, Math.round((widthMm / 25.4) * 96));
  const trimmed = url.trim();

  const blob = await fetchImageBlobForPdf(trimmed);
  if (blob) {
    const dataUrl = await squareCropBlobToPngDataUrl(blob, targetPx);
    if (dataUrl) {
      try {
        doc.addImage(dataUrl, "PNG", x, y, widthMm, widthMm);
        return true;
      } catch {
        /* fall through */
      }
    }
  }

  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = urlForPdfImageFetch(trimmed);
  });
  if (img) {
    const dataUrl = squareCropImageToPngDataUrl(img, targetPx);
    if (dataUrl) {
      try {
        doc.addImage(dataUrl, "PNG", x, y, widthMm, widthMm);
        return true;
      } catch {
        return false;
      }
    }
  }

  const raster = await rasterizeImageUrlToPng(trimmed, targetPx * 2);
  if (!raster?.dataUrl) return false;
  try {
    const im = await decodeImageFromSrc(raster.dataUrl, undefined);
    if (!im) return false;
    const sq = squareCropImageToPngDataUrl(im, targetPx);
    if (!sq) return false;
    doc.addImage(sq, "PNG", x, y, widthMm, widthMm);
    return true;
  } catch {
    return false;
  }
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
  const fetchUrl = urlForPdfImageFetch(url);

  if (token && url.startsWith(apiBase)) {
    try {
      const res = await fetch(fetchUrl, {
        cache: "no-store",
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

  const imgSrc = urlForPdfImageFetch(url);
  for (const cors of ["anonymous", undefined] as const) {
    const img = await decodeImageFromSrc(imgSrc, cors);
    if (img) {
      const r = rasterizeLoadedImage(img, maxWidthPx);
      if (r) return r;
    }
  }
  return null;
}

/** Hospital header logo: 50×50 px at 96 dpi → square side in mm for jsPDF. */
const HOSPITAL_HEADER_LOGO_SIZE_PX = 50;
const TOP_LEFT_HOSPITAL_LOGO_SQUARE_MM =
  (HOSPITAL_HEADER_LOGO_SIZE_PX * 25.4) / 96;
/** 20px gap between logo and hospital name (≈5.29 mm at 96 dpi). */
const HOSPITAL_HEADER_LOGO_TEXT_GAP_MM = (20 * 25.4) / 96;

/**
 * Centered header row: [logo] — 20px — [hospital name], vertically centered as one unit.
 * Returns Y (mm) for the line below the title block (same convention as before).
 */
async function drawHospitalHeaderBranding(
  doc: jsPDF,
  hospital: PrescriptionHospital | undefined,
  margin: number,
  contentW: number,
  pageW: number,
  logoTopMm: number,
  titleOverride?: string,
): Promise<number> {
  doc.setTextColor(...BLUE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  const title = titleOverride ?? hospital?.name ?? "Medical Prescription";
  const titleLinePitchMm = 6.4;
  const logoSide = TOP_LEFT_HOSPITAL_LOGO_SQUARE_MM;
  const gapMm = HOSPITAL_HEADER_LOGO_TEXT_GAP_MM;
  const fontHeightMm = (doc.getFontSize() * 25.4) / 72;

  const finishBlock = (firstBaselineY: number, lineCount: number): number =>
    firstBaselineY +
    (lineCount > 1 ? (lineCount - 1) * titleLinePitchMm : 0) +
    11 +
    HEADER_EXTRA_V_MM;

  const logoUrls = prescriptionLogoUrlCandidates(hospital);
  if (logoUrls.length && typeof window !== "undefined") {
    const maxTitleW = Math.max(8, contentW - gapMm - logoSide);
    const titleLinesNarrow = doc.splitTextToSize(title, maxTitleW);
    const textWidth = Math.max(
      ...titleLinesNarrow.map((l: string) => doc.getTextWidth(l)),
    );
    const groupW = logoSide + gapMm + textWidth;
    const groupLeft = margin + (contentW - groupW) / 2;
    let logoPlaced = false;
    for (const url of logoUrls) {
      // Try each possible URL variant until one loads in production.
      logoPlaced = await addHospitalLogoSquareToPdf(
        doc,
        url,
        groupLeft,
        logoTopMm,
        logoSide,
      );
      if (logoPlaced) break;
    }
    if (logoPlaced) {
      const textLeft = groupLeft + logoSide + gapMm;
      const logoCenterY = logoTopMm + logoSide / 2;
      const n = titleLinesNarrow.length;
      const firstBaselineY =
        logoCenterY -
        ((n - 1) * titleLinePitchMm) / 2 +
        (n === 1 ? fontHeightMm * 0.38 : 0);
      titleLinesNarrow.forEach((line: string, i: number) => {
        doc.text(line, textLeft, firstBaselineY + i * titleLinePitchMm, {
          align: "left",
        });
      });
      return finishBlock(firstBaselineY, n);
    }
  }

  const titleLines = doc.splitTextToSize(title, contentW);
  const firstBaselineY = logoTopMm + 2;
  titleLines.forEach((line: string, i: number) => {
    doc.text(line, pageW / 2, firstBaselineY + i * titleLinePitchMm, {
      align: "center",
    });
  });
  return finishBlock(firstBaselineY, titleLines.length);
}

async function buildPrescriptionPdfDocument(
  input: Prescription,
): Promise<jsPDF> {
  const isPreviewDocument =
    typeof input._id === "string" && input._id.startsWith("preview-");
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
  let y = await drawHospitalHeaderBranding(
    doc,
    hospital,
    margin,
    contentW,
    pageW,
    logoTop,
    isPreviewDocument ? "Prescription Preview" : undefined,
  );

  if (isPreviewDocument) {
    doc.setTextColor(...TEXT_GREY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      "Preview only - for internal review. Not intended for patient use.",
      pageW / 2,
      y,
      { align: "center" },
    );
    y += 5;
  }

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
  if (ph) rightParts.push(`Ph: ${ph}`);
  if (hospital?.email?.trim())
    rightParts.push(`Email: ${hospital.email.trim()}`);
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
  const phoneVal = getPatientPhoneForPdf(rx);
  const weightVal = getPatientWeightForPdf(rx);
  const dateVal = formatPdfDate(rx.appointmentDate);

  const row1Y = y;
  const columnGap = 4;
  const colW = (contentW - columnGap * 2) / 3;
  const colX1 = margin;
  const colX2 = margin + colW + columnGap;
  const colX3 = margin + (colW + columnGap) * 2;
  const fixedUnderlineW = colW - 20;

  const drawFixedPatientField = (
    label: string,
    value: string,
    labelX: number,
    baselineY: number,
  ) => {
    const withColon = `${label}:`;
    const labelW = doc.getTextWidth(withColon);
    const valueX = labelX + labelW + 2;
    doc.setTextColor(...TEXT_GREY);
    doc.text(withColon, labelX, baselineY);
    doc.setTextColor(0, 0, 0);
    doc.text(value, valueX, baselineY);
  };

  doc.setFont("helvetica", "normal");
  drawFixedPatientField("Patient Name", nameVal, colX1, row1Y);
  drawFixedPatientField("Age", ageVal, colX2, row1Y);
  drawFixedPatientField("Gender", genderVal, colX3, row1Y);

  y = row1Y + 6;
  drawFixedPatientField("Date", dateVal, colX1, y);
  drawFixedPatientField("Phone", phoneVal === "—" ? "" : phoneVal, colX2, y);
  drawFixedPatientField("Weight", weightVal === "—" ? "" : weightVal, colX3, y);
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
  doc.setFontSize(PRESCRIPTION_BODY_FONT_PT);
  doc.setTextColor(0, 0, 0);

  let medY = y + 12;
  (rx.medicines ?? []).forEach((m, i) => {
    const dosage = `${m.dosage?.value ?? ""} ${m.dosage?.unit ?? ""}`.trim();
    const duration =
      `${m.duration?.value ?? ""} ${m.duration?.unit ?? ""}`.trim();
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
    const blockHeight = wrapped.length * PRESCRIPTION_BODY_LINE_MM + 3;
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

  const extraNotesText = rx.extraNotes?.trim();
  if (extraNotesText) {
    const notesBlock = [
      "Extra Notes:",
      decodeHtmlEntities(extraNotesText),
    ].join("\n");
    const wrappedNotes = doc.splitTextToSize(notesBlock, medW);
    const notesHeight = wrappedNotes.length * PRESCRIPTION_BODY_LINE_MM + 3;
    if (medY + notesHeight > contentBottomY) {
      doc.addPage();
      medY = 16;
    }
    doc.setTextColor(...TEXT_GREY);
    doc.text(wrappedNotes[0], medLeft, medY);
    if (wrappedNotes.length > 1) {
      doc.setTextColor(0, 0, 0);
      doc.text(wrappedNotes.slice(1), medLeft, medY + 4.1);
    }
    medY += notesHeight;
  }

  const refBaseline = pageH - 10;
  const poweredByBaseline = pageH - 4.5;
  const nameLineHeight = 4.15;

  doc.setFont("helvetica", "normal");
  const drSignName = formatDoctorNameWithDesignation(doctor);
  const signLines = drSignName ? doc.splitTextToSize(drSignName, contentW) : [];

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

  await drawFooterSamvaadLogo(doc, pageW, poweredByBaseline, 24, 4.5);

  return doc;
}

/**
 * Prescription PDF: hospital logo top-left, hospital title, body, signature,
 * ref id, and footer “Powered by” + Samvaad logo (same asset as login header).
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
    const rawName =
      (input.patientName || "prescription").trim() || "prescription";
    const safeName = rawName.replace(/[^\w\s-]/g, "").trim() || "prescription";
    doc.save(`prescription-report-${safeName}-${idSuffix}.pdf`);
  } catch (err) {
    console.error("Prescription PDF generation failed:", err);
    const detail =
      err instanceof Error
        ? err.message
        : "Unexpected error while building PDF.";
    showError(
      "Download failed",
      `${detail} If your disk is full, free space and try again.`,
    );
  }
}

export async function openPrescriptionReportPdfInNewTab(
  input: Prescription,
): Promise<void> {
  let targetTab: Window | null = null;
  try {
    // Open the tab synchronously during the user gesture to avoid popup blockers in production.
    targetTab = window.open("", "_blank");
    if (targetTab) {
      targetTab.opener = null;
      targetTab.document.title = "Generating prescription PDF...";
      targetTab.document.body.innerHTML =
        "<p style='font-family: sans-serif; padding: 16px;'>Generating PDF, please wait...</p>";
    }
    const doc = await buildPrescriptionPdfDocument(input);
    const blobUrl = doc.output("bloburl");
    if (targetTab && !targetTab.closed) {
      targetTab.location.href = blobUrl;
      return;
    }
    // Fallback if tab could not be pre-opened.
    window.open(blobUrl, "_blank");
  } catch (err) {
    if (targetTab && !targetTab.closed) {
      targetTab.close();
    }
    console.error("Prescription PDF open failed:", err);
    const detail =
      err instanceof Error
        ? err.message
        : "Unexpected error while building PDF.";
    showError("Print failed", `${detail} Please retry.`);
  }
}

export function downloadPrescriptionPdf(rx: Prescription): void {
  void downloadPrescriptionReportPdf(rx);
}
