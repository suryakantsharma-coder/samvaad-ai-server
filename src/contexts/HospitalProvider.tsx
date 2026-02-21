// src/contexts/HospitalProvider.tsx

import { createContext, useContext, useState, ReactNode } from "react";
import {
  CreateHospitalPayload,
  Hospital,
  UpdateHospitalPayload,
} from "../types/hospital.type";
import {
  createHospital,
  getHospitalById,
  getHospitals,
  searchHospitals,
  updateHospital,
} from "../data/hospital";

interface HospitalContextType {
  hospitals: Hospital[];
  searchedHospitals: Hospital[] | null;
  /** Currently loaded hospital (e.g. for Settings page, fetched by ID). */
  currentHospital: Hospital | null;
  isLoading: boolean;
  error: string | null;
  /** Loading state for fetch/update of current hospital only. */
  currentHospitalLoading: boolean;
  currentHospitalError: string | null;
  handleCreateHospital: (payload: CreateHospitalPayload) => Promise<void>;
  handleGetHospitals: () => Promise<void>;
  handleSearchHospitals: (q: string) => Promise<void>;
  resetSearchedHospitals: () => void;
  /** Fetch a single hospital by ID and set as currentHospital. */
  fetchHospitalById: (hospitalId: string) => Promise<void>;
  /** Update hospital by ID and refresh currentHospital if it's the same. */
  updateHospitalById: (
    hospitalId: string,
    payload: UpdateHospitalPayload,
  ) => Promise<void>;
  clearCurrentHospital: () => void;
}

export const HospitalContext = createContext<HospitalContextType>({
  handleCreateHospital: async () => {},
  handleGetHospitals: async () => {},
  handleSearchHospitals: async () => {},
  resetSearchedHospitals: () => {},
  fetchHospitalById: async () => {},
  updateHospitalById: async () => {},
  clearCurrentHospital: () => {},
  hospitals: [],
  searchedHospitals: null,
  currentHospital: null,
  isLoading: false,
  error: null,
  currentHospitalLoading: false,
  currentHospitalError: null,
});

export const HospitalProvider = ({ children }: { children: ReactNode }) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchedHospitals, setSearchedHospitals] = useState<Hospital[] | null>(
    null,
  );
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentHospitalLoading, setCurrentHospitalLoading] = useState(false);
  const [currentHospitalError, setCurrentHospitalError] = useState<string | null>(
    null,
  );
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
      const data = response as { data?: { hospitals?: Hospital[] } };
      setHospitals(data?.data?.hospitals ?? []);
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
      const data = response as { data?: { hospitals?: Hospital[] } };
      setSearchedHospitals((data?.data?.hospitals ?? []) as Hospital[]);
    } catch (error) {
      setError("Failed to search hospitals");
      setSearchedHospitals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSearchedHospitals = () => setSearchedHospitals(null);

  const fetchHospitalById = async (hospitalId: string) => {
    if (!hospitalId) return;
    setCurrentHospitalLoading(true);
    setCurrentHospitalError(null);
    try {
      const res = await getHospitalById(hospitalId);
      const r = res as { data?: { hospital?: Hospital } | Hospital };
      const hospital =
        (r?.data && typeof r.data === "object" && "_id" in r.data
          ? r.data
          : (r?.data as { hospital?: Hospital })?.hospital) ?? null;
      setCurrentHospital(hospital);
    } catch (err) {
      setCurrentHospitalError(
        err instanceof Error ? err.message : "Failed to load hospital",
      );
      setCurrentHospital(null);
    } finally {
      setCurrentHospitalLoading(false);
    }
  };

  const updateHospitalById = async (
    hospitalId: string,
    payload: UpdateHospitalPayload,
  ) => {
    setCurrentHospitalLoading(true);
    setCurrentHospitalError(null);
    try {
      const res = await updateHospital(hospitalId, payload);
      const updated =
        (res as { data?: { hospital?: Hospital } })?.data?.hospital ?? null;
      if (updated) {
        setCurrentHospital((prev) =>
          prev?._id === hospitalId ? updated : prev,
        );
      }
    } catch (err) {
      setCurrentHospitalError(
        err instanceof Error ? err.message : "Failed to update hospital",
      );
      throw err;
    } finally {
      setCurrentHospitalLoading(false);
    }
  };

  const clearCurrentHospital = () => {
    setCurrentHospital(null);
    setCurrentHospitalError(null);
  };

  return (
    <HospitalContext.Provider
      value={{
        hospitals,
        searchedHospitals,
        currentHospital,
        isLoading,
        error,
        currentHospitalLoading,
        currentHospitalError,
        handleCreateHospital,
        handleGetHospitals,
        handleSearchHospitals,
        resetSearchedHospitals,
        fetchHospitalById,
        updateHospitalById,
        clearCurrentHospital,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  return useContext(HospitalContext);
};
