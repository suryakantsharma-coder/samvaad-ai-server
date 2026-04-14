import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthProvider";
import { PaymentHeaderSection } from "./sections/PaymentHeaderSection";
import { PaymentDateRangeBar } from "./sections/PaymentDateRangeBar";
import { PaymentListSection } from "./sections/PaymentListSection";

function toYMDLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDefaultPaymentListDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: toYMDLocal(from), to: toYMDLocal(to) };
}

export const Payment = (): JSX.Element => {
  const { user } = useAuth();
  const hospitalId =
    typeof user?.hospital === "string" ? user.hospital.trim() : "";
  const [totalRecords, setTotalRecords] = useState<number | null>(null);
  const [totalDoctors, setTotalDoctors] = useState<number | null>(null);
  const defaultListDateRange = useMemo(
    () => getDefaultPaymentListDateRange(),
    [],
  );
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
        totalRecords={totalRecords}
        totalDoctors={totalDoctors}
      />
      <PaymentDateRangeBar
        start={listFromDate}
        end={listToDate}
        onRangeChange={setListDateRange}
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
