import { useState } from "react";
import { NewPrescriptionModal } from "../../components/modals";
import { PatientSearchSection } from "../Patients/sections/PatientSearchSection";
import { PrescriptionsHeaderSection } from "./sections/PrescriptionHeaderSection/ PrescriptionsHeaderSection";
import { PrescriptionListSection } from "./sections/PrescriptionListSection/PrescriptionListSection";

export const Prescriptions = (): JSX.Element => {
  const [showNewPrescriptionModal, setShowNewPrescriptionModal] =
    useState(false);
  const [showMarkAsDoneModal, setShowMarkAsDoneModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  return (
    <div className="bg-app-background w-full min-h-screen flex flex-col gap-[25px] p-4 md:p-6">
      <PatientSearchSection />
      <PrescriptionsHeaderSection
        onAddPrescription={() => setShowNewPrescriptionModal(true)}
      />
      <NewPrescriptionModal
        open={showNewPrescriptionModal}
        onOpenChange={setShowNewPrescriptionModal}
        onSave={(payload) => {
          console.log("Prescription saved", payload);
          setShowNewPrescriptionModal(false);
        }}
      />
      <PrescriptionListSection
        onEditPrescription={() => {
          // setShowEditModal(true);
          // setPrescriptionData(prescription);
        }}
        onDeletePrescription={() => {
          // setShowDeleteModal(true);
          // setPrescriptionData(prescription);
        }}
        onMarkAsDonePrescription={() => {
          // setShowMarkAsDoneModal(true);
          // setPrescriptionData(prescription);
        }}
      />
    </div>
  );
};
