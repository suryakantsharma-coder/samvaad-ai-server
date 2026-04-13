/** One holiday range. API/JSON uses ISO date strings; server may store as Date. */
export type DoctorHoliday = {
  startDate: string;
  endDate: string;
};

export type CreateDoctorPayload = {
  fullName: string;
  phoneNumber: string;
  email: string;
  designation: string;
  availability: string;
  status: "Off Duty" | "On Duty" | "On Break" | "On Leave";
  holidays?: DoctorHoliday[];
};

/** PATCH body — all fields optional. */
export type UpdateDoctorPayload = Partial<CreateDoctorPayload>;

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
  holidays?: DoctorHoliday[];
  createdAt: string;
  updatedAt: string;
  __v: number;
};
