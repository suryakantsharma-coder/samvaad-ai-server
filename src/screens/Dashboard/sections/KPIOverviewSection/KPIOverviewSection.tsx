import { Button } from "../../../../components/ui/button";
import { Download } from "lucide-react";
import { useDashboardData } from "../../context/DashboardDataContext";
import { exportDashboardCsv } from "../../exportDashboardCsv";
import { showSuccess } from "../../../../lib/toast";
import { useAuth } from "../../../../contexts/AuthProvider";

export const KPIOverviewSection = (): JSX.Element => {
  const { response, dateRange, loading } = useDashboardData();
  const { user } = useAuth();

  const onExport = (): void => {
    exportDashboardCsv(dateRange, response);
    showSuccess("Exported", "Dashboard data downloaded as CSV.");
  };

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-2 px-4 md:px-[30px]">
      <div className="flex flex-col items-start gap-[5px]">
        <h1 className="[font-family:'Archivo',Helvetica] font-medium text-black text-[30px] leading-[34px] sm:text-[40px] tracking-[0] sm:leading-[44px]">
          Welcome Back!
        </h1>
        <p className="opacity-70 font-title-3l font-[number:var(--title-3l-font-weight)] text-black text-[length:var(--title-3l-font-size)] tracking-[var(--title-3l-letter-spacing)] leading-[var(--title-3l-line-height)] [font-style:var(--title-3l-font-style)]">
          Here are the updates for you
        </p>
      </div>
      <Button
        type="button"
        disabled={loading}
        onClick={onExport}
        className="inline-flex h-auto w-full sm:w-auto flex-shrink-0 items-center justify-center gap-[5px] rounded-[100px] border-0 bg-primary-2 px-[15px] py-2 hover:bg-primary-2/90 disabled:opacity-60"
      >
        <Download className="h-5 w-5 text-white" strokeWidth={1.8} />
        <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-white text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
          Export
        </span>
      </Button>
    </div>
  );
};
