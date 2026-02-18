export interface CreatePatientPayload {
  fullName: string;
  phoneNumber: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  reason: string;
}

export interface Patients {
  _id: string;
  fullName: string;
  phoneNumber: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  createdAt: string;
  updatedAt: string;
  reason: string;
  appointments?: Appointment[];
  __v: number;
}

export interface Doctor {
  _id: string;
  fullName: string;
  doctorId: string;
  designation: string;
}

export interface Appointment {
  _id: string;
  patient: string;
  doctor: Doctor;
  reason: string;
  status: string;
  type: string;
  appointmentDateTime: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface UpdatePatientPayload {
  age: number;
  phoneNumber: string;
  reason: string;
}
