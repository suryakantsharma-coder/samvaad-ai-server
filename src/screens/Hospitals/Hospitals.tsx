import React, { useState } from "react";
import { AddHospitalModal } from "../../components/modals";
import { PatientSearchSection } from "../Patients/sections/PatientSearchSection";
import { HospitalHeaderSection } from "./sections/HospitalHeaderSection";
import { HospitalListSection } from "./sections/HospitalListSection";

const TOTAL_HOSPITALS = 20;

export const Hospitals = (): JSX.Element => {
  const [showAddHospitalModal, setShowAddHospitalModal] = useState(false);

  return (
    <div className="bg-app-background w-full min-h-screen flex flex-col gap-[25px] p-4 md:p-6">
      <PatientSearchSection />
      <HospitalHeaderSection
        totalHospitals={TOTAL_HOSPITALS}
        onAddHospital={() => setShowAddHospitalModal(true)}
      />
      <HospitalListSection />
      <AddHospitalModal
        open={showAddHospitalModal}
        onOpenChange={setShowAddHospitalModal}
        onSave={(data) => {
          console.log("Hospital saved", data);
          setShowAddHospitalModal(false);
        }}
      />
    </div>
  );
};
