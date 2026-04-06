export type User = {
  _id: string;
  hospital: string;
  email: string;
  name: string;
  role: string;
  /** National or E.164-style number from API (GET/PATCH /api/auth/me). */
  phoneNumber?: string;
  /** Some responses may use `phone` instead of `phoneNumber`. */
  phone?: string;
  createdAt: string;
  updatedAt: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type RegisterResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type HospitalUser = {
  _id: string;
  hospital: string;
  email: string;
  name: string;
  role: string;
  phoneNumber: string;
  isActive: boolean;
  lastLoginAt: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HospitalUsersResponse = {
  success: boolean;
  linkedHospitalId: string;
  data: {
    users: HospitalUser[];
  };
};
