import { Briefcase, Wallet } from "lucide-react";
import { FinanceListDateRangeBar } from "../../../../components/payment/FinanceListDateRangeBar";

export type SuperAdminPayoutFilter = "draft" | "paid";

export interface PayoutHeaderSectionProps {
  totalRecords?: number | null;
  totalDoctors?: number | null;
  listFromDate: string;
  listToDate: string;
  onListDateRangeChange: (range: { start: string; end: string }) => void;
}

export const PayoutHeaderSection = ({
  totalRecords,
  totalDoctors,
  listFromDate,
  listToDate,
  onListDateRangeChange,
}: PayoutHeaderSectionProps): JSX.Element => {
  return (
    <header className="flex flex-col lg:flex-row w-full items-start justify-between gap-4">
      <div className="inline-flex flex-col items-start gap-[5px] flex-1">
        <div className="flex items-center gap-[15px] w-full">
          <h1 className="mt-[-1.00px] text-[40px] leading-[44px] font-medium text-black [font-family:'Archivo',Helvetica] tracking-[0]">
            Payouts
          </h1>
        </div>

        <p className="opacity-90 text-[16px] leading-[20px] mt-[5px] font-title-3l font-[number:var(--title-3l-font-weight)] text-black text-[length:var(--title-3l-font-size)] tracking-[var(--title-3l-letter-spacing)] leading-[var(--title-3l-line-height)] [font-style:var(--title-3l-font-style)] max-w-prose">
          Review hospital payout periods: billing window, totals, and settlement
          status. Use Draft or Paid, the date range, and search in the list
          header below.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-[15px]">
        <div className="inline-flex rounded-[50px] border border-[#dedee1] bg-white">
          <FinanceListDateRangeBar
            start={listFromDate}
            end={listToDate}
            onRangeChange={onListDateRangeChange}
          />
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
