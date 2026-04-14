// src/contexts/HospitalProvider.tsx

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  CreateHospitalPayload,
  Hospital,
  UpdateHospitalPayload,
} from "../types/hospital.type";
import {
  createHospital,
  getHospitalById,
  getHospitals,
  HOSPITAL_LIST_PAGE_LIMIT,
  parseHospitalsListResponse,
  searchHospitals,
  updateHospital,
} from "../data/hospital";

/** Full hospital document from PATCH response when present. */
function hospitalFromPatchResponse(
  res: unknown,
  hospitalId: string,
): Hospital | null {
  if (res == null || typeof res !== "object") return null;
  const o = res as Record<string, unknown>;
  const data = o.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const h = d.hospital;
    if (h && typeof h === "object" && h !== null && "_id" in h) {
      const hosp = h as Hospital;
      if (hosp._id === hospitalId) return hosp;
    }
  }
  const rootH = o.hospital;
  if (rootH && typeof rootH === "object" && rootH !== null && "_id" in rootH) {
    const hosp = rootH as Hospital;
    if (hosp._id === hospitalId) return hosp;
  }
  return null;
}

/** New logo URL from PATCH when the API returns a link without a full hospital object. */
function logoUrlFromPatchResponse(res: unknown): string | undefined {
  if (res == null || typeof res !== "object") return undefined;
  const o = res as Record<string, unknown>;
  const urlKeys = ["logoUrl", "url", "fileUrl", "imageUrl"] as const;
  const firstUrl = (x: Record<string, unknown>): string | undefined => {
    for (const k of urlKeys) {
      const v = x[k];
      if (typeof v === "string" && v.trim() !== "") return v;
    }
    return undefined;
  };
  const pick = (x: Record<string, unknown>): string | undefined => {
    const direct = firstUrl(x);
    if (direct) return direct;
    const h = x.hospital;
    if (h && typeof h === "object" && h !== null) {
      return firstUrl(h as Record<string, unknown>);
    }
    return undefined;
  };
  const data = o.data;
  if (data && typeof data === "object") {
    const fromData = pick(data as Record<string, unknown>);
    if (fromData) return fromData;
  }
  const root = pick(o);
  if (root) return root;
  return firstUrl(o);
}

interface HospitalContextType {
  hospitals: Hospital[];
  searchedHospitals: Hospital[] | null;
  /** Server total count for the current list filter (list mode). */
  totalHospitalCount: number | null;
  totalPages: number;
  currentPage: number;
  pageLimit: number;
  /** Currently loaded hospital (e.g. for Settings page, fetched by ID). */
  currentHospital: Hospital | null;
  isLoading: boolean;
  error: string | null;
  /** Loading state for fetch/update of current hospital only. */
  currentHospitalLoading: boolean;
  currentHospitalError: string | null;
  handleCreateHospital: (payload: CreateHospitalPayload) => Promise<string>;
  handleGetHospitals: (
    filters?: { isActive?: boolean | "all" },
    page?: number,
    limit?: number,
  ) => Promise<void>;
  handleSearchHospitals: (
    q: string,
    filters?: { isActive?: boolean | "all" },
    page?: number,
    limit?: number,
  ) => Promise<void>;
  resetSearchedHospitals: () => void;
  handleDeactivateHospital: (hospitalId: string) => Promise<void>;
  handleActivateHospital: (hospitalId: string) => Promise<void>;
  /** Fetch a single hospital by ID and set as currentHospital. */
  fetchHospitalById: (hospitalId: string) => Promise<void>;
  /** Update hospital by ID and refresh currentHospital if it's the same. */
  updateHospitalById: (
    hospitalId: string,
    payload: UpdateHospitalPayload,
    options?: { logo?: File | null },
  ) => Promise<void>;
  /**
   * PATCH hospital and merge into list/search/current hospital (e.g. hospitals table).
   * Does not toggle global `isLoading` or `currentHospitalLoading`.
   */
  patchHospital: (
    hospitalId: string,
    payload: UpdateHospitalPayload,
    logo?: File | null,
  ) => Promise<void>;
  clearCurrentHospital: () => void;
}

export const HospitalContext = createContext<HospitalContextType>({
  handleCreateHospital: async () => "",
  handleGetHospitals: async () => {},
  handleSearchHospitals: async () => {},
  resetSearchedHospitals: () => {},
  handleDeactivateHospital: async () => {},
  handleActivateHospital: async () => {},
  fetchHospitalById: async () => {},
  updateHospitalById: async () => {},
  patchHospital: async () => {},
  clearCurrentHospital: () => {},
  hospitals: [],
  searchedHospitals: null,
  totalHospitalCount: null,
  totalPages: 1,
  currentPage: 1,
  pageLimit: HOSPITAL_LIST_PAGE_LIMIT,
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
  const [totalHospitalCount, setTotalHospitalCount] = useState<number | null>(
    null,
  );
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(HOSPITAL_LIST_PAGE_LIMIT);

  const handleCreateHospital = async (payload: CreateHospitalPayload) => {
    setIsLoading(true);
    try {
      const hospitalId = await createHospital(payload);
      const res = await getHospitalById(hospitalId);
      const r = res as { data?: { hospital?: Hospital } };
      const newHospital = r.data?.hospital;
      if (newHospital) {
        setHospitals((prev) => [...prev, newHospital]);
      }
      setSuccess("Hospital created successfully");
      setShowToast(true);
      return hospitalId;
    } catch (error) {
      setError("Failed to create hospital");
      setShowToast(true);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetHospitals = useCallback(
    async (
      filters?: { isActive?: boolean | "all" },
      page = 1,
      limit = HOSPITAL_LIST_PAGE_LIMIT,
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const isActiveOnly =
          filters?.isActive === "all" || filters?.isActive === undefined
            ? undefined
            : filters.isActive;
        const response = await getHospitals({
          page,
          limit,
          ...(isActiveOnly !== undefined ? { isActive: isActiveOnly } : {}),
        });
        const parsed = parseHospitalsListResponse(response, page, limit);
        setHospitals(parsed.hospitals);
        setTotalPages(parsed.totalPages);
        setCurrentPage(parsed.page);
        setPageLimit(parsed.limit);
        setTotalHospitalCount(parsed.total);
      } catch (err) {
        setError("Failed to get hospitals");
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const handleSearchHospitals = useCallback(
    async (
      q: string,
      filters?: { isActive?: boolean | "all" },
      page = 1,
      limit = HOSPITAL_LIST_PAGE_LIMIT,
    ) => {
      try {
        if (!q.trim()) {
          setSearchedHospitals(null);
          return;
        }
        setIsLoading(true);
        const isActiveOnly =
          filters?.isActive === "all" || filters?.isActive === undefined
            ? undefined
            : filters.isActive;
        const response = await searchHospitals(
          q.trim(),
          page,
          limit,
          isActiveOnly,
        );
        const parsed = parseHospitalsListResponse(response, page, limit);
        setSearchedHospitals(parsed.hospitals);
        setTotalPages(parsed.totalPages);
        setCurrentPage(parsed.page);
        setPageLimit(parsed.limit);
        setTotalHospitalCount(parsed.total);
      } catch (error) {
        setError("Failed to search hospitals");
        setSearchedHospitals([]);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const resetSearchedHospitals = useCallback(
    () => setSearchedHospitals(null),
    [],
  );

  const handleDeactivateHospital = useCallback(
    async (hospitalId: string) => {
      setIsLoading(true);
      try {
        await updateHospital(hospitalId, { isActive: false });
        setHospitals((prev) =>
          prev.map((h) =>
            h._id === hospitalId ? { ...h, isActive: false } : h,
          ),
        );
        setSearchedHospitals((prev) =>
          prev
            ? prev.map((h) =>
                h._id === hospitalId ? { ...h, isActive: false } : h,
              )
            : prev,
        );
      } catch (err) {
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const handleActivateHospital = useCallback(async (hospitalId: string) => {
    setIsLoading(true);
    try {
      await updateHospital(hospitalId, { isActive: true });
      setHospitals((prev) =>
        prev.map((h) =>
          h._id === hospitalId ? { ...h, isActive: true } : h,
        ),
      );
      setSearchedHospitals((prev) =>
        prev
          ? prev.map((h) =>
              h._id === hospitalId ? { ...h, isActive: true } : h,
            )
          : prev,
      );
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const mergeHospitalRowAfterPatch = useCallback(
    (
      hospitalId: string,
      res: unknown,
      payload: UpdateHospitalPayload,
    ): ((h: Hospital) => Hospital) => {
      const full = hospitalFromPatchResponse(res, hospitalId);
      const newLogoUrl = logoUrlFromPatchResponse(res);
      return (h: Hospital) => {
        if (h._id !== hospitalId) return h;
        if (full) return full;
        const next = { ...h, ...payload } as Hospital;
        if (newLogoUrl) next.logoUrl = newLogoUrl;
        return next;
      };
    },
    [],
  );

  const updateHospitalById = async (
    hospitalId: string,
    payload: UpdateHospitalPayload,
    options?: { logo?: File | null },
  ) => {
    setCurrentHospitalLoading(true);
    setCurrentHospitalError(null);
    try {
      const res = await updateHospital(
        hospitalId,
        payload,
        options?.logo ?? undefined,
      );
      const apply = mergeHospitalRowAfterPatch(hospitalId, res, payload);
      setCurrentHospital((prev) => (prev ? apply(prev) : prev));
    } catch (err) {
      setCurrentHospitalError(
        err instanceof Error ? err.message : "Failed to update hospital",
      );
      throw err;
    } finally {
      setCurrentHospitalLoading(false);
    }
  };

  const patchHospital = useCallback(
    async (
      hospitalId: string,
      payload: UpdateHospitalPayload,
      logo?: File | null,
    ) => {
      const res = await updateHospital(hospitalId, payload, logo ?? undefined);
      const apply = mergeHospitalRowAfterPatch(hospitalId, res, payload);
      setHospitals((prev) => prev.map(apply));
      setSearchedHospitals((prev) => (prev ? prev.map(apply) : prev));
      setCurrentHospital((prev) =>
        prev && prev._id === hospitalId ? apply(prev) : prev,
      );
    },
    [mergeHospitalRowAfterPatch],
  );

  const clearCurrentHospital = () => {
    setCurrentHospital(null);
    setCurrentHospitalError(null);
  };

  return (
    <HospitalContext.Provider
      value={{
        hospitals,
        searchedHospitals,
        totalHospitalCount,
        totalPages,
        currentPage,
        pageLimit,
        currentHospital,
        isLoading,
        error,
        currentHospitalLoading,
        currentHospitalError,
        handleCreateHospital,
        handleGetHospitals,
        handleSearchHospitals,
        resetSearchedHospitals,
        handleDeactivateHospital,
        handleActivateHospital,
        fetchHospitalById,
        updateHospitalById,
        patchHospital,
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
