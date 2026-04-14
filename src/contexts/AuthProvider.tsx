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
import {
  User,
  HospitalUser,
  HospitalUsersResponse,
} from "../types/auth.type";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext<{
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  isAuthenticated: boolean;
  handleLogin: (email: string, password: string) => Promise<User>;
  handleLogout: () => Promise<void>;
  handleRegister: (
    email: string,
    password: string,
    name: string,
    role: string,
    hospitalId: string,
  ) => Promise<void>;
  user: User | null;
  refreshUser: () => Promise<void>;
  hospitalUsers: User[] | null;
  handleGetHospitalUsers: (hospitalId: string) => Promise<void>;
  handleChangeUserRole: (
    userId: string,
    role: string,
    hospitalId: string,
  ) => Promise<void>;
  authHydrating: boolean;
}>({
  accessToken: null,
  setAccessToken: () => {},
  isAuthenticated: false,
  handleLogin: async (): Promise<User> => {
    throw new Error("AuthProvider not mounted");
  },
  handleLogout: async () => {},
  handleRegister: async () => {},
  user: null,
  refreshUser: async () => {},
  hospitalUsers: [],
  handleGetHospitalUsers: async (hospitalId: string) => {},
  handleChangeUserRole: async (
    userId: string,
    role: string,
    hospitalId: string,
  ) => {},
  authHydrating: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [hospitalUsers, setHospitalUsers] = useState<HospitalUser[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authHydrating, setAuthHydrating] = useState(
    () => typeof window !== "undefined" && Boolean(localStorage.getItem("token")),
  );
  const navigate = useNavigate();

  const refreshUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const data = await getUserProfile();
    // @ts-expect-error API returns nested user
    const nextUser = data.data?.user as User | undefined;
    if (nextUser) {
      setUser(nextUser);
      localStorage.setItem("user", JSON.stringify(nextUser));
    }
  };

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
    const nextUser = data.data.user as User;
    setUser(nextUser);
    setAccessToken(data.data.accessToken);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(nextUser));
    return nextUser;
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
      setAuthHydrating(true);
      void handleUserProfile(token)
        .catch((error) => {
          console.error("Error checking token:", error);
          navigate("/login");
        })
        .finally(() => setAuthHydrating(false));
    } else {
      setAuthHydrating(false);
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
        refreshUser,
        hospitalUsers,
        handleGetHospitalUsers,
        handleChangeUserRole,
        authHydrating,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
