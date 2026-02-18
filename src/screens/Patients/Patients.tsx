import React, { useState } from "react";
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

export const Patients = (): JSX.Element => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<
    (PatientData & { _id?: string }) | null
  >(null);
  const { handleAddPatient, overall } = usePatient();

  const handleAddPatients = (patient: PatientData) => {
    console.log("Add patient:", patient);

    const payload: CreatePatientPayload = {
      fullName: patient.name,
      phoneNumber: patient.countryCode + " " + patient.phone,
      age: patient.age,
      gender: patient.gender as "Male" | "Female" | "Other",
      reason: patient.reason,
    };
    handleAddPatient(payload);
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
      />
      <PatientListSection
        onEditPatient={openEditModal}
        onDeletePatient={openDeleteModal}
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
