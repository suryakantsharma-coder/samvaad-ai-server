import { Briefcase, CalendarIcon, Wallet } from "lucide-react";
import React from "react";

/*
function formatRangeLabel(from: string, to: string): string {
  if (!from.trim() || !to.trim()) return "Date range";
  try {
    const a = new Date(from + "T12:00:00");
    const b = new Date(to + "T12:00:00");
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()))
      return "Date range";
    const opts: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return `${a.toLocaleDateString(undefined, opts)} – ${b.toLocaleDateString(undefined, opts)}`;
  } catch {
    return "Date range";
  }
}
*/

export interface PaymentHeaderSectionProps {
  /** Total payment records (from API), when loaded. */
  totalRecords?: number | null;
  /** From list `data.overall.totalDoctors` when the API returns it. */
  totalDoctors?: number | null;
  /** YYYY-MM-DD — used for the “All” tab list query. */
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
}

export const PaymentHeaderSection = ({
  totalRecords,
  totalDoctors,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: PaymentHeaderSectionProps): JSX.Element => {
  // const rangeLabel = formatRangeLabel(fromDate, toDate);

  return (
    <header className="flex flex-col lg:flex-row w-full items-start justify-between gap-4">
      <div className="inline-flex flex-col items-start gap-[5px] flex-1">
        <div className="flex items-center gap-[15px] w-full">
          <h1 className="mt-[-1.00px] text-[40px] leading-[44px] font-medium text-black [font-family:'Archivo',Helvetica] tracking-[0]">
            Payments
          </h1>
        </div>

        <p className="opacity-90 text-[16px] leading-[20px] mt-[5px] font-title-3l font-[number:var(--title-3l-font-weight)] text-black text-[length:var(--title-3l-font-size)] tracking-[var(--title-3l-letter-spacing)] leading-[var(--title-3l-line-height)] [font-style:var(--title-3l-font-style)] max-w-prose">
          View patient payments for your hospital: doctor, amount, date, and
          status.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-[15px]">
        <div className="inline-flex flex-wrap items-center gap-2 sm:gap-[10px] px-[12px] sm:px-[15px] py-[6px] bg-white rounded-[50px] min-h-[36px] border border-[#dedee1]">
          <CalendarIcon className="w-5 h-5 shrink-0 text-black" aria-hidden />

          {/* <span className="hidden sm:inline text-[13px] leading-[18px] font-title-4r text-x-70 max-w-[200px] truncate sm:max-w-none">
            {rangeLabel}
          </span> */}

          <div className="inline-flex items-center gap-1.5">
            <label className="sr-only" htmlFor="payment-filter-from">
              From date
            </label>
            <input
              id="payment-filter-from"
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="h-8 min-w-0 w-[132px] rounded-full border-0 bg-grey-light px-2.5 text-[13px] font-title-4r text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-2/40"
            />
            <span className="text-x-70 text-xs shrink-0">–</span>
            <label className="sr-only" htmlFor="payment-filter-to">
              To date
            </label>
            <input
              id="payment-filter-to"
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              className="h-8 min-w-0 w-[132px] rounded-full border-0 bg-grey-light px-2.5 text-[13px] font-title-4r text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-2/40"
            />
          </div>
        </div>

        {totalDoctors != null && (
          <div className="inline-flex items-center gap-2.5 px-[15px] py-[6px] bg-white rounded-[50px] h-[36px] border border-[#dedee1]">
            <Briefcase className="w-5 h-5 text-primary-2" aria-hidden />
            <div className="inline-flex items-center gap-[5px]">
              <span className="mt-[-1.00px] font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] whitespace-nowrap [font-style:var(--title-3m-font-style)]">
                {totalDoctors.toLocaleString("en-IN")}
              </span>
              <span className="mt-[-0.50px] font-title-4r font-[number:var(--title-4r-font-weight)] text-x-70 text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                Total doctors
              </span>
            </div>
          </div>
        )}

        {totalRecords != null && (
          <div className="inline-flex items-center gap-2.5 px-[15px] py-[6px] bg-white rounded-[50px] h-[36px] border border-[#dedee1]">
            <Wallet className="w-5 h-5 text-primary-2" />
            <div className="inline-flex items-center gap-[5px]">
              <span className="mt-[-1.00px] font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] whitespace-nowrap [font-style:var(--title-3m-font-style)]">
                {totalRecords.toLocaleString("en-IN")}
              </span>
              <span className="mt-[-0.50px] font-title-4r font-[number:var(--title-4r-font-weight)] text-x-70 text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                Total records
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
