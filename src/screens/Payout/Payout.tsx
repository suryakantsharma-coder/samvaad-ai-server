import { useCallback, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthProvider";
import { currentMonthFromToYmd } from "../../lib/currentMonthDateRange";
import { getLinkedHospitalId } from "../../lib/linkedHospitalId";
import { getHomePathForRole, isSuperAdminRole } from "../../lib/userRole";
import {
  PayoutHeaderSection,
  type SuperAdminPayoutFilter,
} from "./sections/PayoutHeaderSection";
import { PayoutListSection } from "./sections/PayoutListSection";

export const Payout = (): JSX.Element => {
  const { user, authHydrating } = useAuth();
  const hospitalId = getLinkedHospitalId(user);
  const [payoutFilter, setPayoutFilter] =
    useState<SuperAdminPayoutFilter>("draft");
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

  if (authHydrating) {
    return <div className="flex-1 min-h-[40vh]" aria-busy="true" />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!isSuperAdminRole(user.role)) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  return (
    <div className="w-full flex flex-col gap-[25px] p-4 md:p-6">
      <PayoutHeaderSection
        totalRecords={totalRecords}
        totalDoctors={totalDoctors}
        listFromDate={listFromDate}
        listToDate={listToDate}
        onListDateRangeChange={setListDateRange}
      />
      <PayoutListSection
        hospitalId={hospitalId}
        listFromDate={listFromDate}
        listToDate={listToDate}
        onListDateRangeChange={setListDateRange}
        payoutFilter={payoutFilter}
        onPayoutFilterChange={setPayoutFilter}
        onRecordsMeta={handleRecordsMeta}
      />
    </div>
  );
};
