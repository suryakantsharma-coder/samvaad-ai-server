import { useMemo, useState } from "react";
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
import { PatientSearchSection } from "../Patients/sections/PatientSearchSection";
import { PrescriptionsHeaderSection } from "./sections/PrescriptionHeaderSection/ PrescriptionsHeaderSection";
import { PrescriptionListSection } from "./sections/PrescriptionListSection/PrescriptionListSection";

function toYMDLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDefaultPrescriptionListDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return { start: toYMDLocal(start), end: toYMDLocal(end) };
}

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

export const Prescriptions = (): JSX.Element => {
  const defaultListDateRange = useMemo(
    () => getDefaultPrescriptionListDateRange(),
    [],
  );
  const [listStartDate, setListStartDate] = useState(defaultListDateRange.start);
  const [listEndDate, setListEndDate] = useState(defaultListDateRange.end);
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
    <div className="bg-app-background w-full min-h-screen flex flex-col gap-[25px] p-4 md:p-6">
      <PatientSearchSection />
      <PrescriptionsHeaderSection
        onAddPrescription={() => setShowNewPrescriptionModal(true)}
        startDate={listStartDate}
        endDate={listEndDate}
        onStartDateChange={setListStartDate}
        onEndDateChange={setListEndDate}
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
        onEditPrescription={(p) => setEditingPrescription(p)}
        onDeletePrescription={(p) => setPrescriptionPendingDelete(p)}
        onMarkAsDonePrescription={() => {}}
        onViewRecord={(p) => setViewingPrescription(p)}
        onPrescriptionReport={(p) => downloadPrescriptionReportPdf(p)}
      />
    </div>
  );
};
