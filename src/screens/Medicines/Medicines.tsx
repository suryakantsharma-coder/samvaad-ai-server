import React from "react";
import { PatientSearchSection } from "../Patients/sections/PatientSearchSection";

export const Medicines = (): JSX.Element => {
  return (
    <div className="bg-app-background w-full min-h-screen flex flex-col gap-[25px] p-4 md:p-6">
      <PatientSearchSection />
      <div className="flex flex-col gap-2">
        <h1 className="text-[40px] leading-[44px] font-medium text-black">Medicines</h1>
        <p className="text-[16px] leading-[20px] text-black opacity-90 max-w-prose">
          Manage medicines — coming soon.
        </p>
      </div>
    </div>
  );
};
