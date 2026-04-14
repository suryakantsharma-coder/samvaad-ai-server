import { CalendarIcon } from "lucide-react";

function normalizeRange(
  a: string,
  b: string,
): { start: string; end: string } {
  if (!a || !b) return { start: a, end: b };
  if (a <= b) return { start: a, end: b };
  return { start: b, end: a };
}

export interface PaymentDateRangeBarProps {
  start: string;
  end: string;
  onRangeChange: (range: { start: string; end: string }) => void;
}

/** Matches appointments header date controls: icon + two compact date inputs only. */
export const PaymentDateRangeBar = ({
  start,
  end,
  onRangeChange,
}: PaymentDateRangeBarProps): JSX.Element => {
  return (
    <div className="inline-flex flex-wrap items-center gap-2 sm:gap-[10px] px-[12px] sm:px-[15px] py-[6px] bg-white rounded-[50px] min-h-[36px] w-full max-w-fit">
      <CalendarIcon className="w-5 h-5 shrink-0 text-black" aria-hidden />

      <div className="inline-flex items-center gap-1.5">
        <label className="sr-only" htmlFor="payment-filter-from">
          From date
        </label>
        <input
          id="payment-filter-from"
          type="date"
          value={start}
          onChange={(e) =>
            onRangeChange(normalizeRange(e.target.value, end))
          }
          className="h-8 min-w-0 w-[132px] rounded-full border-0 bg-grey-light px-2.5 text-[13px] font-title-4r text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-2/40"
        />
        <span className="text-x-70 text-xs shrink-0">–</span>
        <label className="sr-only" htmlFor="payment-filter-to">
          To date
        </label>
        <input
          id="payment-filter-to"
          type="date"
          value={end}
          onChange={(e) =>
            onRangeChange(normalizeRange(start, e.target.value))
          }
          className="h-8 min-w-0 w-[132px] rounded-full border-0 bg-grey-light px-2.5 text-[13px] font-title-4r text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-2/40"
        />
      </div>
    </div>
  );
};
