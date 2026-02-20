export type PrescriptionStatus = "Draft" | "Sent" | "Completed";

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
}

export interface Prescription {
  _id: string;
  patient: string;
  appointment: string;
  patientName: string;
  appointmentDate: string;
  followUp?: PrescriptionFollowUp;
  medicines: PrescriptionMedicine[];
  status: PrescriptionStatus;
  createdAt?: string;
  updatedAt?: string;
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
