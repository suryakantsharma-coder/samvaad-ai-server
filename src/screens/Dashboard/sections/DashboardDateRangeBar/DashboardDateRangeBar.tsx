import { Button } from "../../../../components/ui/button";
import { CalendarDays } from "lucide-react";
import { useDashboardData } from "../../context/DashboardDataContext";
import { formatRangeDisplay } from "../../dashboardResponse";

const inputClass =
  "rounded-md border border-[#dedee1] bg-white px-2 py-1.5 text-sm text-black font-title-4r [font-style:var(--title-4r-font-style)]";

export const DashboardDateRangeBar = (): JSX.Element => {
  const {
    dateRange,
    setStartDate,
    setEndDate,
    applyPresetDays,
    applyThisMonth,
    loading,
  } = useDashboardData();

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-[30px] pb-3 pt-1">
      <div className="inline-flex items-center gap-2.5 px-[15px] py-1.5 bg-white rounded-[100px] shadow-[0px_1px_3px_#a2a6b025]">
        <CalendarDays className="w-5 h-5 text-x-70 shrink-0" strokeWidth={1.8} />
        <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
          {formatRangeDisplay(dateRange.start, dateRange.end)}
        </span>
        {loading ? (
          <span className="text-xs text-x-70 font-title-5l" aria-live="polite">
            Updating…
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 text-sm text-x-70">
          <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)]">
            From
          </span>
          <input
            type="date"
            className={inputClass}
            value={dateRange.start}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-x-70">
          <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)]">
            To
          </span>
          <input
            type="date"
            className={inputClass}
            value={dateRange.end}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-auto rounded-[100px] px-3 py-1.5 text-xs border-[#dedee1]"
          onClick={() => applyPresetDays(7)}
        >
          Last 7 days
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-auto rounded-[100px] px-3 py-1.5 text-xs border-[#dedee1]"
          onClick={() => applyPresetDays(30)}
        >
          Last 30 days
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-auto rounded-[100px] px-3 py-1.5 text-xs border-[#dedee1]"
          onClick={applyThisMonth}
        >
          This month
        </Button>
      </div>
    </div>
  );
};
