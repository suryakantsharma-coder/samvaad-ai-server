/** GET /api/dashboard/hospital-admin — response `data` payload (partial, defensive parsing). */

export type HospitalAdminDashboardPreset =
  | "last_7_days"
  | "last_30_days"
  | "this_month";

export interface HospitalAdminDashboardFilters {
  preset?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

export interface HospitalAdminDonutSegment {
  id?: string;
  label?: string;
  count?: number;
  percent?: number;
}

export interface HospitalAdminPatientVolumeDay {
  date?: string;
  dayOfWeek?: string;
  totalAppointments?: number;
  uniquePatientsWithAppointments?: number;
  emergencyAppointments?: number;
  newPatientRegistrations?: number;
}

export interface HospitalAdminPatientOverviewItem {
  appointmentId?: string;
  appointmentRef?: string;
  patient?: {
    id?: string;
    fullName?: string;
    age?: number;
    phoneNumber?: string;
    gender?: string;
  };
  reason?: string;
  type?: string;
  status?: string;
  appointmentDateTime?: string;
  doctor?: {
    id?: string;
    fullName?: string;
    designation?: string;
  };
}

export interface HospitalAdminTimelineItem {
  id?: string;
  appointmentRef?: string;
  appointmentDateTime?: string;
  type?: string;
  status?: string;
  patient?: { fullName?: string; age?: number };
  doctor?: { fullName?: string; designation?: string };
}

export interface HospitalAdminDoctorRow {
  id?: string;
  fullName?: string;
  designation?: string;
  status?: string;
}

export interface HospitalAdminDashboardData {
  filters?: HospitalAdminDashboardFilters;
  summary?: {
    patients?: {
      totalRegisteredAtHospital?: number;
      newRegistrationsInRange?: number;
      growthPercentVsPreviousRange?: number;
    };
    appointments?: {
      countInRange?: number;
      growthPercentVsPreviousRange?: number;
    };
    visitors?: {
      uniquePatientsWithAppointmentInRange?: number;
      growthPercentVsPreviousRange?: number;
    };
  };
  appointmentsBreakdown?: {
    totalInRange?: number;
    donutSegments?: HospitalAdminDonutSegment[];
  };
  doctorsSchedule?: HospitalAdminDoctorRow[];
  upcomingAppointmentsTimeline?: HospitalAdminTimelineItem[];
  charts?: {
    patientVolumeByDay?: HospitalAdminPatientVolumeDay[];
  };
  patientOverview?: {
    items?: HospitalAdminPatientOverviewItem[];
    pagination?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
    };
  };
}
