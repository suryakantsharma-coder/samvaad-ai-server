interface Patient {
  _id: string;
  fullName: string;
  phoneNumber: string;
  age: number;
  gender: string;
}

interface Doctor {
  _id: string;
  fullName: string;
  doctorId: string;
  designation: string;
}

export interface Appointments {
  _id: string;
  patient: Patient;
  doctor: Doctor;
  reason: string;
  status: string;
  type: string;
  appointmentDateTime: string;
  createdAt: string;
  updatedAt: string;
  appointmentId: string;
  __v: number;
}

export interface AppointmentPayload {
  patient: string;
  doctor: string;
  reason: string;
  status: string;
  type: string;
  appointmentDateTime: string;
}

export interface RescheduleAppointmentPayload {
  appointmentDateTime: string;
}
