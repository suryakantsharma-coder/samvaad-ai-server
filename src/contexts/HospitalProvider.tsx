// src/contexts/HospitalProvider.tsx

import { createContext, useContext, useState, ReactNode } from "react";
import { CreateHospitalPayload, Hospital } from "../types/hospital.type";
import { createHospital, getHospitals, searchHospitals } from "../data/hospital";

interface HospitalContextType {
  hospitals: Hospital[];
  searchedHospitals: Hospital[] | null;
  isLoading: boolean;
  error: string | null;
  handleCreateHospital: (payload: CreateHospitalPayload) => Promise<void>;
  handleGetHospitals: () => Promise<void>;
  handleSearchHospitals: (q: string) => Promise<void>;
  resetSearchedHospitals: () => void;
}

export const HospitalContext = createContext<HospitalContextType>({
  handleCreateHospital: async () => {},
  handleGetHospitals: async () => {},
  handleSearchHospitals: async () => {},
  resetSearchedHospitals: () => {},
  hospitals: [],
  searchedHospitals: null,
  isLoading: false,
  error: null,
});

export const HospitalProvider = ({ children }: { children: ReactNode }) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchedHospitals, setSearchedHospitals] = useState<Hospital[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleCreateHospital = async (payload: CreateHospitalPayload) => {
    setIsLoading(true);
    try {
      const response = await createHospital(payload);
      setHospitals([...hospitals, response as unknown as Hospital]);
      setSuccess("Hospital created successfully");
      setShowToast(true);
    } catch (error) {
      setError("Failed to create hospital");
      setShowToast(true);
    }
    setIsLoading(false);
  };

  const handleGetHospitals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getHospitals();
      setHospitals(response.data?.hospitals ?? []);
      setSuccess("Hospitals fetched successfully");
      setShowToast(true);
    } catch (err) {
      setError("Failed to get hospitals");
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchHospitals = async (q: string) => {
    try {
      if (!q.trim()) {
        setSearchedHospitals(null);
        return;
      }
      setIsLoading(true);
      const response = await searchHospitals(q.trim(), 1, 20);
      setSearchedHospitals((response.data?.hospitals ?? []) as Hospital[]);
    } catch (error) {
      setError("Failed to search hospitals");
      setSearchedHospitals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSearchedHospitals = () => setSearchedHospitals(null);

  return (
    <HospitalContext.Provider
      value={{
        hospitals,
        searchedHospitals,
        isLoading,
        error,
        handleCreateHospital,
        handleGetHospitals,
        handleSearchHospitals,
        resetSearchedHospitals,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  return useContext(HospitalContext);
};
