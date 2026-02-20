//  create a context for authentication

import { createContext, useContext, useEffect, useState } from "react";
import {
  getHospitalUsers,
  getUserProfile,
  login,
  logout,
  register,
  updateUserRoleByHospitalId,
} from "../data/auth";
import { User, HospitalUser, HospitalUsersResponse } from "../types/auth.type";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext<{
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  isAuthenticated: boolean;
  handleLogin: (email: string, password: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  handleRegister: (
    email: string,
    password: string,
    name: string,
    role: string,
    hospitalId: string,
  ) => Promise<void>;
  user: User | null;
  hospitalUsers: User[] | null;
  handleGetHospitalUsers: (hospitalId: string) => Promise<void>;
  handleChangeUserRole: (
    userId: string,
    role: string,
    hospitalId: string,
  ) => Promise<void>;
}>({
  accessToken: null,
  setAccessToken: () => {},
  isAuthenticated: false,
  handleLogin: async () => {},
  handleLogout: async () => {},
  handleRegister: async () => {},
  user: null,
  hospitalUsers: [],
  handleGetHospitalUsers: async (hospitalId: string) => {},
  handleChangeUserRole: async (
    userId: string,
    role: string,
    hospitalId: string,
  ) => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [hospitalUsers, setHospitalUsers] = useState<HospitalUser[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      handleUserProfile(token);
    }
  }, []);

  const handleUserProfile = async (token: string) => {
    try {
      const data = await getUserProfile();
      // @ts-ignore
      setUser(data.data.user);
      setAccessToken(token);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setAccessToken(null);
      setIsAuthenticated(false);
      setUser(null);
      navigate("/login");
    }
  };

  const handleLogin = async (email: string, password: string) => {
    const data = await login(email, password);
    setUser(data.data.user);
    setAccessToken(data.data.accessToken);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(data.data.user));
  };

  const handleLogout = async () => {
    await logout();
    setAccessToken(null);
    setIsAuthenticated(false);
  };

  const handleRegister = async (
    email: string,
    password: string,
    name: string,
    role: string,
    hospitalId: string,
  ) => {
    console.log("Registering user:", {
      email,
      password,
      name,
      role,
      hospitalId,
    });
    const data = await register(email, password, name, role, hospitalId);
    setAccessToken(data.data?.accessToken ?? null);
    setIsAuthenticated(!!data.data?.accessToken);
  };

  const handleGetHospitalUsers = async (hospitalId: string) => {
    const data = await getHospitalUsers(hospitalId);
    const users = (data as HospitalUsersResponse)?.data
      ?.users as HospitalUser[];
    setHospitalUsers(users);
  };

  const handleChangeUserRole = async (
    userId: string,
    role: string,
    hospitalId: string,
  ) => {
    const data = await updateUserRoleByHospitalId(userId, role, hospitalId);
    const users = (data as HospitalUsersResponse)?.data
      ?.users as HospitalUser[];
    setHospitalUsers(users);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      handleUserProfile(token).catch((error) => {
        console.error("Error checking token:", error);
        navigate("/login");
      });
    } else {
      navigate("/login");
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        setAccessToken,
        isAuthenticated,
        handleLogin,
        handleLogout,
        handleRegister,
        user,
        hospitalUsers,
        handleGetHospitalUsers,
        handleChangeUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
