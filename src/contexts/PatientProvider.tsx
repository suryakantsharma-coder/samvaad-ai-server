// create patient provider

import { createContext, useContext, useState } from "react";
import {
  getPatients,
  searchPatients,
  updatePatient,
} from "../data/patient";
import {
  CreatePatientPayload,
  Patients,
  UpdatePatientPayload,
} from "../types/patient.type";
import { createPatient, deletePatient } from "../data/patient";

export interface PatientOverall {
  totalPatients?: number;
}

interface PatientContextType {
  patients: Patients[];
  overall: PatientOverall;
  loading: boolean;
  error: string | null;
  handleAddPatient: (patient: CreatePatientPayload) => void;
  handlePatient: () => void;
  totalPages: number;
  currentPage: number;
  limit: number;
  searchedPatients: Patients[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleSearchPatients: (q: string) => Promise<void>;
  resetSearchedPatients: () => void;
  handleUpdatePatient: (
    patientId: string,
    patient: UpdatePatientPayload,
  ) => void;
  handleDeletePatient: (patientId: string) => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [patients, setPatients] = useState<Patients[]>([]);
  const [overall, setOverall] = useState<PatientOverall>({});
  const [searchedPatients, setSearchedPatients] = useState<Patients[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const handleAddPatient = async (patient: CreatePatientPayload) => {
    try {
      const response = await createPatient({
        fullName: patient.fullName,
        phoneNumber: patient.phoneNumber,
        age: patient.age,
        gender: patient.gender,
        reason: patient.reason,
      });
      setPatients([...patients, response.data.patient]);
      alert("Patient added successfully");
    } catch (error) {
      setError(error as string);
      alert(error as string);
    }
  };

  const handlePatient = async () => {
    try {
      setLoading(true);
      const response = await getPatients(1, 10);
      setPatients(response.data?.patients ?? []);
      const nextOverall = response.data?.overall;
      if (nextOverall && typeof nextOverall.totalPatients === "number") {
        setOverall({ totalPatients: nextOverall.totalPatients });
      }
      const page = response.data?.pagination;
      if (page) {
        setTotalPages(page.totalPages);
        setCurrentPage(page.page);
        setLimit(page.limit);
      }
    } catch (error) {
      setError(error as string);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePatient = async (
    patientId: string,
    patient: UpdatePatientPayload,
  ) => {
    try {
      await updatePatient(patientId, patient);
      await handlePatient();
      alert("Patient updated successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      alert(message);
    }
  };

  const handleSearchPatients = async (q: string) => {
    try {
      if (!q.trim()) {
        setSearchedPatients([]);
        return;
      }
      const response = await searchPatients(q.trim(), 1, 20);
      setSearchedPatients(response.data?.patients ?? []);
    } catch (error) {
      setError(error as string);
      setSearchedPatients([]);
    }
  };

  const resetSearchedPatients = () => {
    setSearchedPatients([]);
  };

  const handleDeletePatient = async (patientId: string) => {
    try {
      await deletePatient(patientId);
      await handlePatient();
      alert("Patient deleted successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      alert(message);
    }
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        overall,
        loading,
        error,
        handleAddPatient,
        handlePatient,
        totalPages,
        currentPage,
        limit,
        searchedPatients,
        searchQuery,
        setSearchQuery,
        handleSearchPatients,
        resetSearchedPatients,
        handleUpdatePatient,
        handleDeletePatient,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error("usePatient must be used within a PatientProvider");
  }
  return context;
};
