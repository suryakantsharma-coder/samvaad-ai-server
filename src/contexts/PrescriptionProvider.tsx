import { createContext, useContext, useState } from "react";
import {
  createPrescription,
  deletePrescription,
  getPrescriptions,
  searchPrescriptions,
  updatePrescription,
} from "../data/prescription";
import type { PrescriptionStatusFilter } from "../data/prescription";
import {
  CreatePrescriptionPayload,
  Prescription,
  UpdatePrescriptionPayload,
} from "../types/prescription.type";

interface PrescriptionListOptions {
  status?: PrescriptionStatusFilter;
  patientId?: string;
  appointmentId?: string;
}

interface PrescriptionContextType {
  prescriptions: Prescription[];
  searchedPrescriptions: Prescription[] | null;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  limit: number;
  currentStatusFilter: PrescriptionStatusFilter | null;
  handleGetPrescriptions: (
    page: number,
    limit: number,
    options?: PrescriptionListOptions,
  ) => Promise<void>;
  handleSearchPrescriptions: (q: string) => Promise<void>;
  resetSearchedPrescriptions: () => void;
  handleCreatePrescription: (payload: CreatePrescriptionPayload) => Promise<void>;
  handleUpdatePrescription: (
    prescriptionId: string,
    payload: UpdatePrescriptionPayload,
  ) => Promise<void>;
  handleDeletePrescription: (prescriptionId: string) => Promise<void>;
}

const PrescriptionContext = createContext<PrescriptionContextType | undefined>(
  undefined,
);

export const PrescriptionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchedPrescriptions, setSearchedPrescriptions] = useState<
    Prescription[] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [currentStatusFilter, setCurrentStatusFilter] =
    useState<PrescriptionStatusFilter | null>(null);

  const handleGetPrescriptions = async (
    page: number,
    pageLimit: number,
    options?: PrescriptionListOptions,
  ) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentStatusFilter(options?.status ?? null);
      const response = await getPrescriptions({
        page,
        limit: pageLimit,
        status: options?.status,
        patientId: options?.patientId,
        appointmentId: options?.appointmentId,
      });
      const list = response.data?.prescriptions ?? [];
      setPrescriptions(Array.isArray(list) ? list : []);
      const pagination = response.data?.pagination;
      if (pagination) {
        setTotalPages(pagination.totalPages ?? 1);
        setCurrentPage(pagination.page ?? 1);
        setLimit(pagination.limit ?? pageLimit);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPrescriptions = async (q: string) => {
    try {
      if (!q.trim()) {
        setSearchedPrescriptions(null);
        return;
      }
      setLoading(true);
      setError(null);
      const response = await searchPrescriptions(q.trim(), 1, 20);
      const list = response.data?.prescriptions ?? [];
      setSearchedPrescriptions(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSearchedPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const resetSearchedPrescriptions = () => setSearchedPrescriptions(null);

  const handleCreatePrescription = async (
    payload: CreatePrescriptionPayload,
  ) => {
    try {
      const response = await createPrescription(payload);
      const created =
        response.data?.prescription ?? response.data;
      if (created && typeof created === "object") {
        setPrescriptions((prev) => [created as Prescription, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  };

  const handleUpdatePrescription = async (
    prescriptionId: string,
    payload: UpdatePrescriptionPayload,
  ) => {
    try {
      await updatePrescription(prescriptionId, payload);
      await handleGetPrescriptions(currentPage, limit, {
        status: currentStatusFilter ?? undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  };

  const handleDeletePrescription = async (prescriptionId: string) => {
    try {
      await deletePrescription(prescriptionId);
      await handleGetPrescriptions(currentPage, limit, {
        status: currentStatusFilter ?? undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  };

  return (
    <PrescriptionContext.Provider
      value={{
        prescriptions,
        searchedPrescriptions,
        loading,
        error,
        totalPages,
        currentPage,
        limit,
        currentStatusFilter,
        handleGetPrescriptions,
        handleSearchPrescriptions,
        resetSearchedPrescriptions,
        handleCreatePrescription,
        handleUpdatePrescription,
        handleDeletePrescription,
      }}
    >
      {children}
    </PrescriptionContext.Provider>
  );
};

export const usePrescription = () => {
  const context = useContext(PrescriptionContext);
  if (!context) {
    throw new Error(
      "usePrescription must be used within a PrescriptionProvider",
    );
  }
  return context;
};
