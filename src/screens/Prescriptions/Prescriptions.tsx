import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NewPrescriptionModal } from "../../components/modals";
import type { NewPrescriptionPayload } from "../../components/modals/NewPrescriptionModal";
import { usePrescription } from "../../contexts/PrescriptionProvider";
import type {
  CreatePrescriptionPayload,
  Prescription,
} from "../../types/prescription.type";
import { PatientSearchSection } from "../Patients/sections/PatientSearchSection";
import { PrescriptionsHeaderSection } from "./sections/PrescriptionHeaderSection/ PrescriptionsHeaderSection";
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

export const Prescriptions = (): JSX.Element => {
  const navigate = useNavigate();
  const [showNewPrescriptionModal, setShowNewPrescriptionModal] =
    useState(false);
  const [editingPrescription, setEditingPrescription] =
    useState<Prescription | null>(null);
  const {
    handleCreatePrescription,
    handleUpdatePrescription,
    handleGetPrescriptions,
    limit,
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
      await handleGetPrescriptions(1, limit);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create prescription");
    }
  };

  const handleUpdatePrescriptionSubmit = async (
    prescriptionId: string,
    payload: Parameters<typeof handleUpdatePrescription>[1],
  ) => {
    try {
      await handleUpdatePrescription(prescriptionId, payload);
      handleCloseModal(false);
      await handleGetPrescriptions(1, limit);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update prescription");
    }
  };

  return (
    <div className="bg-app-background w-full min-h-screen flex flex-col gap-[25px] p-4 md:p-6">
      <PatientSearchSection />
      <PrescriptionsHeaderSection
        onAddPrescription={() => setShowNewPrescriptionModal(true)}
      />
      <NewPrescriptionModal
        open={modalOpen}
        onOpenChange={handleCloseModal}
        onSave={handleSavePrescription}
        onUpdate={handleUpdatePrescriptionSubmit}
        initialPrescription={editingPrescription}
      />
      <PrescriptionListSection
        onEditPrescription={(p) => setEditingPrescription(p)}
        onDeletePrescription={() => {}}
        onMarkAsDonePrescription={() => {}}
        onViewRecord={(p) =>
          navigate(`/prescriptions/patient/${p.patient}`)
        }
      />
    </div>
  );
};
