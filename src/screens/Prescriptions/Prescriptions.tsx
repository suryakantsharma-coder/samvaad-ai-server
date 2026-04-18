import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthProvider";
import { getDoctorsForAccountLinking } from "../../data/doctor";
import type { Doctor } from "../../types/doctor.type";
import { currentMonthStartEndYmd } from "../../lib/currentMonthDateRange";
import { showSuccess, showError } from "../../lib/toast";
import { downloadPrescriptionReportPdf } from "../../lib/prescriptionPdf";
import {
  DeletePrescriptionModal,
  NewPrescriptionModal,
  PrescriptionViewModal,
} from "../../components/modals";
import type { NewPrescriptionPayload } from "../../components/modals/NewPrescriptionModal";
import { usePrescription } from "../../contexts/PrescriptionProvider";
import type {
  CreatePrescriptionPayload,
  Prescription,
} from "../../types/prescription.type";
import {
  PrescriptionsHeaderSection,
  type PrescriptionsHeaderDoctorOption,
} from "./sections/PrescriptionHeaderSection/ PrescriptionsHeaderSection";
import { PrescriptionListSection } from "./sections/PrescriptionListSection/PrescriptionListSection";

function mapModalPayloadToCreate(
  payload: NewPrescriptionPayload,
  appointmentId: string,
): CreatePrescriptionPayload {
  return {
    patient: payload.patientId,
    appointment: appointmentId,
    patientName: payload.patientName,
    appointmentDate: new Date(payload.appointmentDate).toISOString(),
    followUp: { value: payload.followUpDays, unit: "Days" },
    medicines: payload.medicines.map((m) => ({
      name: m.name,
      dosage: {
        value: m.dosage,
        unit: m.dosageUnit as "mg" | "ml" | "g" | "tablet" | "capsule",
      },
      duration: {
        value: m.duration,
        unit: (m.durationUnit === "Week"
          ? "Weeks"
          : m.durationUnit === "Month"
            ? "Months"
            : "Days") as "Days" | "Weeks" | "Months",
      },
      intake: m.intake as "Before" | "After",
      time: { breakfast: m.breakfast, lunch: m.lunch, dinner: m.dinner },
      notes: m.notes || undefined,
    })),
    status: "Draft",
  };
}

function uniqueDoctorsWithEmail(
  doctors: Doctor[],
): PrescriptionsHeaderDoctorOption[] {
  const seen = new Set<string>();
  const out: PrescriptionsHeaderDoctorOption[] = [];
  for (const d of doctors) {
    const e = String(d.email ?? "").trim();
    if (!e) continue;
    const k = e.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ _id: d._id, fullName: d.fullName, email: e });
  }
  return out;
}

export const Prescriptions = (): JSX.Element => {
  const { user } = useAuth();
  const defaultListDateRange = useMemo(() => currentMonthStartEndYmd(), []);
  const [listStartDate, setListStartDate] = useState(defaultListDateRange.start);
  const [listEndDate, setListEndDate] = useState(defaultListDateRange.end);
  const [listDoctorEmail, setListDoctorEmail] = useState("");
  const [doctorsForFilterRaw, setDoctorsForFilterRaw] = useState<Doctor[]>([]);
  const [doctorsForFilterLoading, setDoctorsForFilterLoading] = useState(false);

  const hasHospital = Boolean(String(user?.hospital ?? "").trim());
  const isDoctorRole = user?.role === "doctor";
  /** Header dropdown only for staff who pick a doctor; doctors use their login email for the API. */
  const showDoctorDropdown =
    (user?.role === "hospital_admin" || user?.role === "admin") && hasHospital;

  const doctorLoginEmail = useMemo(
    () => String(user?.email ?? "").trim(),
    [user?.email],
  );

  /** For `doctor` role: always filter by logged-in user email (no header dropdown). */
  const effectiveListDoctorEmail = useMemo(() => {
    if (isDoctorRole) return doctorLoginEmail;
    return listDoctorEmail;
  }, [isDoctorRole, doctorLoginEmail, listDoctorEmail]);

  const doctorsForFilter = useMemo(
    () => uniqueDoctorsWithEmail(doctorsForFilterRaw),
    [doctorsForFilterRaw],
  );

  const loadDoctorsForFilter = useCallback(() => {
    if (!showDoctorDropdown) {
      setDoctorsForFilterRaw([]);
      return;
    }
    setDoctorsForFilterLoading(true);
    void getDoctorsForAccountLinking(500)
      .then((list) => setDoctorsForFilterRaw(Array.isArray(list) ? list : []))
      .catch(() => setDoctorsForFilterRaw([]))
      .finally(() => setDoctorsForFilterLoading(false));
  }, [showDoctorDropdown]);

  useEffect(() => {
    loadDoctorsForFilter();
  }, [loadDoctorsForFilter]);
  const [showNewPrescriptionModal, setShowNewPrescriptionModal] =
    useState(false);
  const [editingPrescription, setEditingPrescription] =
    useState<Prescription | null>(null);
  const [viewingPrescription, setViewingPrescription] =
    useState<Prescription | null>(null);
  const [prescriptionPendingDelete, setPrescriptionPendingDelete] =
    useState<Prescription | null>(null);
  const {
    handleCreatePrescription,
    handleUpdatePrescription,
    handleGetPrescriptions,
    handleDeletePrescription: deletePrescriptionById,
    limit,
    currentStatusFilter,
    overall,
  } = usePrescription();

  const modalOpen = showNewPrescriptionModal || editingPrescription !== null;

  const handleCloseModal = (open: boolean) => {
    if (!open) {
      setShowNewPrescriptionModal(false);
      setEditingPrescription(null);
    }
  };

  const handleSavePrescription = async (payload: NewPrescriptionPayload) => {
    try {
      await handleCreatePrescription(
        mapModalPayloadToCreate(payload, payload.appointmentId),
      );
      handleCloseModal(false);
      await handleGetPrescriptions(1, limit, {
        startDate: listStartDate,
        endDate: listEndDate,
        doctorEmail: effectiveListDoctorEmail,
        ...(currentStatusFilter != null ? { status: currentStatusFilter } : {}),
      });
      showSuccess("Success!", "Prescription created successfully.");
    } catch (e) {
      showError(
        "Error",
        e instanceof Error ? e.message : "Failed to create prescription",
      );
    }
  };

  const handleUpdatePrescriptionSubmit = async (
    prescriptionId: string,
    payload: Parameters<typeof handleUpdatePrescription>[1],
  ) => {
    try {
      await handleUpdatePrescription(prescriptionId, payload);
      handleCloseModal(false);
      await handleGetPrescriptions(1, limit, {
        startDate: listStartDate,
        endDate: listEndDate,
        doctorEmail: effectiveListDoctorEmail,
        ...(currentStatusFilter != null ? { status: currentStatusFilter } : {}),
      });
      showSuccess("Success!", "Prescription updated successfully.");
    } catch (e) {
      showError(
        "Error",
        e instanceof Error ? e.message : "Failed to update prescription",
      );
    }
  };

  return (
    <div className="w-full flex flex-col gap-[25px] p-4 md:p-6">
      <PrescriptionsHeaderSection
        onAddPrescription={() => setShowNewPrescriptionModal(true)}
        totalPrescriptions={overall?.totalPrescriptions}
        totalDoctors={overall?.totalDoctors}
        startDate={listStartDate}
        endDate={listEndDate}
        onStartDateChange={setListStartDate}
        onEndDateChange={setListEndDate}
        showDoctorFilter={showDoctorDropdown}
        doctorsForFilter={doctorsForFilter}
        doctorsForFilterLoading={doctorsForFilterLoading}
        doctorEmailFilter={listDoctorEmail}
        onDoctorEmailFilterChange={setListDoctorEmail}
      />
      <NewPrescriptionModal
        open={modalOpen}
        onOpenChange={handleCloseModal}
        onSave={handleSavePrescription}
        onUpdate={handleUpdatePrescriptionSubmit}
        initialPrescription={editingPrescription}
      />
      <DeletePrescriptionModal
        open={prescriptionPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPrescriptionPendingDelete(null);
        }}
        onClose={() => setPrescriptionPendingDelete(null)}
        prescription={prescriptionPendingDelete}
        onConfirm={async () => {
          if (!prescriptionPendingDelete) return;
          await deletePrescriptionById(prescriptionPendingDelete._id);
        }}
      />
      <PrescriptionViewModal
        open={viewingPrescription !== null}
        onOpenChange={(open) => {
          if (!open) setViewingPrescription(null);
        }}
        prescription={viewingPrescription}
      />
      <PrescriptionListSection
        listStartDate={listStartDate}
        listEndDate={listEndDate}
        listDoctorEmail={effectiveListDoctorEmail}
        onEditPrescription={(p) => setEditingPrescription(p)}
        onDeletePrescription={(p) => setPrescriptionPendingDelete(p)}
        onMarkAsDonePrescription={() => {}}
        onViewRecord={(p) => setViewingPrescription(p)}
        onPrescriptionReport={(p) => downloadPrescriptionReportPdf(p)}
      />
    </div>
  );
};
