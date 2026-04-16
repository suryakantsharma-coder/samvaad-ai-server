// create patient provider

import { createContext, useContext, useRef, useState } from "react";
import { showSuccess, showError } from "../lib/toast";
import {
  getPatients,
  searchPatients,
  updatePatient,
} from "../data/patient";
import { pickOverallFromApiData } from "../lib/listOverallFromApi";
import {
  CreatePatientPayload,
  Patients,
  UpdatePatientPayload,
} from "../types/patient.type";
import { createPatient, deletePatient } from "../data/patient";

export interface PatientOverall {
  totalPatients?: number;
  totalDoctors?: number;
}

export interface PatientCounts {
  all: number;
  today: number;
  tomorrow: number;
}

interface PatientContextType {
  patients: Patients[];
  overall: PatientOverall;
  counts: PatientCounts;
  loading: boolean;
  error: string | null;
  handleAddPatient: (patient: CreatePatientPayload) => void;
  handlePatient: (
    page?: number,
    limit?: number,
    filter?: "all" | "today" | "tomorrow",
    doctorScope?: string | { doctorId?: string; doctor?: string },
    dateRange?: { startDate: string; endDate: string },
  ) => void;
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
  const [counts, setCounts] = useState<PatientCounts>({ all: 0, today: 0, tomorrow: 0 });
  const [searchedPatients, setSearchedPatients] = useState<Patients[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  /** When omitted on `handlePatient`, last non-empty list filter is reused (e.g. after delete). */
  const listDoctorIdRef = useRef<string | null>(null);
  /** Optional `doctor=` query (doctor-role name filter); reapplied when scope object omits keys. */
  const listDoctorNameRef = useRef<string | null>(null);
  /** YYYY-MM-DD; when `dateRange` arg omitted, previous range is reused. */
  const listDateStartRef = useRef<string | null>(null);
  const listDateEndRef = useRef<string | null>(null);

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
      showSuccess("Success!", "Patient added successfully.");
    } catch (error) {
      const msg = error as string;
      setError(msg);
      showError("Error", msg);
    }
  };

  const handlePatient = async (
    page = 1,
    pageLimit = 10,
    filter: "all" | "today" | "tomorrow" = "all",
    doctorScope?: string | { doctorId?: string; doctor?: string },
    dateRange?: { startDate: string; endDate: string },
  ) => {
    try {
      setLoading(true);
      if (doctorScope !== undefined) {
        if (typeof doctorScope === "string") {
          const trimmed = doctorScope.trim();
          listDoctorIdRef.current = trimmed.length > 0 ? trimmed : null;
          listDoctorNameRef.current = null;
        } else {
          const id = doctorScope.doctorId?.trim();
          const dn = doctorScope.doctor?.trim();
          listDoctorIdRef.current = id && id.length > 0 ? id : null;
          listDoctorNameRef.current = dn && dn.length > 0 ? dn : null;
        }
      }
      if (dateRange !== undefined) {
        const s = dateRange.startDate?.trim();
        const e = dateRange.endDate?.trim();
        listDateStartRef.current = s && s.length > 0 ? s : null;
        listDateEndRef.current = e && e.length > 0 ? e : null;
      }
      const response = await getPatients(
        page,
        pageLimit,
        filter,
        listDoctorIdRef.current,
        listDateStartRef.current,
        listDateEndRef.current,
        listDoctorNameRef.current,
      );
      setPatients(response.data?.patients ?? []);
      const overallPatch = pickOverallFromApiData(response.data);
      if (Object.keys(overallPatch).length > 0) {
        setOverall((prev) => ({ ...prev, ...overallPatch }));
      }
      const nextCounts = response.data?.counts;
      if (nextCounts && typeof nextCounts.all === "number") {
        setCounts({
          all: nextCounts.all ?? 0,
          today: nextCounts.today ?? 0,
          tomorrow: nextCounts.tomorrow ?? 0,
        });
      }
      const pagination = response.data?.pagination;
      if (pagination) {
        setTotalPages(pagination.totalPages);
        setCurrentPage(pagination.page);
        setLimit(pagination.limit);
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
      await handlePatient(1, limit, "all");
      showSuccess("Success!", "Patient updated successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      showError("Error", message);
    }
  };

  const handleSearchPatients = async (q: string) => {
    try {
      if (!q.trim()) {
        setSearchedPatients([]);
        return;
      }
      const response = await searchPatients(q.trim(), 1, 10);
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
      await handlePatient(1, limit, "all");
      showSuccess("Success!", "Patient deleted successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      showError("Error", message);
    }
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        overall,
        counts,
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
