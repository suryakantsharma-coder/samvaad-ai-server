import { Download, Pill, Plus } from "lucide-react";
import { Button } from "../../../../components/ui/button";

interface MedicinesHeaderSectionProps {
  totalMedicines: number;
  onAddMedicine: () => void;
  onExport: () => void;
}

export const MedicinesHeaderSection = ({
  totalMedicines,
  onAddMedicine,
  onExport,
}: MedicinesHeaderSectionProps): JSX.Element => {
  return (
    <header className="flex flex-col lg:flex-row w-full items-start justify-between gap-4">
      <div className="inline-flex flex-col items-start gap-[5px] flex-1">
        <div className="flex items-center gap-[15px] w-full">
          <h1 className="mt-[-1.00px] font-medium text-black text-[40px] leading-[44px] [font-family:'Archivo',Helvetica] tracking-[0]">
            Medicines
          </h1>
        </div>

        <p className="opacity-90 text-[16px] leading-[20px] mt-[5px] font-title-3l font-[number:var(--title-3l-font-weight)] text-black text-[length:var(--title-3l-font-size)] tracking-[var(--title-3l-letter-spacing)] leading-[var(--title-3l-line-height)] [font-style:var(--title-3l-font-style)] max-w-prose">
          Add medicines, update details, and manage the global catalog from one
          dashboard.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-[15px]">
        <div className="inline-flex items-center gap-[10px] px-[15px] py-[6px] bg-white border border-[#dedee1] rounded-[50px] h-[36px]">
          <div className="inline-flex items-center gap-2.5">
            <Pill className="w-5 h-5 text-primary-2" strokeWidth={2} />

            <div className="inline-flex items-center gap-[5px]">
              <span className="mt-[-1.00px] font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] whitespace-nowrap [font-style:var(--title-3m-font-style)]">
                {totalMedicines.toLocaleString("en-IN")}
              </span>

              <span className="mt-[-0.50px] font-title-4r font-[number:var(--title-4r-font-weight)] text-x-70 text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                Total Medicines
              </span>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onExport}
          className="inline-flex items-center gap-[8px] px-[15px] py-[6px] bg-white border-[#dedee1] rounded-[50px] h-[36px] hover:bg-grey-light"
        >
          <Download className="w-5 h-5" />
          <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
            Export
          </span>
        </Button>

        <Button
          type="button"
          onClick={onAddMedicine}
          className="inline-flex items-center gap-[5px] px-[15px] py-[6px] bg-primary-2 hover:bg-primary-2/90 rounded-[50px] h-[36px]"
        >
          <Plus className="w-5 h-5" />

          <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-white text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
            Add Medicine
          </span>
        </Button>
      </div>
    </header>
  );
};
