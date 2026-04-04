import { jsPDF } from "jspdf";
import type { Prescription } from "../types/prescription.type";

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function downloadPrescriptionPdf(rx: Prescription): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  let y = margin;
  const line = 6;
  const pageBottom = 280;

  const nextLine = (h = line) => {
    y += h;
    if (y > pageBottom) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Prescription", margin, y);
  nextLine(10);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const addField = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value, 180 - margin);
    doc.text(lines, margin + 42, y);
    nextLine(Math.max(line, lines.length * 4.5));
  };

  addField("Patient", rx.patientName ?? "—");
  addField("Appointment date", formatDate(rx.appointmentDate));
  if (rx.followUp) {
    addField(
      "Follow-up",
      `${rx.followUp.value} ${rx.followUp.unit}`,
    );
  }
  addField("Status", rx.status ?? "—");

  nextLine(4);
  doc.setFont("helvetica", "bold");
  doc.text("Medicines", margin, y);
  nextLine(6);
  doc.setFont("helvetica", "normal");

  (rx.medicines ?? []).forEach((m, i) => {
    const header = `${i + 1}. ${m.name}`;
    doc.setFont("helvetica", "bold");
    doc.text(header, margin, y);
    nextLine(5);
    doc.setFont("helvetica", "normal");
    const dosage = `${m.dosage?.value ?? ""} ${m.dosage?.unit ?? ""}`.trim();
    const duration = `${m.duration?.value ?? ""} ${m.duration?.unit ?? ""}`.trim();
    const times: string[] = [];
    if (m.time?.breakfast) times.push("Breakfast");
    if (m.time?.lunch) times.push("Lunch");
    if (m.time?.dinner) times.push("Dinner");
    const detail = [
      dosage && `Dosage: ${dosage}`,
      duration && `Duration: ${duration}`,
      `Intake: ${m.intake ?? "—"}`,
      times.length > 0 && `Time: ${times.join(", ")}`,
      m.notes && `Notes: ${m.notes}`,
    ]
      .filter(Boolean)
      .join(" · ");
    const wrapped = doc.splitTextToSize(detail || "—", 180 - margin - 4);
    doc.text(wrapped, margin + 4, y);
    nextLine(Math.max(line, wrapped.length * 4.5) + 2);
  });

  y = Math.min(y + 6, pageBottom - 8);
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Prescription ID: ${rx._id}`, margin, y, { maxWidth: 180 });

  const safeName = (rx.patientName || "prescription")
    .replace(/[^\w\s-]/g, "")
    .slice(0, 40);
  doc.save(`prescription-${safeName}-${rx._id.slice(-8)}.pdf`);
}
