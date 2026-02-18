// create a doctor context

import { createContext, useContext, useState } from "react";
import { CreateDoctorPayload, Doctor } from "../types/doctor.type";
import { getDoctors, addDoctor, searchDoctors } from "../data/doctor";

export const DoctorContext = createContext<{
  doctors: Doctor[];
  loading: boolean;
  page: number;
  limit: number;
  getDoctorsData: () => Promise<void>;
  handleAddDoctor: (doctor: CreateDoctorPayload) => Promise<void>;
  searchDoctorsByName: (q: string) => Promise<void>;
  searchedDoctors: Doctor[] | null;
  resetSearchedDoctors: () => void;
}>({
  doctors: [],
  loading: false,
  page: 1,
  limit: 20,
  getDoctorsData: () => Promise.resolve(),
  handleAddDoctor: () => Promise.resolve(),
  searchDoctorsByName: () => Promise.resolve(),
  searchedDoctors: null,
  resetSearchedDoctors: () => {},
});

export const DoctorProvider = ({ children }: { children: React.ReactNode }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchedDoctors, setSearchedDoctors] = useState<Doctor[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const getDoctorsData = async () => {
    try {
      setLoading(true);
      const response = await getDoctors(1, 20);
      setDoctors(response.data.doctors as Doctor[]);
      const page = response.data.pagination;
      setPage(page.page);
      setLimit(page.limit);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (doctor: CreateDoctorPayload) => {
    try {
      setLoading(true);
      const response = await addDoctor(doctor);
      setDoctors([...doctors, response.data.doctor]);
      alert("Doctor added successfully");
    } catch (error) {
      console.error(error);
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
      const response = await searchDoctors(q.trim(), 1, 20);
      setSearchedDoctors((response.data?.doctors ?? []) as Doctor[]);
    } catch (error) {
      console.error(error);
      setSearchedDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // reset searched doctors
  const resetSearchedDoctors = () => {
    setSearchedDoctors(null);
  };

  return (
    <DoctorContext.Provider
      value={{
        doctors,
        loading,
        page,
        limit,
        getDoctorsData,
        handleAddDoctor,
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
