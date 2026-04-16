import React, { useMemo, useState } from "react";
import {
  AddPatientModal,
  DeletePatientModal,
  EditPatientModal,
} from "../../components/modals";
import { PatientData } from "../../components/modals/AddPatientModal";
import { PatientHeaderSection } from "./sections/PatientHeaderSection";
import { PatientListSection } from "./sections/PatientListSection";
import { usePatient } from "../../contexts/PatientProvider";
import { currentMonthStartEndYmd } from "../../lib/currentMonthDateRange";
import { CreatePatientPayload } from "../../types/patient.type";

export const Patients = (): JSX.Element => {
  const defaultListDateRange = useMemo(() => currentMonthStartEndYmd(), []);
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
    <div className="w-full flex flex-col gap-[25px] p-4 md:p-6">
      <PatientHeaderSection
        onAddPatient={() => setAddModalOpen(true)}
        totalPatients={overall?.totalPatients}
        totalDoctors={overall?.totalDoctors}
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
