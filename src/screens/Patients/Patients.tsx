import React, { useMemo, useState } from "react";
import {
  AddPatientModal,
  DeletePatientModal,
  EditPatientModal,
} from "../../components/modals";
import { PatientData } from "../../components/modals/AddPatientModal";
import { PatientHeaderSection } from "./sections/PatientHeaderSection";
import { PatientListSection } from "./sections/PatientListSection";
import { PatientSearchSection } from "./sections/PatientSearchSection";
import { usePatient } from "../../contexts/PatientProvider";
import { CreatePatientPayload } from "../../types/patient.type";

function toYMDLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Inclusive last 30 days: today and the 29 prior calendar days. */
function getDefaultPatientListDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return { start: toYMDLocal(start), end: toYMDLocal(end) };
}

export const Patients = (): JSX.Element => {
  const defaultListDateRange = useMemo(
    () => getDefaultPatientListDateRange(),
    [],
  );
  const [listStartDate, setListStartDate] = useState(
    defaultListDateRange.start,
  );
  const [listEndDate, setListEndDate] = useState(defaultListDateRange.end);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<
    (PatientData & { _id?: string }) | null
  >(null);
  const { handleAddPatient, overall } = usePatient();

  const handleAddPatients = async (patient: PatientData) => {
    const payload: CreatePatientPayload = {
      fullName: patient.name,
      phoneNumber: patient.countryCode + " " + patient.phone,
      age: patient.age,
      gender: patient.gender as "Male" | "Female" | "Other",
      reason: patient.reason,
    };
    await handleAddPatient(payload);
  };

  const handleEditPatient = (patient: PatientData & { _id?: string }) => {
    console.log("Edit patient:", patient);
    setEditModalOpen(false);
  };

  const handleDeletePatient = () => {
    console.log("Delete patient:", selectedPatient);
    setDeleteModalOpen(false);
  };

  const openEditModal = (patient: PatientData & { _id?: string }) => {
    console.log("Open edit modal:", patient);
    setSelectedPatient(patient);
    setEditModalOpen(true);
  };

  const openDeleteModal = (patient: PatientData & { _id?: string }) => {
    setSelectedPatient(patient);
    setDeleteModalOpen(true);
  };

  return (
    <div className="bg-app-background w-full min-h-screen flex flex-col gap-[25px] p-4 md:p-6">
      <PatientSearchSection />
      <PatientHeaderSection
        onAddPatient={() => setAddModalOpen(true)}
        totalPatients={overall?.totalPatients}
        startDate={listStartDate}
        endDate={listEndDate}
        onStartDateChange={setListStartDate}
        onEndDateChange={setListEndDate}
      />
      <PatientListSection
        onEditPatient={openEditModal}
        onDeletePatient={openDeleteModal}
        listStartDate={listStartDate}
        listEndDate={listEndDate}
      />

      <AddPatientModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSave={handleAddPatients}
      />

      <EditPatientModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={handleEditPatient}
        patient={selectedPatient}
      />

      <DeletePatientModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onDelete={handleDeletePatient}
        patientName={selectedPatient?.name || ""}
        patient={selectedPatient}
      />
    </div>
  );
};
