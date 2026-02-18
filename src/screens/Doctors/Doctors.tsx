import React, { useState } from "react";
import { PatientSearchSection } from "../Patients/sections/PatientSearchSection";
import { DoctorHeaderSection } from "./sections/DoctorHeaderSection";
import { DoctorListSection } from "./sections/DoctorListSection";
import {
  AddDoctorModal,
  type DoctorData,
} from "../../components/modals/AddDoctorModal";
import { useDoctor } from "../../contexts/DoctorProvider";
import { CreateDoctorPayload } from "../../types/doctor.type";

export const Doctors = (): JSX.Element => {
  const [showAddModal, setShowAddModal] = useState(false);
  const { handleAddDoctor } = useDoctor();

  const handleSaveDoctor = (doctor: DoctorData) => {
    console.log("Saving doctor:", doctor);

    const timing =
      doctor.morningStart +
      " - " +
      doctor.morningEnd +
      "/n" +
      doctor.eveningStart +
      " - " +
      doctor.eveningEnd;

    const doctorPayload: CreateDoctorPayload = {
      fullName: doctor.name,
      phoneNumber: doctor.countryCode + " " + doctor.phone,
      designation: doctor.designation,
      availability: timing,
      status: doctor.status,
      email: doctor.email,
    };
    handleAddDoctor(doctorPayload);
  };

  return (
    <div className="bg-app-background w-full min-h-screen flex flex-col gap-[25px] p-4 md:p-6">
      <PatientSearchSection />
      <DoctorHeaderSection onAddDoctor={() => setShowAddModal(true)} />
      <DoctorListSection />
      <AddDoctorModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSave={handleSaveDoctor}
      />
    </div>
  );
};
