import { CalendarIcon, PlusIcon, UsersIcon } from "lucide-react";
import { Button } from "../../../../components/ui/button";

function formatRangeLabel(start: string, end: string): string {
  if (!start.trim() || !end.trim()) return "Date range";
  try {
    const a = new Date(start + "T12:00:00");
    const b = new Date(end + "T12:00:00");
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

export interface PatientHeaderSectionProps {
  onAddPatient: () => void;
  totalPatients?: number;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}

export const PatientHeaderSection = ({
  onAddPatient,
  totalPatients = 0,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: PatientHeaderSectionProps): JSX.Element => {
  const rangeLabel = formatRangeLabel(startDate, endDate);

  return (
    <header className="flex flex-col lg:flex-row w-full items-start justify-between gap-4">
      <div className="inline-flex flex-col items-start gap-[5px] flex-1">
        <div className="flex items-center gap-[15px] w-full">
          <h1 className="mt-[-1.00px] font-medium text-black text-[40px] leading-[44px] [font-family:'Archivo',Helvetica] tracking-[0]">
            Patients
          </h1>
        </div>

        <p className="opacity-90 text-[16px] leading-[20px] mt-[5px] font-title-3l font-[number:var(--title-3l-font-weight)] text-black text-[length:var(--title-3l-font-size)] tracking-[var(--title-3l-letter-spacing)] leading-[var(--title-3l-line-height)] [font-style:var(--title-3l-font-style)] max-w-prose">
          Manage your patient records, review visit history, and track ongoing
          treatments.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-[15px]">
        <div className="inline-flex items-center gap-[10px] px-[15px] py-[6px] bg-white rounded-[50px] h-[36px]">
          <div className="inline-flex items-center gap-[10px]">
            <UsersIcon className="w-5 h-5" />

            <div className="inline-flex items-center gap-[5px]">
              <span className="mt-[-1.00px] font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] whitespace-nowrap [font-style:var(--title-3m-font-style)]">
                {totalPatients}
              </span>

              <span className="mt-[-0.50px] font-title-4r font-[number:var(--title-4r-font-weight)] text-x-70 text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                Total Patients
              </span>
            </div>
          </div>
        </div>

        <div className="inline-flex flex-wrap items-center gap-2 sm:gap-[10px] px-[12px] sm:px-[15px] py-[6px] bg-white rounded-[50px] min-h-[36px]">
          <CalendarIcon className="w-5 h-5 shrink-0 text-black" aria-hidden />

          <span className="hidden sm:inline text-[13px] leading-[18px] font-title-4r text-x-70 max-w-[200px] truncate sm:max-w-none">
            {rangeLabel}
          </span>

          <div className="inline-flex items-center gap-1.5">
            <label className="sr-only" htmlFor="patient-filter-start">
              Start date
            </label>
            <input
              id="patient-filter-start"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="h-8 min-w-0 w-[132px] rounded-full border-0 bg-grey-light px-2.5 text-[13px] font-title-4r text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-2/40"
            />
            <span className="text-x-70 text-xs shrink-0">–</span>
            <label className="sr-only" htmlFor="patient-filter-end">
              End date
            </label>
            <input
              id="patient-filter-end"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="h-8 min-w-0 w-[132px] rounded-full border-0 bg-grey-light px-2.5 text-[13px] font-title-4r text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-2/40"
            />
          </div>
        </div>

        <Button
          onClick={onAddPatient}
          className="inline-flex items-center gap-[5px] px-[15px] py-[6px] bg-primary-2 hover:bg-primary-2/90 rounded-[50px] h-[36px]"
        >
          <PlusIcon className="w-5 h-5" />

          <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-white text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
            Add Patient
          </span>
        </Button>
      </div>
    </header>
  );
};
