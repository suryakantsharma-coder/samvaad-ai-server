// create a doctor context

import { createContext, useContext, useState } from "react";
import { showSuccess, showError } from "../lib/toast";
import {
  CreateDoctorPayload,
  Doctor,
  UpdateDoctorPayload,
} from "../types/doctor.type";
import {
  getDoctors,
  addDoctor,
  searchDoctors,
  updateDoctor,
  deleteDoctor,
} from "../data/doctor";

export const DoctorContext = createContext<{
  doctors: Doctor[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  getDoctorsData: () => Promise<void>;
  handleAddDoctor: (doctor: CreateDoctorPayload) => Promise<void>;
  handleUpdateDoctor: (
    doctorId: string,
    payload: UpdateDoctorPayload,
  ) => Promise<void>;
  handleDeleteDoctor: (doctorId: string) => Promise<void>;
  searchDoctorsByName: (q: string) => Promise<void>;
  searchedDoctors: Doctor[] | null;
  resetSearchedDoctors: () => void;
}>({
  doctors: [],
  loading: false,
  error: null,
  page: 1,
  limit: 10,
  getDoctorsData: () => Promise.resolve(),
  handleAddDoctor: () => Promise.resolve(),
  handleUpdateDoctor: () => Promise.resolve(),
  handleDeleteDoctor: () => Promise.resolve(),
  searchDoctorsByName: () => Promise.resolve(),
  searchedDoctors: null,
  resetSearchedDoctors: () => {},
});

export const DoctorProvider = ({ children }: { children: React.ReactNode }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchedDoctors, setSearchedDoctors] = useState<Doctor[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const getDoctorsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDoctors(1, 10);
      setDoctors(response.data.doctors as Doctor[]);
      const page = response.data.pagination;
      setPage(page.page);
      setLimit(page.limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (doctor: CreateDoctorPayload) => {
    try {
      setLoading(true);
      setError(null);
      const response = await addDoctor(doctor);
      const created = response.data?.doctor;
      if (created) {
        setDoctors((prev) => [...prev, created as Doctor]);
      } else {
        await getDoctorsData();
      }
      showSuccess("Success!", "Doctor added successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add doctor";
      setError(msg);
      showError("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const searchDoctorsByName = async (q: string) => {
    try {
      if (!q.trim()) {
        setSearchedDoctors(null);
        return;
      }
      setLoading(true);
      setError(null);
      const response = await searchDoctors(q.trim(), 1, 10);
      setSearchedDoctors((response.data?.doctors ?? []) as Doctor[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search doctors");
      setSearchedDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // reset searched doctors
  const resetSearchedDoctors = () => {
    setSearchedDoctors(null);
  };

  const handleUpdateDoctor = async (
    doctorId: string,
    payload: UpdateDoctorPayload,
  ) => {
    try {
      setLoading(true);
      setError(null);
      await updateDoctor(doctorId, payload);
      await getDoctorsData();
      showSuccess("Success!", "Doctor updated successfully.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to update doctor";
      setError(msg);
      showError("Error", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteDoctor(doctorId);
      await getDoctorsData();
      showSuccess("Success!", "Doctor removed successfully.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to remove doctor";
      setError(msg);
      showError("Error", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <DoctorContext.Provider
      value={{
        doctors,
        loading,
        error,
        page,
        limit,
        getDoctorsData,
        handleAddDoctor,
        handleUpdateDoctor,
        handleDeleteDoctor,
        searchDoctorsByName,
        searchedDoctors,
        resetSearchedDoctors,
      }}
    >
      {children}
    </DoctorContext.Provider>
  );
};

export const useDoctor = () => {
  return useContext(DoctorContext);
};
