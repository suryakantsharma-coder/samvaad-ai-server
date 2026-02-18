//  create a context for authentication

import { createContext, useContext, useEffect, useState } from "react";
import { getUserProfile, login, logout, register } from "../data/auth";
import { User } from "../types/auth.type";
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
    role: string
  ) => Promise<void>;
  user: User | null;
}>({
  accessToken: null,
  setAccessToken: () => {},
  isAuthenticated: false,
  handleLogin: async () => {},
  handleLogout: async () => {},
  handleRegister: async () => {},
  user: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
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
    role: string
  ) => {
    console.log("Registering user:", { email, password, name, role });
    const data = await register(email, password, name, role);
    setAccessToken(data.data?.accessToken ?? null);
    setIsAuthenticated(!!data.data?.accessToken);
  };

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
