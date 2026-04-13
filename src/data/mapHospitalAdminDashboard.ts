import { formatTime12h } from "../lib/dateTimeDisplay";
import type { HospitalAdminDashboardData } from "../types/hospitalAdminDashboard.type";
import type {
  DashboardResponse,
  PatientOverviewRow,
  AppointmentListRow,
  TrendBar,
  DoctorScheduleRow,
} from "../screens/Dashboard/dashboardResponse";

const DONUT_HEX: Record<string, string> = {
  scheduled_confirmed: "#009598",
  follow_up_completed: "#7ecfd1",
  first_time_visit: "#bfe6e7",
  cancelled: "#e5e5e5",
};

const DONUT_LEGEND: Record<string, string> = {
  scheduled_confirmed: "bg-primary-2",
  follow_up_completed: "bg-[#7ecfd1]",
  first_time_visit: "bg-[#bfe6e7]",
  cancelled: "bg-neutral-200",
};

function pctLabel(n: number | undefined | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Number(n)}%`;
}

function appointmentStatusStyle(status: string): {
  statusBg: string;
  statusText: string;
} {
  switch (status) {
    case "Upcoming":
      return { statusBg: "bg-[#fff1e0]", statusText: "text-[#ff9000]" };
    case "Completed":
      return { statusBg: "bg-[#dffff2]", statusText: "text-[#00955b]" };
    case "Cancelled":
      return { statusBg: "bg-[#ffe9e9]", statusText: "text-[#ff0004]" };
    case "Today":
      return { statusBg: "bg-[#d5eaff]", statusText: "text-[#007cff]" };
    default:
      return { statusBg: "bg-[#d5eaff]", statusText: "text-[#007cff]" };
  }
}

function formatDisplayDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "DR";
}

function doctorRowStyle(
  status: string,
  index: number,
): Pick<DoctorScheduleRow, "statusBg" | "statusColor" | "avatarBg"> {
  const avatars = [
    "bg-[#bfe6e7]",
    "bg-[#ffe9c8]",
    "bg-[#ffd5d5]",
    "bg-[#e8e8ea]",
    "bg-[#bfe6e7]",
  ];
  const s = status.trim().toLowerCase();
  if (s.includes("on duty") && !s.includes("off")) {
    return {
      statusBg: "bg-[#dffff2]",
      statusColor: "text-[#00955b]",
      avatarBg: avatars[index % avatars.length],
    };
  }
  if (s.includes("break")) {
    return {
      statusBg: "bg-[#fff1e0]",
      statusColor: "text-[#ff9000]",
      avatarBg: avatars[index % avatars.length],
    };
  }
  if (s.includes("off duty")) {
    return {
      statusBg: "bg-[#ffe9e9]",
      statusColor: "text-[#ff0004]",
      avatarBg: avatars[index % avatars.length],
    };
  }
  if (s.includes("leave")) {
    return {
      statusBg: "bg-[#f2f2f3]",
      statusColor: "text-x-70",
      avatarBg: avatars[index % avatars.length],
    };
  }
  return {
    statusBg: "bg-[#f2f2f3]",
    statusColor: "text-x-70",
    avatarBg: avatars[index % avatars.length],
  };
}

function displayDoctorStatus(status: string): string {
  const s = status.trim();
  if (/on duty/i.test(s) && !/off/i.test(s)) return "On-Duty";
  if (/on break/i.test(s)) return "On-Break";
  if (/off duty/i.test(s)) return "Off Duty";
  if (/on leave/i.test(s)) return "On Leave";
  return s || "—";
}

function buildTrendBarsFromChart(
  days: NonNullable<HospitalAdminDashboardData["charts"]>["patientVolumeByDay"],
): TrendBar[] {
  const list = Array.isArray(days) ? days : [];
  if (list.length === 0) {
    return [
      { day: "—", total: 20, emergency: 8, new: 12 },
    ];
  }
  const totals = list.map(
    (d) =>
      Number(d?.totalAppointments ?? 0) ||
      Number(d?.uniquePatientsWithAppointments ?? 0),
  );
  const maxC = Math.max(1, ...totals);
  return list.map((d) => {
    const t = Number(d?.totalAppointments ?? 0);
    const e = Number(d?.emergencyAppointments ?? 0);
    const n = Number(d?.newPatientRegistrations ?? 0);
    const scale = (x: number) =>
      Math.min(100, Math.max(8, Math.round((x / maxC) * 100)));
    return {
      day: (d?.dayOfWeek ?? "—").slice(0, 3),
      total: scale(t || n + e),
      emergency: scale(e),
      new: scale(n),
    };
  });
}

export function mapHospitalAdminDashboardData(
  data: HospitalAdminDashboardData | undefined | null,
): DashboardResponse {
  const summary = data?.summary;
  const breakdown = data?.appointmentsBreakdown;
  const segments = breakdown?.donutSegments ?? [];

  const kpi = {
    overallPatients: Number(summary?.patients?.totalRegisteredAtHospital ?? 0),
    appointments: Number(
      summary?.appointments?.countInRange ?? breakdown?.totalInRange ?? 0,
    ),
    visitors: Number(
      summary?.visitors?.uniquePatientsWithAppointmentInRange ?? 0,
    ),
    overallPct: pctLabel(summary?.patients?.growthPercentVsPreviousRange),
    appointmentsPct: pctLabel(
      summary?.appointments?.growthPercentVsPreviousRange,
    ),
    visitorsPct: pctLabel(summary?.visitors?.growthPercentVsPreviousRange),
  };

  const bars = buildTrendBarsFromChart(data?.charts?.patientVolumeByDay);

  const doctors: DoctorScheduleRow[] = (data?.doctorsSchedule ?? []).map(
    (d, index) => {
      const name = String(d?.fullName ?? "—");
      const st = doctorRowStyle(String(d?.status ?? ""), index);
      return {
        id: index + 1,
        name,
        specialty: String(d?.designation ?? "—"),
        initials: initialsFromName(name),
        status: displayDoctorStatus(String(d?.status ?? "")),
        statusBg: st.statusBg,
        statusColor: st.statusColor,
        avatarBg: st.avatarBg,
      };
    },
  );

  const poForOffset = data?.patientOverview?.pagination;
  const pageOffset =
    poForOffset != null
      ? (Number(poForOffset.page ?? 1) - 1) *
        Number(poForOffset.limit ?? 10)
      : 0;

  const patients: PatientOverviewRow[] = (data?.patientOverview?.items ?? []).map(
    (row, i) => {
      const st = appointmentStatusStyle(String(row.status ?? ""));
      const iso = row.appointmentDateTime;
      return {
        id: pageOffset + i + 1,
        name: String(row.patient?.fullName ?? "—"),
        age:
          row.patient?.age != null            ? `${row.patient.age} years old`
            : "—",
        phone: String(row.patient?.phoneNumber ?? "—"),
        gender: String(row.patient?.gender ?? "—"),
        reason: String(row.reason ?? "—"),
        doctor: String(row.doctor?.fullName ?? "—"),
        status: String(row.status ?? "—"),
        statusBg: st.statusBg,
        statusText: st.statusText,
        appointmentDate: formatDisplayDate(iso),
        time: formatTime12h(iso ?? ""),
      };
    },
  );

  const appointmentRows: AppointmentListRow[] = (
    data?.upcomingAppointmentsTimeline ?? []
  ).map((row, i) => {
    const st = appointmentStatusStyle(String(row.status ?? ""));
    const iso = row.appointmentDateTime;
    return {
      id: i + 1,
      time: formatTime12h(iso ?? ""),
      patient: String(row.patient?.fullName ?? "—"),
      age:
        row.patient?.age != null ? `${row.patient.age} years old` : "—",
      type: String(row.type ?? "—"),
      doctor: String(row.doctor?.fullName ?? "—"),
      status: String(row.status ?? "—"),
      statusBg: st.statusBg,
      statusText: st.statusText,
      date: formatDisplayDate(iso),
    };
  });

  const po = data?.patientOverview?.pagination;

  const donutTotal = Number(breakdown?.totalInRange ?? kpi.appointments ?? 0);

  let segmentsNorm: { value: number; color: string }[];
  let legend: { label: string; value: string; color: string }[];

  if (segments.length === 0) {
    segmentsNorm = [
      { value: 25, color: "#e5e5e5" },
      { value: 25, color: "#e5e5e5" },
      { value: 25, color: "#e5e5e5" },
      { value: 25, color: "#e5e5e5" },
    ];
    legend = [{ label: "—", value: "—", color: "bg-neutral-200" }];
  } else {
    const segmentsMapped = segments.map((seg) => {
      const id = String(seg.id ?? "");
      const pct = Math.max(0, Math.min(100, Number(seg.percent ?? 0)));
      return {
        value: pct,
        color: DONUT_HEX[id] ?? "#009598",
      };
    });

    let segSum = segmentsMapped.reduce((s, x) => s + x.value, 0);
    segmentsNorm =
      segSum > 0 && segSum !== 100
        ? segmentsMapped.map((s) => ({
            ...s,
            value: Math.round((s.value / segSum) * 100),
          }))
        : segmentsMapped;
    segSum = segmentsNorm.reduce((s, x) => s + x.value, 0);
    if (segSum !== 100 && segmentsNorm.length > 0) {
      segmentsNorm[0] = {
        ...segmentsNorm[0],
        value: segmentsNorm[0].value + (100 - segSum),
      };
    }

    legend = segments.map((seg, i) => {
      const id = String(seg.id ?? "");
      const pct = Number(seg.percent ?? segmentsNorm[i]?.value ?? 0);
      return {
        label: String(seg.label ?? "—"),
        value: `${Math.round(pct)}%`,
        color: DONUT_LEGEND[id] ?? "bg-primary-2",
      };
    });
  }

  return {
    kpi,
    donut: {
      total: segments.length === 0 ? 0 : donutTotal,
      segments: segmentsNorm,
      legend:
        legend.length > 0
          ? legend
          : [{ label: "—", value: "0%", color: "bg-neutral-200" }],
    },
    patientTrends: {
      total: kpi.overallPatients,
      trendPct: pctLabel(summary?.patients?.growthPercentVsPreviousRange),
      bars,
    },
    patients,
    appointmentRows,
    doctors,
    patientOverviewMeta: po
      ? {
          page: Number(po.page ?? 1),
          limit: Number(po.limit ?? 10),
          total: Number(po.total ?? 0),
          totalPages: Number(po.totalPages ?? 1),
        }
      : null,
  };
}
