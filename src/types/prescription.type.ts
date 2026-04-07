export type PrescriptionStatus = "Draft" | "Sent" | "Completed";

/** Populated hospital on list/detail API responses */
export interface PrescriptionHospital {
  _id: string;
  name: string;
  phoneCountryCode?: string;
  phoneNumber: string;
  email?: string;
  contactPerson?: string;
  registrationNumber?: string;
  address?: string;
  city?: string;
  pincode?: string;
  logoUrl?: string;
}

/** Populated patient on list/detail API responses */
export interface PrescriptionPatientInfo {
  _id: string;
  patientId?: string;
  fullName: string;
  phoneNumber?: string;
}

/** Populated doctor on appointment / medicine */
export interface PrescriptionDoctorInfo {
  _id: string;
  fullName: string;
  doctorId?: string;
  phoneNumber?: string;
  email?: string;
  designation?: string;
  availability?: string;
}

/** Populated appointment with doctor (list API) */
export interface PrescriptionAppointmentDetail {
  _id: string;
  appointmentId?: string;
  doctor: PrescriptionDoctorInfo;
  reason?: string;
  status?: string;
  type?: string;
  appointmentDateTime?: string;
}

export interface PrescriptionDosage {
  value: number;
  unit: "mg" | "ml" | "g" | "tablet" | "capsule";
}

export interface PrescriptionDuration {
  value: number;
  unit: "Days" | "Weeks" | "Months";
}

export interface PrescriptionFollowUp {
  value: number;
  unit: "Days" | "Weeks" | "Months";
}

export interface PrescriptionTime {
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
}

export interface PrescriptionMedicine {
  name: string;
  dosage: PrescriptionDosage;
  duration: PrescriptionDuration;
  intake: "Before" | "After";
  time?: PrescriptionTime;
  notes?: string;
  /** When API provides a combined frequency string */
  frequency?: string;
  doctor?: PrescriptionDoctorInfo;
  hospital?: PrescriptionHospital;
}

export interface Prescription {
  _id: string;
  /** Patient id string (create/edit) or populated object (list API) */
  patient: string | PrescriptionPatientInfo;
  /** Appointment id string (create/edit) or populated object (list API) */
  appointment: string | PrescriptionAppointmentDetail;
  patientName: string;
  appointmentDate: string;
  followUp?: PrescriptionFollowUp;
  medicines: PrescriptionMedicine[];
  status: PrescriptionStatus;
  createdAt?: string;
  updatedAt?: string;
  hospital?: PrescriptionHospital;
  notes?: string;
}

export interface CreatePrescriptionPayload {
  patient: string;
  appointment: string;
  patientName: string;
  appointmentDate: string;
  followUp?: PrescriptionFollowUp;
  medicines: PrescriptionMedicine[];
  status?: PrescriptionStatus;
}

export interface UpdatePrescriptionPayload {
  patientName?: string;
  appointmentDate?: string;
  followUp?: PrescriptionFollowUp;
  medicines?: PrescriptionMedicine[];
  status?: PrescriptionStatus;
}
