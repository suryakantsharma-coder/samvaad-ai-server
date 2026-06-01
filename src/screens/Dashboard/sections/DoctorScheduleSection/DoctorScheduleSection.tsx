import { Card, CardContent } from "../../../../components/ui/card";
import { ChartPie } from "lucide-react";
import { useDashboardData } from "../../context/DashboardDataContext";

const DonutChart = ({
  total,
  segments,
}: {
  total: number;
  segments: { value: number; color: string }[];
}) => {
  const totalVal = 100;
  const cx = 115;
  const cy = 115;
  const outerR = 105;
  const innerR = 68;
  const gap = 2;

  let cumulative = 0;
  const slices = segments.map((seg) => {
    const startAngle = (cumulative / totalVal) * 2 * Math.PI - Math.PI / 2;
    cumulative += seg.value;
    const endAngle = (cumulative / totalVal) * 2 * Math.PI - Math.PI / 2;

    const gapAngle = gap / outerR;
    const sa = startAngle + gapAngle / 2;
    const ea = endAngle - gapAngle / 2;

    const x1o = cx + outerR * Math.cos(sa);
    const y1o = cy + outerR * Math.sin(sa);
    const x2o = cx + outerR * Math.cos(ea);
    const y2o = cy + outerR * Math.sin(ea);
    const x1i = cx + innerR * Math.cos(ea);
    const y1i = cy + innerR * Math.sin(ea);
    const x2i = cx + innerR * Math.cos(sa);
    const y2i = cy + innerR * Math.sin(sa);

    const large = seg.value > 50 ? 1 : 0;

    const d = [
      `M ${x1o} ${y1o}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${x2o} ${y2o}`,
      `L ${x1i} ${y1i}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${x2i} ${y2i}`,
      "Z",
    ].join(" ");

    return { d, color: seg.color };
  });

  const centerLabel = total.toLocaleString();

  return (
    <svg
      viewBox="0 0 230 230"
      className="w-[231px] h-[231px] pointer-events-none"
      aria-hidden
    >
      {slices.map((slice, i) => (
        <path key={i} d={slice.d} fill={slice.color} />
      ))}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fontSize="28"
        fontWeight="500"
        fontFamily="Archivo, Helvetica"
        fill="#11111c"
      >
        {centerLabel}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        fontSize="13"
        fontFamily="Archivo, Helvetica"
        fill="#57575f"
      >
        Total Appointments
      </text>
    </svg>
  );
};

export const DoctorScheduleSection = (): JSX.Element => {
  const { response } = useDashboardData();
  const { donut } = response;

  return (
    <Card className="w-full max-w-[496px] flex flex-col items-center bg-white rounded-[10px] overflow-hidden shadow-[0px_2px_6px_#a2a6b040] border-0">
      <CardContent className="w-full flex flex-col items-center p-0 pb-5">
        <div className="h-8 w-full mt-5 px-4 md:px-5 py-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-2.5 p-[5px] bg-grey-light rounded-[100px]">
              <ChartPie
                className="w-[22px] h-[22px] text-x-70"
                strokeWidth={1.8}
              />
            </div>
            <span className="text-black text-[length:var(--title-3r-font-size)] leading-[var(--title-3r-line-height)] font-title-3r font-[number:var(--title-3r-font-weight)] tracking-[var(--title-3r-letter-spacing)] whitespace-nowrap [font-style:var(--title-3r-font-style)]">
              Appointments
            </span>
          </div>
        </div>
        <div className="mt-[8px] w-full flex justify-center">
          <DonutChart total={donut.total} segments={donut.segments} />
        </div>
        <div className="flex flex-col items-center gap-2.5 mt-[15px] w-full max-w-[333px] px-4">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            {donut.legend.slice(0, 2).map((item, index) => (
              <div
                key={index}
                className="inline-flex h-5 items-center gap-[15px]"
              >
                <div className="inline-flex items-start gap-2.5">
                  <div className="inline-flex items-center gap-2.5 px-0 py-1">
                    <div className={`w-3 h-3 ${item.color} rounded-[100px]`} />
                  </div>
                  <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                    {item.label}
                  </span>
                </div>
                <span className="font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] leading-[var(--title-3m-line-height)] tracking-[var(--title-3m-letter-spacing)] whitespace-nowrap [font-style:var(--title-3m-font-style)]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 self-stretch w-full flex-wrap">
            {donut.legend.slice(2, 4).map((item, index) => (
              <div
                key={index}
                className="inline-flex h-5 items-center gap-[15px]"
              >
                <div className="inline-flex items-start gap-2.5">
                  <div className="inline-flex items-center gap-2.5 px-0 py-1">
                    <div className={`w-3 h-3 ${item.color} rounded-[100px]`} />
                  </div>
                  <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                    {item.label}
                  </span>
                </div>
                <span className="font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] leading-[var(--title-3m-line-height)] tracking-[var(--title-3m-letter-spacing)] whitespace-nowrap [font-style:var(--title-3m-font-style)]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
