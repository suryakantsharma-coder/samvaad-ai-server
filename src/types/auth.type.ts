export type User = {
  _id: string;
  hospital: string;
  email: string;
  name: string;
  role: string;
  /**
   * Mongo id of the linked hospital doctor record (GET/PATCH /api/auth/me).
   * When missing, the doctor user should use “Link doctor profile” in Settings.
   */
  doctor?: string | null;
  /** National or E.164-style number from API (GET/PATCH /api/auth/me). */
  phoneNumber?: string;
  /** Some responses may use `phone` instead of `phoneNumber`. */
  phone?: string;
  /** Profile image path or URL (preferred field from API). */
  profilePicUrl?: string;
  profilePictureUrl?: string;
  profilePicture?: string;
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
