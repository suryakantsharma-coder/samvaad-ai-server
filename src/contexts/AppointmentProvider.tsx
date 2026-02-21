// src/contexts/AppointmentProvider.tsx

import { createContext, useContext, useState } from "react";
import { showSuccess, showError } from "../lib/toast";
import {
  createAppointment,
  deleteAppointment,
  getAppointments,
  MarkAsDoneAppointment,
  searchAppointments,
  updateAppointment,
} from "../data/appointment";
import {
  Appointments,
  AppointmentPayload,
  RescheduleAppointmentPayload,
} from "../types/appointment.type";

export interface AppointmentCounts {
  all: number;
  today: number;
  tomorrow: number;
}

export interface AppointmentOverall {
  totalAppointments?: number;
  totalPatients?: number;
}

interface AppointmentListOptions {
  filter?: "all" | "today" | "tomorrow";
  fromDate?: string;
  toDate?: string;
  doctorId?: string;
  patientId?: string;
  status?: string;
}

interface AppointmentContextType {
  appointments: Appointments[];
  searchedAppointments: Appointments[] | null;
  counts: AppointmentCounts;
  overall: AppointmentOverall;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  limit: number;
  currentFilter: "all" | "today" | "tomorrow";
  handleGetAppointments: (
    page: number,
    limit: number,
    options?: AppointmentListOptions,
  ) => Promise<void>;
  handleSearchAppointments: (q: string) => Promise<void>;
  resetSearchedAppointments: () => void;
  handleCreateAppointment: (appointment: AppointmentPayload) => Promise<void>;
  handleDeleteAppointment: (appointmentId: string) => Promise<void>;
  handleUpdateAppointment: (
    appointmentId: string,
    payload: RescheduleAppointmentPayload,
  ) => Promise<void>;
  handleMarkAsDoneAppointment: (appointmentId: string) => Promise<void>;
}
const AppointmentContext = createContext<AppointmentContextType | undefined>(
  undefined,
);

export const AppointmentProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [appointments, setAppointments] = useState<Appointments[]>([]);
  const [searchedAppointments, setSearchedAppointments] = useState<Appointments[] | null>(null);
  const [counts, setCounts] = useState<AppointmentCounts>({ all: 0, today: 0, tomorrow: 0 });
  const [overall, setOverall] = useState<AppointmentOverall>({});
  const [currentFilter, setCurrentFilter] = useState<"all" | "today" | "tomorrow">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const handleGetAppointments = async (
    page: number,
    limit: number,
    options?: AppointmentListOptions,
  ) => {
    try {
      setLoading(true);
      const filter = options?.filter ?? "all";
      setCurrentFilter(filter);
      const response = await getAppointments({
        page,
        limit,
        filter,
        fromDate: options?.fromDate,
        toDate: options?.toDate,
        doctorId: options?.doctorId,
        patientId: options?.patientId,
        status: options?.status,
      });
      setAppointments(response.data?.appointments ?? []);
      const nextCounts = response.data?.counts;
      if (nextCounts && typeof nextCounts.all === "number") {
        setCounts({
          all: nextCounts.all ?? 0,
          today: nextCounts.today ?? 0,
          tomorrow: nextCounts.tomorrow ?? 0,
        });
      }
      const nextOverall = response.data?.overall;
      if (nextOverall) {
        setOverall({
          totalAppointments: nextOverall.totalAppointments,
          totalPatients: nextOverall.totalPatients,
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

  const handleSearchAppointments = async (q: string) => {
    try {
      if (!q.trim()) {
        setSearchedAppointments(null);
        return;
      }
      setLoading(true);
      const response = await searchAppointments(q.trim(), 1, 20);
      setSearchedAppointments((response.data?.appointments ?? []) as Appointments[]);
    } catch (error) {
      setError(error as string);
      setSearchedAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const resetSearchedAppointments = () => setSearchedAppointments(null);

  const handleCreateAppointment = async (appointment: AppointmentPayload) => {
    try {
      const response = await createAppointment(appointment);
      setAppointments([...appointments, response.data.appointment]);
      showSuccess("Success!", "Appointment created successfully.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setError(msg);
      showError("Error", msg);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      await deleteAppointment(appointmentId);
      await handleGetAppointments(currentPage, limit, { filter: currentFilter });
      showSuccess("Success!", "Appointment deleted successfully.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setError(msg);
      showError("Error", msg);
    }
  };

  const handleUpdateAppointment = async (
    _appointmentId: string,
    payload: RescheduleAppointmentPayload,
  ) => {
    try {
      await updateAppointment(_appointmentId, payload);
      await handleGetAppointments(currentPage, limit, { filter: currentFilter });
      showSuccess("Success!", "Appointment updated successfully.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setError(msg);
      showError("Error", msg);
    }
  };

  const handleMarkAsDoneAppointment = async (appointmentId: string) => {
    try {
      await MarkAsDoneAppointment(appointmentId);
      await handleGetAppointments(currentPage, limit, { filter: currentFilter });
      showSuccess("Success!", "Appointment marked as done successfully.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setError(msg);
      showError("Error", msg);
    }
  };

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        searchedAppointments,
        counts,
        overall,
        currentFilter,
        loading,
        error,
        totalPages,
        currentPage,
        limit,
        handleGetAppointments,
        handleSearchAppointments,
        resetSearchedAppointments,
        handleCreateAppointment,
        handleDeleteAppointment,
        handleUpdateAppointment,
        handleMarkAsDoneAppointment,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error(
      "useAppointments must be used within an AppointmentProvider",
    );
  }
  return context;
};
