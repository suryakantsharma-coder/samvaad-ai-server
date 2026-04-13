import { Card, CardContent } from "../../../../components/ui/card";
import { Bell, Bot, Stethoscope, CalendarDays } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface ActivityItem {
  Icon: LucideIcon;
  text: string;
  time: string;
}

const activityItems: ActivityItem[] = [
  {
    Icon: Bot,
    text: "AI rescheduled 3 canceled appointments.",
    time: "12:45 PM",
  },
  {
    Icon: Stethoscope,
    text: "Assign Dr. Brooks to the Orthopedic walk-ins this afternoon (2 free slots).",
    time: "12:45 PM",
  },
  {
    Icon: CalendarDays,
    text: "Dr. Sophia Adams completed 3 consultations — 2 follow-ups auto-scheduled by AI.",
    time: "12:45 PM",
  },
  {
    Icon: CalendarDays,
    text: "AI rescheduled 1 canceled appointment to Dr. Liam Brooks (Orthopedic Dept)",
    time: "12:45 PM",
  },
];

export const RecentActivitySection = (): JSX.Element => {
  return (
    <Card className="w-full flex flex-col gap-5 bg-white rounded-[10px] overflow-hidden shadow-[0px_2px_6px_#a2a6b040] border-0">
      <CardContent className="flex flex-col gap-5 p-0">
        <div className="flex items-center gap-2.5 mt-5 px-5">
          <div className="inline-flex items-center gap-2.5 p-[5px] bg-grey-light rounded-[100px] flex-shrink-0">
            <Bell className="w-[22px] h-[22px] text-x-70" strokeWidth={1.8} />
          </div>
          <span className="font-title-3r font-[number:var(--title-3r-font-weight)] text-black text-[length:var(--title-3r-font-size)] tracking-[var(--title-3r-letter-spacing)] leading-[var(--title-3r-line-height)] whitespace-nowrap [font-style:var(--title-3r-font-style)]">
            Recent Activity
          </span>
        </div>
        <div className="flex flex-col gap-5 px-5 pb-5">
          {activityItems.map((item, index) => {
            const Icon = item.Icon;
            return (
              <div key={index} className="flex items-start gap-2.5 w-full">
                <div className="inline-flex items-center gap-2.5 p-[5px] bg-grey-light rounded-[100px] flex-shrink-0">
                  <Icon className="w-[22px] h-[22px] text-x-70" strokeWidth={1.8} />
                </div>
                <div className="flex flex-col items-start gap-[3px] flex-1 min-w-0">
                  <p className="self-stretch mt-[-1.00px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
                    {item.text}
                  </p>
                  <span className="self-stretch [font-family:'Archivo',Helvetica] font-normal text-x-70 text-xs tracking-[0] leading-4">
                    {item.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
