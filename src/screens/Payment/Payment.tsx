import React, { useCallback, useState } from "react";
import { useAuth } from "../../contexts/AuthProvider";
import { PatientSearchSection } from "../Patients/sections/PatientSearchSection";
import { PaymentHeaderSection } from "./sections/PaymentHeaderSection";
import { PaymentListSection } from "./sections/PaymentListSection";

export const Payment = (): JSX.Element => {
  const { user } = useAuth();
  const hospitalId =
    typeof user?.hospital === "string" ? user.hospital.trim() : "";
  const [totalRecords, setTotalRecords] = useState<number | null>(null);

  const handleRecordsMeta = useCallback((meta: { total: number }) => {
    setTotalRecords(meta.total);
  }, []);

  return (
    <div className="bg-app-background w-full min-h-screen flex flex-col gap-[25px] p-4 md:p-6">
      <PatientSearchSection />
      <PaymentHeaderSection totalRecords={totalRecords} />
      <PaymentListSection
        hospitalId={hospitalId}
        onRecordsMeta={handleRecordsMeta}
      />
    </div>
  );
};
