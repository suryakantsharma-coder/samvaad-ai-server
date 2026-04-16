import { useMemo } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { AppointmentListSection } from "./sections/AppointmentListSection/AppointmentListSection";
import { AppointmentStatsSection } from "./sections/AppointmentStatsSection/AppointmentStatsSection";
import { KPIOverviewSection } from "./sections/KPIOverviewSection/KPIOverviewSection";
import { DoctorScheduleSection } from "./sections/DoctorScheduleSection";
import { PatientOverviewSection } from "./sections/PatientOverviewSection/PatientOverviewSection";
import { PatientTrendsSection } from "./sections/PatientTrendsSection/PatientTrendsSection";
import { DashboardDateRangeBar } from "./sections/DashboardDateRangeBar";
import {
  DashboardDataProvider,
  useDashboardData,
} from "./context/DashboardDataContext";
import { DashboardShimmer } from "./DashboardShimmer";
import { Users, CalendarDays, PersonStanding, TrendingUp } from "lucide-react";

const SparklineUp = () => (
  <svg viewBox="0 0 49 50" fill="none" className="w-[49px] h-[50px]">
    <polyline
      points="0,40 10,30 20,35 30,20 40,25 49,10"
      stroke="#009598"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="0,40 10,30 20,35 30,20 40,25 49,10 49,50 0,50"
      fill="#009598"
      fillOpacity="0.1"
    />
  </svg>
);

const SparklineRing = () => (
  <svg viewBox="0 0 50 50" className="w-[50px] h-[50px]">
    <circle
      cx="25"
      cy="25"
      r="20"
      fill="none"
      stroke="#e0f5f5"
      strokeWidth="6"
    />
    <circle
      cx="25"
      cy="25"
      r="20"
      fill="none"
      stroke="#009598"
      strokeWidth="6"
      strokeDasharray="75 51"
      strokeLinecap="round"
      transform="rotate(-90 25 25)"
    />
    <circle
      cx="25"
      cy="25"
      r="12"
      fill="none"
      stroke="#bfe6e7"
      strokeWidth="4"
      strokeDasharray="50 26"
      strokeLinecap="round"
      transform="rotate(-90 25 25)"
    />
  </svg>
);

const SparklineBar = () => (
  <svg viewBox="0 0 59 49" fill="none" className="w-[59px] h-[49px]">
    {[
      { x: 2, h: 20 },
      { x: 12, h: 32 },
      { x: 22, h: 25 },
      { x: 32, h: 38 },
      { x: 42, h: 30 },
      { x: 52, h: 42 },
    ].map((bar, i) => (
      <rect
        key={i}
        x={bar.x}
        y={49 - bar.h}
        width="7"
        height={bar.h}
        rx="3"
        fill={i === 5 ? "#009598" : "#bfe6e7"}
      />
    ))}
  </svg>
);

function DashboardInner(): JSX.Element {
  const { response, loading } = useDashboardData();

  const kpiCards = useMemo(
    () => [
      {
        id: "overall-patients",
        Icon: Users,
        label: "Overall Patients",
        value: response.kpi.overallPatients.toLocaleString(),
        percentage: response.kpi.overallPct,
        chart: <SparklineUp />,
      },
      {
        id: "appointments",
        Icon: CalendarDays,
        label: "Appointments",
        value: response.kpi.appointments.toLocaleString(),
        percentage: response.kpi.appointmentsPct,
        chart: <SparklineRing />,
      },
      {
        id: "visitors",
        Icon: PersonStanding,
        label: "Visitors",
        value: response.kpi.visitors.toLocaleString(),
        percentage: response.kpi.visitorsPct,
        chart: <SparklineBar />,
      },
    ],
    [response],
  );

  return (
    <main className="bg-app-background w-full flex flex-1 min-h-0 min-w-0 flex-col overflow-x-hidden">
      <div className="shrink-0">
        <KPIOverviewSection />
      </div>
      <div className="shrink-0">
        <DashboardDateRangeBar />
      </div>

      {loading ? (
        <DashboardShimmer />
      ) : (
        <>
          <div className="flex flex-1 min-h-0 gap-[15px] px-[30px] pt-[15px] items-stretch">
            <div className="flex flex-col gap-[15px] flex-1 min-w-0 min-h-0 overflow-y-auto pb-[15px]">
              <div className="flex gap-[15px]">
                {kpiCards.map((card) => {
                  const Icon = card.Icon;
                  return (
                    <Card
                      key={card.id}
                      className="flex-1 h-[148px] bg-white rounded-[10px] overflow-hidden shadow-[0px_2px_6px_#a2a6b040] border-0 relative"
                    >
                      <CardContent className="p-0 relative w-full h-full">
                        <div className="absolute top-5 left-5 flex items-center gap-2.5">
                          <div className="inline-flex items-center gap-2.5 p-[5px] bg-grey-light rounded-[100px]">
                            <Icon
                              className="w-[22px] h-[22px] text-x-70"
                              strokeWidth={1.8}
                            />
                          </div>
                          <span className="font-title-3r font-[number:var(--title-3r-font-weight)] text-black text-[length:var(--title-3r-font-size)] tracking-[var(--title-3r-letter-spacing)] leading-[var(--title-3r-line-height)] whitespace-nowrap [font-style:var(--title-3r-font-style)]">
                            {card.label}
                          </span>
                        </div>
                        <div className="w-[100%] absolute top-[72px] left-5 right-[6.75rem] flex min-w-0 flex-col items-stretch gap-[5px]">
                          <span className="font-title-1 font-[number:var(--title-1-font-weight)] text-black text-[length:var(--title-1-font-size)] tracking-[var(--title-1-letter-spacing)] leading-[var(--title-1-line-height)] [font-style:var(--title-1-font-style)]">
                            {card.value}
                          </span>
                          <div className="flex min-w-0 items-center gap-[5px]">
                            <div className="inline-flex shrink-0 items-center gap-[5px]">
                              <TrendingUp
                                className="w-4 h-4 text-[#00955b]"
                                strokeWidth={2}
                              />
                              <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-[#00955b] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                                {card.percentage}
                              </span>
                            </div>
                            <span
                              className="min-w-0 truncate font-title-4r font-[number:var(--title-4r-font-weight)] text-x-70 text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]"
                              title="In selected range"
                            >
                              In selected range
                            </span>
                          </div>
                        </div>
                        {/* <div className="absolute top-[78px] right-5">
                          {card.chart}
                        </div> */}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex gap-[15px]">
                <div className="w-[320px] flex-shrink-0">
                  <DoctorScheduleSection />
                </div>
                <div className="flex-1 min-w-0">
                  <AppointmentStatsSection />
                </div>
              </div>

              <PatientTrendsSection />
            </div>

            <div className="w-[min(100%,420px)] sm:w-[410px] shrink-0 flex flex-col min-h-0 overflow-hidden pb-[15px] self-stretch">
              <AppointmentListSection />
            </div>
          </div>

          <section className="w-full shrink-0 px-[30px] pb-[30px]">
            <Card className="w-full rounded-[10px] overflow-hidden shadow-[0px_2px_6px_#a2a6b040] border-0 bg-white">
              <CardContent className="p-0">
                <PatientOverviewSection />
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </main>
  );
}

export const Dashboard = (): JSX.Element => {
  return (
    <DashboardDataProvider>
      <DashboardInner />
    </DashboardDataProvider>
  );
};
