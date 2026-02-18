export type CreateDoctorPayload = {
  fullName: string;
  phoneNumber: string;
  email: string;
  designation: string;
  availability: string;
  status: "Off Duty" | "On Duty" | "On Break" | "On Leave";
};

export type Doctor = {
  _id: string;
  fullName: string;
  doctorId: string;
  phoneNumber: string;
  email: string;
  designation: string;
  availability: string;
  status: string;
  utilization: number;
  profileImage: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};
