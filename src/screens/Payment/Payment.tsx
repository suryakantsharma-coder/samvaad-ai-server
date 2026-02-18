import React from "react";
import { PatientSearchSection } from "../Patients/sections/PatientSearchSection";
import { PaymentHeaderSection } from "./sections/PaymentHeaderSection";
import { PaymentListSection } from "./sections/PaymentListSection";

const TOTAL_SUBSCRIPTIONS = 20;

export const Payment = (): JSX.Element => {
  return (
    <div className="bg-app-background w-full min-h-screen flex flex-col gap-[25px] p-4 md:p-6">
      <PatientSearchSection />
      <PaymentHeaderSection totalSubscriptions={TOTAL_SUBSCRIPTIONS} />
      <PaymentListSection />
    </div>
  );
};
