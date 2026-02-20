import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../components/ui/avatar";
import { Button } from "../../../../components/ui/button";
import { Separator } from "../../../../components/ui/separator";
import { useAuth } from "../../../../contexts/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import { ChevronDownIcon, LogOutIcon } from "lucide-react";

export const PatientSearchSection = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [navigationItems, setNavigationItems] = useState([
    { id: "dashboard", label: "Dashboard", icon: "/home.svg", path: "/" },
    {
      id: "hospitals",
      label: "Hospitals",
      icon: "/building.svg",
      path: "/hospitals",
    },
    { id: "doctors", label: "Doctors", icon: "/pill.svg", path: "/doctors" },
    {
      id: "medicines",
      label: "Medicines",
      icon: "/pill.svg",
      path: "/medicines",
    },
    { id: "payment", label: "Payment", icon: "/call.svg", path: "/payment" },
  ]);

  const { handleLogout } = useAuth();

  useEffect(() => {
    if (user?.role === "doctor") {
      setNavigationItems([
        { id: "dashboard", label: "Dashboard", icon: "/home.svg", path: "/" },
        {
          id: "patients",
          label: "Patients",
          icon: "/person.svg",
          path: "/patients",
        },
        {
          id: "prescriptions",
          label: "Prescriptions",
          icon: "/pill.svg",
          path: "/prescriptions",
        },
        {
          id: "appointments",
          label: "Appointments",
          icon: "/calender.svg",
          path: "/appointments",
        },
      ]);
    } else if (user?.role === "admin") {
      setNavigationItems([
        {
          id: "hospitals",
          label: "Hospitals",
          icon: "/building.svg",
          path: "/hospitals",
        },
        {
          id: "payment",
          label: "Payment",
          icon: "/call.svg",
          path: "/payment",
        },
      ]);
    } else if (user?.role === "hospital_admin") {
      setNavigationItems([
        { id: "dashboard", label: "Dashboard", icon: "/home.svg", path: "/" },
        {
          id: "patients",
          label: "Patients",
          icon: "/person.svg",
          path: "/patients",
        },
        {
          id: "doctors",
          label: "Doctors",
          icon: "/pill.svg",
          path: "/doctors",
        },

        {
          id: "appointments",
          label: "Appointments",
          icon: "/calender.svg",
          path: "/appointments",
        },
        {
          id: "prescriptions",
          label: "Prescriptions",
          icon: "/pill.svg",
          path: "/prescriptions",
        },
      ]);
    }
  }, [user]);

  return (
    <header className="flex flex-col md:flex-row items-center justify-between w-full min-h-[78px] px-4 md:px-[30px] py-4 gap-4 relative">
      <img
        className="w-[94px] h-[52px]"
        alt="Febf d c"
        src="/f93e55bf-1d76-402c-bdf9-a0330044b62f--1--1.png"
      />

      <nav className="inline-flex flex-wrap items-center justify-center gap-[16px] md:gap-4 p-1 bg-white rounded-[50px] h-[42px]">
        {navigationItems.map(
          (item: { id: string; label: string; icon: string; path: string }) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => navigate(item.path)}
                className={`inline-flex items-center justify-center gap-[5px] px-${
                  isActive ? "2.5" : "[15px]"
                } py-[7px] rounded-[50px] h-auto ${
                  isActive
                    ? "bg-primary-2 hover:bg-primary-2"
                    : "hover:bg-transparent"
                }`}
              >
                <img
                  className="w-5 h-5"
                  alt={item.label}
                  src={item.icon}
                  style={{
                    filter: isActive ? "brightness(0) invert(1)" : "none",
                  }}
                />
                <span
                  className={`mt-[-0.50px] font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)] ${
                    isActive ? "text-white" : "text-black"
                  }`}
                >
                  {item.label}
                </span>
              </Button>
            );
          },
        )}
      </nav>

      <div className="inline-flex flex-wrap items-center gap-3 md:gap-5">
        <Button
          variant="ghost"
          size="icon"
          className="inline-flex items-center gap-[13px] p-2 bg-white rounded-[50px] h-auto hover:bg-white"
        >
          <img className="w-6 h-6" alt="Search" src="/search.svg" />
        </Button>

        <div className="inline-flex items-center gap-[13px] px-2.5 py-2 bg-white rounded-[50px]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
            className="w-6 h-6 p-0 hover:bg-transparent"
          >
            <img className="w-6 h-6" alt="Settings" src="/settings.svg" />
          </Button>

          <Separator orientation="vertical" className="w-px h-4" />

          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 p-0 hover:bg-transparent"
          >
            <img
              className="w-6 h-6"
              alt="Notification"
              src="/notification.svg"
            />
          </Button>
        </div>

        <div className="inline-flex items-center gap-[5px]">
          {/* create a drop down menu for the user */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="inline-flex items-center gap-[10px]">
                <Avatar className="w-9 h-9">
                  <AvatarImage src="/ellipse-1.png" alt="Dr. Kevin Carter" />
                  <AvatarFallback>KC</AvatarFallback>
                </Avatar>
                <div className="inline-flex flex-col items-start justify-center gap-0.5">
                  <div className="w-fit mt-[-1.00px] font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] whitespace-nowrap [font-style:var(--title-4m-font-style)]">
                    {user?.name}
                  </div>

                  <div className="w-fit font-title-5l font-[number:var(--title-5l-font-weight)] text-x-70 text-[length:var(--title-5l-font-size)] tracking-[var(--title-5l-letter-spacing)] leading-[var(--title-5l-line-height)] whitespace-nowrap [font-style:var(--title-5l-font-style)]">
                    {user?.role}
                  </div>
                </div>
                <ChevronDownIcon className="w-4 h-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <LogOutIcon className="w-4 h-4" />
                <button
                  onClick={async () => {
                    await handleLogout();
                    navigate("/login");
                  }}
                >
                  Logout
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
