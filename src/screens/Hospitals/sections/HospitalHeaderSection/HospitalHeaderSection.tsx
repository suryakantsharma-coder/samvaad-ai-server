import { Building2, PlusIcon } from "lucide-react";
import React from "react";
import { Button } from "../../../../components/ui/button";

interface HospitalHeaderSectionProps {
  totalHospitals?: number;
  onAddHospital?: () => void;
}

export const HospitalHeaderSection = ({
  totalHospitals = 20,
  onAddHospital,
}: HospitalHeaderSectionProps): JSX.Element => {
  return (
    <header className="flex flex-col lg:flex-row w-full items-start justify-between gap-4">
      <div className="inline-flex flex-col items-start gap-[5px] flex-1">
        <div className="flex items-center gap-[15px] w-full">
          <h1 className="mt-[-1.00px] text-[40px] leading-[44px] font-medium text-black [font-family:'Archivo',Helvetica] tracking-[0]">
            Hospital
          </h1>
        </div>

        <p className="opacity-90 text-[16px] leading-[20px] mt-[5px] font-title-3l font-[number:var(--title-3l-font-weight)] text-black text-[length:var(--title-3l-font-size)] tracking-[var(--title-3l-letter-spacing)] leading-[var(--title-3l-line-height)] [font-style:var(--title-3l-font-style)] max-w-prose">
          Manage all hospitals onboarded to the platform — view details in one
          place.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-[15px]">
        <div className="inline-flex items-center gap-2.5 px-[15px] py-[6px] bg-white rounded-[50px] h-[36px] border border-[#dedee1]">
          <Building2 className="w-5 h-5 text-primary-2" />
          <div className="inline-flex items-center gap-[5px]">
            <span className="mt-[-1.00px] font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] whitespace-nowrap [font-style:var(--title-3m-font-style)]">
              {totalHospitals}
            </span>
            <span className="mt-[-0.50px] font-title-4r font-[number:var(--title-4r-font-weight)] text-x-70 text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
              Total Hospitals
            </span>
          </div>
        </div>

        <Button
          onClick={onAddHospital}
          className="inline-flex items-center gap-[5px] px-[15px] py-[6px] bg-primary-2 hover:bg-primary-2/90 rounded-[50px] h-[36px] text-white"
        >
          <PlusIcon className="w-5 h-5" />
          <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-white text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
            Add Hospital
          </span>
        </Button>
      </div>
    </header>
  );
};
