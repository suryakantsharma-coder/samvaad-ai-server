import { createContext, useContext, useRef, useState } from "react";
import {
  createPrescription,
  deletePrescription,
  getPrescriptions,
  searchPrescriptions,
  updatePrescription,
} from "../data/prescription";
import type { ListOverallPatch } from "../lib/listOverallFromApi";
import { pickOverallFromApiData } from "../lib/listOverallFromApi";
import { showSuccess, showError } from "../lib/toast";
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
  startDate?: string;
  endDate?: string;
}

interface PrescriptionContextType {
  prescriptions: Prescription[];
  searchedPrescriptions: Prescription[] | null;
  overall: ListOverallPatch;
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
  handleSearchPrescriptions: (
    q: string,
    page?: number,
    pageLimit?: number,
  ) => Promise<void>;
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
  const [overall, setOverall] = useState<ListOverallPatch>({});
  const [searchedPrescriptions, setSearchedPrescriptions] = useState<
    Prescription[] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [currentStatusFilter, setCurrentStatusFilter] =
    useState<PrescriptionStatusFilter | null>(null);
  const listStartDateRef = useRef<string | null>(null);
  const listEndDateRef = useRef<string | null>(null);

  const handleGetPrescriptions = async (
    page: number,
    pageLimit: number,
    options?: PrescriptionListOptions,
  ) => {
    try {
      setLoading(true);
      setError(null);
      if (options != null && options.status !== undefined) {
        setCurrentStatusFilter(options.status);
      }
      if (options) {
        if ("startDate" in options) {
          const v = options.startDate;
          listStartDateRef.current =
            typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
        }
        if ("endDate" in options) {
          const v = options.endDate;
          listEndDateRef.current =
            typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
        }
      }
      const statusForRequest =
        options != null && options.status !== undefined
          ? options.status
          : currentStatusFilter ?? undefined;
      const response = await getPrescriptions({
        page,
        limit: pageLimit,
        status: statusForRequest,
        patientId: options?.patientId,
        appointmentId: options?.appointmentId,
        startDate: listStartDateRef.current ?? undefined,
        endDate: listEndDateRef.current ?? undefined,
      });
      const list = response.data?.prescriptions ?? [];
      setPrescriptions(Array.isArray(list) ? list : []);
      const overallPatch = pickOverallFromApiData(response.data);
      if (Object.keys(overallPatch).length > 0) {
        setOverall((prev) => ({ ...prev, ...overallPatch }));
      }
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

  const handleSearchPrescriptions = async (
    q: string,
    page = 1,
    pageLimit?: number,
  ) => {
    try {
      if (!q.trim()) {
        setSearchedPrescriptions(null);
        return;
      }
      setLoading(true);
      setError(null);
      const lim = pageLimit ?? limit;
      const response = await searchPrescriptions(q.trim(), page, lim);
      const list = response.data?.prescriptions ?? [];
      setSearchedPrescriptions(Array.isArray(list) ? list : []);
      const overallPatch = pickOverallFromApiData(response.data);
      if (Object.keys(overallPatch).length > 0) {
        setOverall((prev) => ({ ...prev, ...overallPatch }));
      }
      const pagination = response.data?.pagination;
      if (pagination) {
        setTotalPages(pagination.totalPages ?? 1);
        setCurrentPage(pagination.page ?? page);
        setLimit(pagination.limit ?? lim);
      } else {
        setCurrentPage(page);
        setTotalPages(1);
      }
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
        ...(currentStatusFilter != null ? { status: currentStatusFilter } : {}),
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
        ...(currentStatusFilter != null ? { status: currentStatusFilter } : {}),
      });
      showSuccess("Success!", "Prescription deleted successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showError("Error", msg);
      throw err;
    }
  };

  return (
    <PrescriptionContext.Provider
      value={{
        prescriptions,
        searchedPrescriptions,
        overall,
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
