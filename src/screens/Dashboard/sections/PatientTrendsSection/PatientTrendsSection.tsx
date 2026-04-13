import { Card, CardContent } from "../../../../components/ui/card";
import { Users, TrendingUp } from "lucide-react";
import { useDashboardData } from "../../context/DashboardDataContext";
import type { TrendBar } from "../../dashboardResponse";

const legendItems = [
  { color: "bg-grey-dark", label: "Total patient" },
  { color: "bg-primary-2", label: "Emergency patients" },
  { color: "bg-black", label: "New patients" },
];

const yAxisLabels = ["100", "80", "60", "40", "20", "0"];

const BarGroup = ({ item }: { item: TrendBar }) => {
  const maxVal = 100;
  const totalH = (item.total / maxVal) * 220;
  const emergencyH = (item.emergency / maxVal) * 220;
  const newH = (item.new / maxVal) * 220;

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="flex items-end gap-[3px] h-[220px]">
        <div
          className="w-[14px] bg-grey-dark rounded-t-sm transition-all duration-300"
          style={{ height: `${totalH}px` }}
        />
        <div
          className="w-[14px] bg-primary-2 rounded-t-sm transition-all duration-300"
          style={{ height: `${emergencyH}px` }}
        />
        <div
          className="w-[14px] bg-black rounded-t-sm transition-all duration-300"
          style={{ height: `${newH}px` }}
        />
      </div>
      <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-x-70 text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
        {item.day}
      </span>
    </div>
  );
};

export const PatientTrendsSection = (): JSX.Element => {
  const { response } = useDashboardData();
  const { patientTrends } = response;
  const data = patientTrends.bars;

  return (
    <Card className="w-full bg-white rounded-[10px] overflow-hidden shadow-[0px_2px_6px_#a2a6b040] border-0">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-2.5 p-[5px] bg-grey-light rounded-[100px]">
              <Users
                className="w-[22px] h-[22px] text-x-70"
                strokeWidth={1.8}
              />
            </div>
            <span className="text-black text-[length:var(--title-3r-font-size)] leading-[var(--title-3r-line-height)] whitespace-nowrap font-title-3r font-[number:var(--title-3r-font-weight)] tracking-[var(--title-3r-letter-spacing)] [font-style:var(--title-3r-font-style)]">
              Total Patients
            </span>
          </div>
        </div>

        <div className="flex items-center gap-[30px] mb-6 flex-wrap">
          <div className="inline-flex items-center gap-2.5">
            <span className="whitespace-nowrap font-title-1 font-[number:var(--title-1-font-weight)] text-black text-[length:var(--title-1-font-size)] tracking-[var(--title-1-letter-spacing)] leading-[var(--title-1-line-height)] [font-style:var(--title-1-font-style)]">
              {patientTrends.total.toLocaleString()}
            </span>
            <div className="inline-flex items-center gap-[5px] p-1 bg-[#dffff3] rounded-md">
              <TrendingUp
                className="w-[14px] h-[14px] text-[#00955b]"
                strokeWidth={2}
              />
              <span className="font-title-5l font-[number:var(--title-5l-font-weight)] text-[#00955b] text-[length:var(--title-5l-font-size)] leading-[var(--title-5l-line-height)] tracking-[var(--title-5l-letter-spacing)] whitespace-nowrap [font-style:var(--title-5l-font-style)]">
                {patientTrends.trendPct}
              </span>
            </div>
          </div>
          {legendItems.map((item) => (
            <div
              key={item.label}
              className="inline-flex h-5 items-center gap-[15px]"
            >
              <div className="inline-flex items-start gap-2.5">
                <div className="inline-flex items-center gap-2.5 px-0 py-1">
                  <div className={`w-3 h-3 ${item.color} rounded-[100px]`} />
                </div>
                <span className="w-fit mt-[-1.00px] text-black text-[length:var(--title-4r-font-size)] leading-[var(--title-4r-line-height)] whitespace-nowrap font-title-4r font-[number:var(--title-4r-font-weight)] tracking-[var(--title-4r-letter-spacing)] [font-style:var(--title-4r-font-style)]">
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-end gap-0 w-full">
          <div className="flex flex-col items-end justify-between h-[240px] pr-3 pb-6 flex-shrink-0">
            {yAxisLabels.map((label) => (
              <span
                key={label}
                className="font-[number:var(--title-4r-font-weight)] text-x-70 text-[length:var(--title-4r-font-size)] text-right leading-[var(--title-4r-line-height)] font-title-4r tracking-[var(--title-4r-letter-spacing)] [font-style:var(--title-4r-font-style)]"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex-1 relative min-w-0">
            <div
              className="absolute top-0 left-0 right-0 h-px bg-[#dedee1]"
              style={{ top: "0%" }}
            />
            <div
              className="absolute left-0 right-0 h-px bg-[#dedee1] border-dashed border-t border-[#dedee1]"
              style={{ top: "50%" }}
            />
            <div className="absolute bottom-6 left-0 right-0 h-px bg-[#dedee1]" />

            <div className="flex items-end justify-between pb-6 gap-2">
              {data.map((item, index) => (
                <BarGroup key={`${item.day}-${index}`} item={item} />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
