// make a type for this response

export interface Patients {
  _id: string;
  hospital: string;
  patientId: string;
  fullName: string;
  phoneNumber: string;
  age: number;
  gender: string;
}

export interface Appointments {
  _id: string;
  hospital: string;
  appointmentId: string;
  patient: string;
  doctor: Doctor;
  appointmentDateTime: string;
  reason: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  _id: string;
  fullName: string;
  doctorId: string;
  phoneNumber: string;
  email: string;
}

export interface Prescription {
  _id: string;
  patient: string;
  appointment: Appointments | string;
  hospital: string;
  patientName: string;
  appointmentDate: string;
  medicines?: Medicine[];
}

export interface FollowUp {
  value: number;
  unit: string;
}

export interface Medicine {
  name: string;
  dosage: Dosage;
  duration: Duration;
  intake: string;
  time: Time;
  notes: string;
}

export interface Time {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

export interface Dosage {
  value: number;
  unit: string;
}

export interface Duration {
  value: number;
  unit: string;
}

export interface PatientHistoryResponse {
  success: boolean;
  linkedHospitalId: string;
  data: {
    patient: Patients;
    appointments: Appointments[];
    prescriptions: Prescription[];
  };
}
