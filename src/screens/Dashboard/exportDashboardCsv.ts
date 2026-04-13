import type { DashboardDateRange, DashboardResponse } from "./dashboardResponse";

function esc(s: string | number): string {
  const v = String(s);
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function row(cells: (string | number)[]): string {
  return cells.map(esc).join(",");
}

export function exportDashboardCsv(
  range: DashboardDateRange,
  data: DashboardResponse,
): void {
  const lines: string[] = [];

  lines.push(row(["Hospital dashboard export"]));
  lines.push(row(["Date range (start)", range.start]));
  lines.push(row(["Date range (end)", range.end]));
  lines.push("");

  lines.push(row(["Summary KPIs"]));
  lines.push(row(["Metric", "Value", "Growth vs previous"]));
  lines.push(
    row([
      "Overall patients",
      data.kpi.overallPatients,
      data.kpi.overallPct,
    ]),
  );
  lines.push(
    row(["Appointments", data.kpi.appointments, data.kpi.appointmentsPct]),
  );
  lines.push(row(["Visitors", data.kpi.visitors, data.kpi.visitorsPct]));
  lines.push("");

  lines.push(row(["Appointments breakdown (donut)"]));
  lines.push(row(["Label", "Share", "Total appointments (widget)"]));
  lines.push(row(["Total in range", data.donut.total, ""]));
  for (const leg of data.donut.legend) {
    lines.push(row([leg.label, leg.value, ""]));
  }
  lines.push("");

  lines.push(row(["Patient volume trend (chart)"]));
  lines.push(
    row([
      "Total (card)",
      data.patientTrends.total,
      data.patientTrends.trendPct,
    ]),
  );
  lines.push(row(["Day", "Total bar %", "Emergency %", "New %"]));
  for (const b of data.patientTrends.bars) {
    lines.push(row([b.day, b.total, b.emergency, b.new]));
  }
  lines.push("");

  lines.push(row(["Doctor schedule"]));
  lines.push(row(["Name", "Specialty", "Status"]));
  for (const d of data.doctors) {
    lines.push(row([d.name, d.specialty, d.status]));
  }
  lines.push("");

  lines.push(row(["Upcoming / timeline appointments"]));
  lines.push(
    row([
      "Time",
      "Patient",
      "Age",
      "Type",
      "Doctor",
      "Status",
      "Date",
    ]),
  );
  for (const a of data.appointmentRows) {
    lines.push(
      row([a.time, a.patient, a.age, a.type, a.doctor, a.status, a.date]),
    );
  }
  lines.push("");

  lines.push(row(["Patient overview (table)"]));
  lines.push(
    row([
      "Patient",
      "Age",
      "Phone",
      "Gender",
      "Reason",
      "Doctor",
      "Status",
      "Appointment date",
      "Time",
    ]),
  );
  for (const p of data.patients) {
    lines.push(
      row([
        p.name,
        p.age,
        p.phone,
        p.gender,
        p.reason,
        p.doctor,
        p.status,
        p.appointmentDate,
        p.time,
      ]),
    );
  }

  if (data.patientOverviewMeta) {
    lines.push("");
    lines.push(row(["Patient overview pagination"]));
    lines.push(
      row([
        "Page",
        data.patientOverviewMeta.page,
        "Limit",
        data.patientOverviewMeta.limit,
        "Total",
        data.patientOverviewMeta.total,
        "Total pages",
        data.patientOverviewMeta.totalPages,
      ]),
    );
  }

  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dashboard-${range.start}_to_${range.end}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
