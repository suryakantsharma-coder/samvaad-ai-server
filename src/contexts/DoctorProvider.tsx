// create a doctor context

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
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
  normalizeDoctor,
} from "../data/doctor";
import type { ListOverallPatch } from "../lib/listOverallFromApi";
import { pickOverallFromApiData } from "../lib/listOverallFromApi";

const DEFAULT_DOCTOR_PAGE_LIMIT = 10;

function parseDoctorListResponse(
  response: unknown,
  fallbackPage: number,
  fallbackLimit: number,
): {
  doctors: Doctor[];
  page: number;
  limit: number;
  totalPages: number;
} {
  const root = response as Record<string, unknown> | undefined;
  const data =
    root && typeof root.data === "object" && root.data !== null
      ? (root.data as Record<string, unknown>)
      : {};
  const doctors = (Array.isArray(data.doctors) ? data.doctors : []) as Doctor[];
  const pag =
    data.pagination != null && typeof data.pagination === "object"
      ? (data.pagination as Record<string, unknown>)
      : {};
  const page =
    Number(pag.page ?? data.page ?? fallbackPage) || fallbackPage;
  const limit =
    Number(pag.limit ?? data.limit ?? fallbackLimit) || fallbackLimit;
  const totalPagesRaw = Number(pag.totalPages ?? data.totalPages);
  const totalRaw = Number(pag.total ?? data.total ?? data.totalCount);
  const totalPages =
    Number.isFinite(totalPagesRaw) && totalPagesRaw > 0 ?
      totalPagesRaw
    : Math.max(
        1,
        Math.ceil(
          (Number.isFinite(totalRaw) ? totalRaw : doctors.length) / limit,
        ) || 1,
      );
  return { doctors, page, limit, totalPages };
}

export const DoctorContext = createContext<{
  doctors: Doctor[];
  overall: ListOverallPatch;
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  totalPages: number;
  getDoctorsData: (opts?: { page?: number; limit?: number }) => Promise<void>;
  handleAddDoctor: (doctor: CreateDoctorPayload) => Promise<void>;
  handleUpdateDoctor: (
    doctorId: string,
    payload: UpdateDoctorPayload,
  ) => Promise<void>;
  handleDeleteDoctor: (doctorId: string) => Promise<void>;
  searchDoctorsByName: (q: string, page?: number) => Promise<void>;
  searchedDoctors: Doctor[] | null;
  resetSearchedDoctors: () => void;
}>({
  doctors: [],
  overall: {},
  loading: false,
  error: null,
  page: 1,
  limit: DEFAULT_DOCTOR_PAGE_LIMIT,
  totalPages: 1,
  getDoctorsData: () => Promise.resolve(),
  handleAddDoctor: () => Promise.resolve(),
  handleUpdateDoctor: () => Promise.resolve(),
  handleDeleteDoctor: () => Promise.resolve(),
  searchDoctorsByName: () => Promise.resolve(),
  searchedDoctors: null,
  resetSearchedDoctors: () => {},
});

export const DoctorProvider = ({ children }: { children: ReactNode }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [overall, setOverall] = useState<ListOverallPatch>({});
  const [searchedDoctors, setSearchedDoctors] = useState<Doctor[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_DOCTOR_PAGE_LIMIT);
  const [totalPages, setTotalPages] = useState(1);

  const getDoctorsData = useCallback(
    async (opts?: { page?: number; limit?: number }) => {
      const nextPage = opts?.page ?? page;
      const nextLimit = opts?.limit ?? limit;
      try {
        setLoading(true);
        setError(null);
        const response = await getDoctors(nextPage, nextLimit);
        const data = (response as { data?: Record<string, unknown> })?.data;
        const parsed = parseDoctorListResponse(
          response,
          nextPage,
          nextLimit,
        );
        setDoctors(parsed.doctors);
        setPage(parsed.page);
        setLimit(parsed.limit);
        setTotalPages(parsed.totalPages);
        if (data) {
          const overallPatch = pickOverallFromApiData(data);
          if (Object.keys(overallPatch).length > 0) {
            setOverall((prev) => ({ ...prev, ...overallPatch }));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load doctors");
      } finally {
        setLoading(false);
      }
    },
    [page, limit],
  );

  const handleAddDoctor = async (doctor: CreateDoctorPayload) => {
    try {
      setLoading(true);
      setError(null);
      const response = await addDoctor(doctor);
      const created = response.data?.doctor;
      if (created) {
        setDoctors((prev) => [...prev, normalizeDoctor(created)]);
      } else {
        await getDoctorsData({ page: 1 });
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

  const searchDoctorsByName = useCallback(
    async (q: string, searchPage = 1) => {
      try {
        if (!q.trim()) {
          setSearchedDoctors(null);
          return;
        }
        setLoading(true);
        setError(null);
        const response = await searchDoctors(q.trim(), searchPage, limit);
        const parsed = parseDoctorListResponse(response, searchPage, limit);
        setSearchedDoctors(parsed.doctors);
        setPage(parsed.page);
        setLimit(parsed.limit);
        setTotalPages(parsed.totalPages);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to search doctors",
        );
        setSearchedDoctors([]);
      } finally {
        setLoading(false);
      }
    },
    [limit],
  );

  const resetSearchedDoctors = useCallback(() => {
    setSearchedDoctors(null);
  }, []);

  const handleUpdateDoctor = async (
    doctorId: string,
    payload: UpdateDoctorPayload,
  ) => {
    try {
      setLoading(true);
      setError(null);
      await updateDoctor(doctorId, payload);
      await getDoctorsData({ page: 1 });
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
      await getDoctorsData({ page: 1 });
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
        overall,
        loading,
        error,
        page,
        limit,
        totalPages,
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
