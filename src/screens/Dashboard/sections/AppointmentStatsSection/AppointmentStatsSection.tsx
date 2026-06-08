import { Card, CardContent } from "../../../../components/ui/card";
import { Stethoscope, ChevronRight } from "lucide-react";
import { useDashboardData } from "../../context/DashboardDataContext";
import { useNavigate } from "react-router-dom";

export const AppointmentStatsSection = (): JSX.Element => {
  const { response } = useDashboardData();
  const doctors = response.doctors;
  const navigate = useNavigate();

  return (
    <Card className="flex w-full flex-col overflow-hidden rounded-[10px] border-0 bg-white shadow-[0px_2px_6px_#a2a6b040]">
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <div className="mb-2.5 flex h-8 shrink-0 items-center justify-between px-4 md:px-5 pb-0 pt-5">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-2.5 p-[5px] bg-grey-light rounded-[100px]">
              <Stethoscope
                className="w-[22px] h-[22px] text-x-70"
                strokeWidth={1.8}
              />
            </div>
            <span className="font-title-3r font-[number:var(--title-3r-font-weight)] text-black text-[length:var(--title-3r-font-size)] tracking-[var(--title-3r-letter-spacing)] leading-[var(--title-3r-line-height)] whitespace-nowrap [font-style:var(--title-3r-font-style)]">
              Doctor&apos;s Schedule
            </span>
          </div>
          <div className="inline-flex items-center gap-[5px] cursor-pointer">
            <span
              className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]"
              onClick={() => navigate("/doctors")}
            >
              See all
            </span>
            <ChevronRight
              className="w-[14px] h-[14px] text-x-70"
              strokeWidth={2}
            />
          </div>
        </div>
        <div className="mt-2.5 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="flex flex-col gap-2.5 px-4 md:px-5 py-0 w-full"
            >
              <div className="flex flex-col gap-2.5 px-[15px] py-3 w-full border-b border-solid border-[#dedee1]">
                <div className="flex items-center justify-between w-full">
                  <div className="inline-flex items-center gap-[5px]">
                    <div
                      className={`w-[34px] h-[34px] rounded-full ${doctor.avatarBg} flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-xs font-medium text-x-70">
                        {doctor.initials}
                      </span>
                    </div>
                    <div className="inline-flex flex-col items-start justify-center">
                      <span className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] whitespace-nowrap [font-style:var(--title-4m-font-style)]">
                        {doctor.name}
                      </span>
                      <span className="font-title-5l font-[number:var(--title-5l-font-weight)] text-x-70 text-[length:var(--title-5l-font-size)] tracking-[var(--title-5l-letter-spacing)] leading-[var(--title-5l-line-height)] whitespace-nowrap [font-style:var(--title-5l-font-style)]">
                        {doctor.specialty}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`${doctor.statusBg} inline-flex items-center justify-center gap-2.5 px-2.5 py-[5px] rounded-[100px]`}
                  >
                    <span
                      className={`${doctor.statusColor} font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]`}
                    >
                      {doctor.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
