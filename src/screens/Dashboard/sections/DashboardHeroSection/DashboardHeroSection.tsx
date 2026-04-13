import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
} from "../../../../components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  Search,
  Settings,
  Bell,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Patients", icon: Users },
  { label: "Doctors", icon: Stethoscope },
  { label: "Appointments", icon: CalendarDays },
];

export const DashboardHeroSection = (): JSX.Element => {
  const [activeNav, setActiveNav] = useState("Dashboard");

  return (
    <header className="w-full h-[78px] flex items-center justify-between px-[29px] bg-app-background">
      <div className="[font-family:'Archivo_Black',Helvetica] font-normal text-[#009598] text-3xl tracking-[0] leading-[normal] whitespace-nowrap">
        Samvaad
      </div>
      <nav className="inline-flex items-center gap-1 p-1 bg-white rounded-[50px]">
        {navItems.map((item) => {
          const isActive = activeNav === item.label;
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => setActiveNav(item.label)}
              className={`inline-flex items-center justify-center gap-[5px] px-[15px] py-[7px] rounded-[50px] transition-colors ${
                isActive ? "bg-primary-2" : "bg-transparent hover:bg-gray-100"
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] ${isActive ? "text-white" : "text-x-70"}`}
                strokeWidth={1.8}
              />
              <span
                className={`font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)] ${
                  isActive ? "text-white" : "text-x-70"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
      <div className="inline-flex items-center gap-5">
        <div className="inline-flex items-center gap-[13px] p-2 bg-white rounded-[50px] cursor-pointer hover:bg-gray-50 transition-colors">
          <Search className="w-5 h-5 text-x-70" strokeWidth={1.8} />
        </div>
        <div className="inline-flex items-center gap-[13px] px-2.5 py-2 bg-white rounded-[50px]">
          <Settings className="w-5 h-5 text-x-70 cursor-pointer hover:text-black transition-colors" strokeWidth={1.8} />
          <div className="w-px h-4 bg-[#dedee1]" />
          <Bell className="w-5 h-5 text-x-70 cursor-pointer hover:text-black transition-colors" strokeWidth={1.8} />
        </div>
        <div className="inline-flex items-center gap-[5px]">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-primary-2 text-white text-xs font-medium">KC</AvatarFallback>
          </Avatar>
          <div className="inline-flex flex-col items-start justify-center gap-0.5">
            <span className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] whitespace-nowrap [font-style:var(--title-4m-font-style)]">
              Dr. Kevin Carter
            </span>
            <span className="font-title-5l font-[number:var(--title-5l-font-weight)] text-x-70 text-[length:var(--title-5l-font-size)] tracking-[var(--title-5l-letter-spacing)] leading-[var(--title-5l-line-height)] whitespace-nowrap [font-style:var(--title-5l-font-style)]">
              Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
