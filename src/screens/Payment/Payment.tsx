import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthProvider";
import { currentMonthFromToYmd } from "../../lib/currentMonthDateRange";
import { getLinkedHospitalId } from "../../lib/linkedHospitalId";
import { isSuperAdminRole } from "../../lib/userRole";
import { PaymentHeaderSection } from "./sections/PaymentHeaderSection";
import { PaymentListSection } from "./sections/PaymentListSection";

export const Payment = (): JSX.Element => {
  const { user } = useAuth();
  const hospitalId = getLinkedHospitalId(user);
  const headerVariant = isSuperAdminRole(user?.role) ? "payouts" : "payments";
  const [totalRecords, setTotalRecords] = useState<number | null>(null);
  const [totalDoctors, setTotalDoctors] = useState<number | null>(null);
  const defaultListDateRange = useMemo(() => currentMonthFromToYmd(), []);
  const [listFromDate, setListFromDate] = useState(defaultListDateRange.from);
  const [listToDate, setListToDate] = useState(defaultListDateRange.to);

  const handleRecordsMeta = useCallback(
    (meta: { total: number; totalDoctors?: number }) => {
      setTotalRecords(meta.total);
      if (typeof meta.totalDoctors === "number") {
        setTotalDoctors(meta.totalDoctors);
      }
    },
    [],
  );

  const setListDateRange = useCallback(
    (range: { start: string; end: string }) => {
      setListFromDate(range.start);
      setListToDate(range.end);
    },
    [],
  );

  return (
    <div className="w-full flex flex-col gap-[25px] p-4 md:p-6">
      <PaymentHeaderSection
        variant={headerVariant}
        totalRecords={totalRecords}
        totalDoctors={totalDoctors}
        listFromDate={listFromDate}
        listToDate={listToDate}
        onListDateRangeChange={setListDateRange}
      />
      <PaymentListSection
        hospitalId={hospitalId}
        listFromDate={listFromDate}
        listToDate={listToDate}
        onRecordsMeta={handleRecordsMeta}
      />
    </div>
  );
};
