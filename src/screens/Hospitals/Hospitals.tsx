import React, { useState } from "react";
import { AddHospitalModal } from "../../components/modals";
import { useHospital } from "../../contexts/HospitalProvider";
import { HospitalHeaderSection } from "./sections/HospitalHeaderSection";
import { HospitalListSection } from "./sections/HospitalListSection";

export const Hospitals = (): JSX.Element => {
  const { hospitals, totalHospitalCount } = useHospital();
  const [showAddHospitalModal, setShowAddHospitalModal] = useState(false);

  return (
    <div className="w-full flex flex-col gap-[25px] p-4 md:p-6">
      <HospitalHeaderSection
        totalHospitals={totalHospitalCount ?? hospitals.length}
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
