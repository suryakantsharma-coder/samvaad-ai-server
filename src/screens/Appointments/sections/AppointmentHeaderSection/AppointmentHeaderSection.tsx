import {
  CalendarIcon,
  ChevronDownIcon,
  ClockIcon,
  PlusIcon,
} from "lucide-react";
import React from "react";
import { Button } from "../../../../components/ui/button";

interface AppointmentHeaderSectionProps {
  onAddAppointment: () => void;
  totalAppointments?: number;
  totalPatients?: number;
  todayCount?: number;
  tomorrowCount?: number;
}

export const AppointmentHeaderSection = ({
  onAddAppointment,
  totalAppointments = 0,
  totalPatients,
  todayCount = 0,
  tomorrowCount = 0,
}: AppointmentHeaderSectionProps): JSX.Element => {
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

        {typeof totalPatients === "number" && (
          <div className="inline-flex items-center gap-2.5 px-[15px] py-[6px] bg-white rounded-[50px] h-[36px]">
            <div className="inline-flex items-center gap-[5px]">
              <span className="mt-[-1.00px] font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] whitespace-nowrap [font-style:var(--title-3m-font-style)]">
                {totalPatients}
              </span>
              <span className="mt-[-0.50px] font-title-4r font-[number:var(--title-4r-font-weight)] text-x-70 text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                Total Patients
              </span>
            </div>
          </div>
        )}

        <div className="inline-flex items-center gap-2.5 px-[15px] py-[6px] bg-white rounded-[50px] h-[36px]">
          <div className="inline-flex items-center gap-[5px]">
            <span className="mt-[-1.00px] font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] whitespace-nowrap [font-style:var(--title-3m-font-style)]">
              Today ({todayCount})
            </span>
            <span className="text-x-70 font-title-4r">·</span>
            <span className="mt-[-0.50px] font-title-4r font-[number:var(--title-4r-font-weight)] text-x-70 text-[length:var(--title-4r-font-size)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
              Tomorrow ({tomorrowCount})
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2.5 px-[15px] py-[6px] bg-white rounded-[50px] h-[36px]">
          <div className="inline-flex items-center gap-[5px]">
            <CalendarIcon className="w-5 h-5" />

            <span className="font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] leading-[var(--title-4r-line-height)] font-title-4r tracking-[var(--title-4r-letter-spacing)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
              1 Nov -30 Nov
            </span>
          </div>

          <img className="w-px h-4 object-cover" alt="Line" src="/line-1.svg" />

          <button className="inline-flex items-center gap-[5px] bg-transparent border-none cursor-pointer">
            <span className="mt-[-1.00px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
              Last 30 days
            </span>

            <ChevronDownIcon className="w-4 h-4" />
          </button>
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
