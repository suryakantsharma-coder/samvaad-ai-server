export interface PublicTelecallerPatient {
  _id: string;
  fullName: string;
  phoneNumber?: string;
  age?: number;
  gender?: string;
}

export interface PublicTelecallerHospital {
  _id: string;
  name: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  pincode?: string;
}

export interface PublicTelecallerPayload {
  patient: PublicTelecallerPatient;
  hospital?: PublicTelecallerHospital;
  appointmentId?: string;
  hospitalId?: string;
  lastAppointment?: {
    reason?: string;
    doctorId?: string;
    doctorName?: string;
    doctorEmail?: string;
  };
  doctors?: Array<{
    _id: string;
    fullName: string;
    designation?: string;
    availability?: string;
    email?: string;
  }>;
}
