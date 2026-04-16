import {
  currentMonthStartEndYmd,
  toYMDLocal,
} from "../../lib/currentMonthDateRange";

export { toYMDLocal };

/** Local-date YYYY-MM-DD (no timezone shift). */
export type DashboardDateRange = { start: string; end: string };

export type PatientOverviewRow = {
  id: number;
  name: string;
  age: string;
  phone: string;
  gender: string;
  reason: string;
  doctor: string;
  status: string;
  statusBg: string;
  statusText: string;
  appointmentDate: string;
  time: string;
};

export type AppointmentListRow = {
  id: number;
  time: string;
  patient: string;
  age: string;
  type: string;
  doctor: string;
  status: string;
  statusBg: string;
  statusText: string;
  date: string;
};

export type TrendBar = {
  day: string;
  total: number;
  emergency: number;
  new: number;
};

export type DoctorScheduleRow = {
  id: number;
  name: string;
  specialty: string;
  initials: string;
  status: string;
  statusBg: string;
  statusColor: string;
  avatarBg: string;
};

export type DashboardResponse = {
  kpi: {
    overallPatients: number;
    appointments: number;
    visitors: number;
    overallPct: string;
    appointmentsPct: string;
    visitorsPct: string;
  };
  donut: {
    total: number;
    segments: { value: number; color: string }[];
    legend: { label: string; value: string; color: string }[];
  };
  patientTrends: {
    total: number;
    trendPct: string;
    bars: TrendBar[];
  };
  patients: PatientOverviewRow[];
  appointmentRows: AppointmentListRow[];
  doctors: DoctorScheduleRow[];
  /** From GET /api/dashboard/hospital-admin `patientOverview.pagination`; null for mock. */
  patientOverviewMeta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
};

const DONUT_LABELS = ["Confirmed", "Follow ups", "First time visit", "Cancelled"];
const DONUT_COLORS = ["#009598", "#7ecfd1", "#bfe6e7", "#e5e5e5"];

function parseYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function defaultDashboardDateRange(): DashboardDateRange {
  return currentMonthStartEndYmd();
}

export function daysInclusive(start: string, end: string): number {
  const a = parseYMD(start);
  const b = parseYMD(end);
  if (b < a) return 1;
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}

export function formatRangeDisplay(start: string, end: string): string {
  const a = parseYMD(start);
  const b = parseYMD(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(a)} – ${fmt(b)}`;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function displayDateInRange(
  start: string,
  end: string,
  salt: number,
): string {
  const a = parseYMD(start).getTime();
  const b = parseYMD(end).getTime();
  const span = Math.max(0, b - a);
  const t = a + (span > 0 ? ((hash(String(salt) + start + end) % 1000) / 1000) * span : 0);
  return new Date(t).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const BASE_PATIENTS: Omit<PatientOverviewRow, "appointmentDate">[] = [
  {
    id: 1,
    name: "Patric Peters",
    age: "28 years old",
    phone: "+91 3456728902",
    gender: "Male",
    reason: "General check up",
    doctor: "Dr. Peter Patrics",
    status: "Today",
    statusBg: "bg-[#dffff2]",
    statusText: "text-[#00955b]",
    time: "11:30 AM",
  },
  {
    id: 2,
    name: "Patric Peters",
    age: "28 years old",
    phone: "+91 3456728902",
    gender: "Male",
    reason: "General check up",
    doctor: "Dr. Peter Patrics",
    status: "Upcoming",
    statusBg: "bg-[#fff1e0]",
    statusText: "text-[#ff9000]",
    time: "2:00 PM",
  },
  {
    id: 3,
    name: "Patric Peters",
    age: "28 years old",
    phone: "+91 3456728902",
    gender: "Male",
    reason: "General check up",
    doctor: "Dr. Peter Patrics",
    status: "Completed",
    statusBg: "bg-[#d5eaff]",
    statusText: "text-[#007cff]",
    time: "9:15 AM",
  },
  {
    id: 4,
    name: "Patric Peters",
    age: "28 years old",
    phone: "+91 3456728902",
    gender: "Male",
    reason: "General check up",
    doctor: "Dr. Peter Patrics",
    status: "Upcoming",
    statusBg: "bg-[#fff1e0]",
    statusText: "text-[#ff9000]",
    time: "4:45 PM",
  },
];

const BASE_APPOINTMENTS: Omit<AppointmentListRow, "date">[] = [
  {
    id: 1,
    time: "12:30 AM",
    patient: "Nilson John",
    age: "28 years old",
    type: "Consultation",
    doctor: "Dr. Peter Patrics",
    status: "Confirmed",
    statusBg: "bg-[#dffff2]",
    statusText: "text-[#00955b]",
  },
  {
    id: 2,
    time: "1:00 AM",
    patient: "Sarah John",
    age: "28 years old",
    type: "Blood Check Review",
    doctor: "Dr. Nilson John",
    status: "Upcoming",
    statusBg: "bg-[#fff1e0]",
    statusText: "text-[#ff9000]",
  },
  {
    id: 3,
    time: "1:30 AM",
    patient: "Kevin Dorman",
    age: "28 years old",
    type: "Monthly Check Up",
    doctor: "Dr. Emily Cooper",
    status: "Completed",
    statusBg: "bg-[#d5eaff]",
    statusText: "text-[#007cff]",
  },
  {
    id: 4,
    time: "2:30 AM",
    patient: "Fredrick Paterson",
    age: "28 years old",
    type: "General Check Up",
    doctor: "Dr. Liam Brooks",
    status: "Upcoming",
    statusBg: "bg-[#fff1e0]",
    statusText: "text-[#ff9000]",
  },
  {
    id: 5,
    time: "3:30 AM",
    patient: "Fredrick Paterson",
    age: "28 years old",
    type: "General Check Up",
    doctor: "Dr. Sara Williams",
    status: "Confirmed",
    statusBg: "bg-[#dffff2]",
    statusText: "text-[#00955b]",
  },
  {
    id: 6,
    time: "4:00 AM",
    patient: "Fredrick Paterson",
    age: "28 years old",
    type: "Follow-up",
    doctor: "Dr. Ethan Miller",
    status: "Cancelled",
    statusBg: "bg-[#ffe9e9]",
    statusText: "text-[#ff0004]",
  },
];

const BASE_DOCTORS: DoctorScheduleRow[] = [
  {
    id: 1,
    name: "Dr. Nilson John",
    specialty: "Pediatrics",
    initials: "NJ",
    status: "On-Duty",
    statusBg: "bg-[#dffff2]",
    statusColor: "text-[#00955b]",
    avatarBg: "bg-[#bfe6e7]",
  },
  {
    id: 2,
    name: "Dr. Liam Brooks",
    specialty: "Orthopedics",
    initials: "LB",
    status: "On-Break",
    statusBg: "bg-[#fff1e0]",
    statusColor: "text-[#ff9000]",
    avatarBg: "bg-[#ffe9c8]",
  },
  {
    id: 3,
    name: "Dr. Emily Cooper",
    specialty: "General Physician",
    initials: "EC",
    status: "Off Duty",
    statusBg: "bg-[#ffe9e9]",
    statusColor: "text-[#ff0004]",
    avatarBg: "bg-[#ffd5d5]",
  },
  {
    id: 4,
    name: "Dr. Ethan Miller",
    specialty: "General Physician",
    initials: "EM",
    status: "On Leave",
    statusBg: "bg-[#f2f2f3]",
    statusColor: "text-x-70",
    avatarBg: "bg-[#e8e8ea]",
  },
  {
    id: 5,
    name: "Dr. Sara Williams",
    specialty: "Cardiology",
    initials: "SW",
    status: "On-Duty",
    statusBg: "bg-[#dffff2]",
    statusColor: "text-[#00955b]",
    avatarBg: "bg-[#bfe6e7]",
  },
];

const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Empty shell before the first API response, or after errors with no prior data. Avoids showing mock KPI/patient names. */
export function emptyDashboardPlaceholder(): DashboardResponse {
  return {
    kpi: {
      overallPatients: 0,
      appointments: 0,
      visitors: 0,
      overallPct: "—",
      appointmentsPct: "—",
      visitorsPct: "—",
    },
    donut: {
      total: 0,
      segments: [
        { value: 25, color: "#e5e5e5" },
        { value: 25, color: "#e5e5e5" },
        { value: 25, color: "#e5e5e5" },
        { value: 25, color: "#e5e5e5" },
      ],
      legend: [{ label: "—", value: "—", color: "bg-neutral-200" }],
    },
    patientTrends: {
      total: 0,
      trendPct: "—",
      bars: [],
    },
    patients: [],
    appointmentRows: [],
    doctors: [],
    patientOverviewMeta: null,
  };
}

export function buildDashboardResponse(
  range: DashboardDateRange,
): DashboardResponse {
  const h = hash(`${range.start}|${range.end}`);
  const n = daysInclusive(range.start, range.end);
  const spanFactor = Math.min(1.4, Math.max(0.5, n / 30));
  const scale = 0.88 + (h % 25) / 100;

  const kpi = {
    overallPatients: Math.max(100, Math.round(1259 * scale * spanFactor)),
    appointments: Math.max(50, Math.round(989 * scale * spanFactor)),
    visitors: Math.max(20, Math.round(167 * scale * Math.sqrt(spanFactor))),
    overallPct: `${(12 + (h % 14)).toFixed(1)}%`,
    appointmentsPct: `${(14 + (h % 12)).toFixed(1)}%`,
    visitorsPct: `${(9 + (h % 9)).toFixed(1)}%`,
  };

  const rawSeg = [35, 25, 28, 12].map((v, i) =>
    Math.max(5, v + ((h >> (i * 3)) % 7) - 3),
  );
  const segSum = rawSeg.reduce((s, v) => s + v, 0);
  const segments = rawSeg.map((v, i) => ({
    value: Math.round((v / segSum) * 100),
    color: DONUT_COLORS[i],
  }));
  let segRoundSum = segments.reduce((s, x) => s + x.value, 0);
  if (segRoundSum !== 100 && segments.length > 0) {
    segments[0] = {
      ...segments[0],
      value: segments[0].value + (100 - segRoundSum),
    };
  }

  const donutLegendClasses = [
    "bg-primary-2",
    "bg-[#7ecfd1]",
    "bg-[#bfe6e7]",
    "bg-neutral-200",
  ] as const;

  const barCount = Math.min(7, Math.max(3, Math.min(n, 7)));
  const bars: TrendBar[] = Array.from({ length: barCount }, (_, i) => ({
    day: WEEK_LABELS[i % 7],
    total: 42 + ((h + i * 11) % 50),
    emergency: 10 + ((h + i * 5) % 22),
    new: 20 + ((h + i * 7) % 32),
  }));

  const trendTotal = Math.round(
    (bars.reduce((s, b) => s + b.total, 0) / bars.length) * 18,
  );

  const patients: PatientOverviewRow[] = BASE_PATIENTS.map((p) => ({
    ...p,
    appointmentDate: displayDateInRange(range.start, range.end, p.id),
  }));

  const appointmentRows: AppointmentListRow[] = BASE_APPOINTMENTS.map(
    (a) => ({
      ...a,
      date: displayDateInRange(range.start, range.end, a.id + 100),
    }),
  );

  const rotate = h % BASE_DOCTORS.length;
  const doctors = [
    ...BASE_DOCTORS.slice(rotate),
    ...BASE_DOCTORS.slice(0, rotate),
  ];

  return {
    kpi,
    donut: {
      total: kpi.appointments,
      segments,
      legend: segments.map((s, i) => ({
        label: DONUT_LABELS[i],
        value: `${s.value}%`,
        color: donutLegendClasses[i],
      })),
    },
    patientTrends: {
      total: trendTotal,
      trendPct: `${(10 + (h % 18)).toFixed(1)}%`,
      bars,
    },
    patients,
    appointmentRows,
    doctors,
    patientOverviewMeta: null,
  };
}
