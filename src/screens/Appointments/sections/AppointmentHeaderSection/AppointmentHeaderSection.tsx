import { Briefcase, CalendarIcon, ClockIcon, PlusIcon } from "lucide-react";
import { Button } from "../../../../components/ui/button";

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

export interface AppointmentHeaderSectionProps {
  onAddAppointment: () => void;
  totalAppointments?: number;
  totalPatients?: number;
  totalDoctors?: number;
  todayCount?: number;
  tomorrowCount?: number;
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
}

export const AppointmentHeaderSection = ({
  onAddAppointment,
  totalAppointments = 0,
  totalDoctors,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: AppointmentHeaderSectionProps): JSX.Element => {
  // const rangeLabel = formatRangeLabel(fromDate, toDate);

  return (
    <header className="flex flex-col lg:flex-row w-full items-start justify-between gap-4">
      <div className="inline-flex flex-col items-start gap-[5px] flex-1">
        <div className="flex items-center gap-[15px] w-full">
          <h1 className="mt-[-1.00px] text-[40px] leading-[44px] font-medium text-black [font-family:'Archivo',Helvetica] tracking-[0]">
            Appointments
          </h1>
        </div>

        <p className="opacity-90 text-[16px] leading-[20px] mt-[5px] font-title-3l font-[number:var(--title-3l-font-weight)] text-black text-[length:var(--title-3l-font-size)] tracking-[var(--title-3l-letter-spacing)] leading-[var(--title-3l-line-height)] [font-style:var(--title-3l-font-style)] max-w-prose">
          Track, analyze, and manage your daily and upcoming consultations
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-[15px]">
        <div className="inline-flex items-center gap-2.5 px-[15px] py-[6px] bg-white rounded-[50px] h-[36px]">
          <div className="inline-flex items-center gap-2.5">
            <ClockIcon className="w-5 h-5" />

            <div className="inline-flex items-center gap-[5px]">
              <span className="mt-[-1.00px] font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] whitespace-nowrap [font-style:var(--title-3m-font-style)]">
                {totalAppointments}
              </span>

              <span className="mt-[-0.50px] font-title-4r font-[number:var(--title-4r-font-weight)] text-x-70 text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                Total Appointments
              </span>
            </div>
          </div>
        </div>

        {typeof totalDoctors === "number" && (
          <div className="inline-flex items-center gap-2.5 px-[15px] py-[6px] bg-white rounded-[50px] h-[36px]">
            <Briefcase className="w-5 h-5 shrink-0 text-black" aria-hidden />
            <div className="inline-flex items-center gap-[5px]">
              <span className="mt-[-1.00px] font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] whitespace-nowrap [font-style:var(--title-3m-font-style)]">
                {totalDoctors.toLocaleString("en-IN")}
              </span>
              <span className="mt-[-0.50px] font-title-4r font-[number:var(--title-4r-font-weight)] text-x-70 text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                Total Doctors
              </span>
            </div>
          </div>
        )}

        <div className="inline-flex flex-wrap items-center gap-2 sm:gap-[10px] px-[12px] sm:px-[15px] py-[6px] bg-white rounded-[50px] min-h-[36px]">
          <CalendarIcon className="w-5 h-5 shrink-0 text-black" aria-hidden />

          {/* <span className="hidden sm:inline text-[13px] leading-[18px] font-title-4r text-x-70 max-w-[200px] truncate sm:max-w-none">
            {rangeLabel}
          </span> */}

          <div className="inline-flex items-center gap-1.5">
            <label className="sr-only" htmlFor="appointment-filter-from">
              From date
            </label>
            <input
              id="appointment-filter-from"
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="h-8 min-w-0 w-[132px] rounded-full border-0 bg-grey-light px-2.5 text-[13px] font-title-4r text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-2/40"
            />
            <span className="text-x-70 text-xs shrink-0">–</span>
            <label className="sr-only" htmlFor="appointment-filter-to">
              To date
            </label>
            <input
              id="appointment-filter-to"
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              className="h-8 min-w-0 w-[132px] rounded-full border-0 bg-grey-light px-2.5 text-[13px] font-title-4r text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-2/40"
            />
          </div>
        </div>

        <Button
          onClick={onAddAppointment}
          className="inline-flex items-center gap-[5px] px-[15px] py-[6px] bg-primary-2 hover:bg-primary-2/90 rounded-[50px] h-[36px]"
        >
          <PlusIcon className="w-5 h-5" />

          <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-white text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
            New Appointment
          </span>
        </Button>
      </div>
    </header>
  );
};
