import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { Stethoscope } from "lucide-react";
import { useAuth } from "../../contexts/AuthProvider";
import {
  isHospitalAdminRole,
  isSuperAdminRole,
  normalizeRoleKey,
} from "../../lib/userRole";

type MobileNavItem = {
  id: string;
  path: string;
  icon: string;
  label: string;
  iconMode?: "asset" | "doctors";
};

function mobileNavigationItemsForRole(role: string | undefined | null): MobileNavItem[] {
  if (isSuperAdminRole(role)) {
    return [
      { id: "hospitals", label: "Hospitals", icon: "/building.svg", path: "/hospitals" },
      { id: "medicines", label: "Medicine", icon: "/pill.svg", path: "/medicines" },
      { id: "payouts", label: "Payouts", icon: "/payment.svg", path: "/payout" },
    ];
  }

  const normalizedRole = normalizeRoleKey(role);
  if (normalizedRole === "doctor") {
    return [
      { id: "patients", label: "Patients", icon: "/person.svg", path: "/patients" },
      { id: "prescriptions", label: "Prescriptions", icon: "/pill.svg", path: "/prescriptions" },
      { id: "appointments", label: "Appointments", icon: "/calender.svg", path: "/appointments" },
    ];
  }

  if (normalizedRole === "admin") {
    return [
      { id: "hospitals", label: "Hospitals", icon: "/building.svg", path: "/hospitals" },
      { id: "payments", label: "Payments", icon: "/payment.svg", path: "/payment" },
    ];
  }

  if (isHospitalAdminRole(role)) {
    return [
      { id: "dashboard", label: "Dashboard", icon: "/home.svg", path: "/dashboard" },
      { id: "patients", label: "Patients", icon: "/person.svg", path: "/patients" },
      {
        id: "doctors",
        label: "Doctors",
        icon: "/dashboard.svg",
        path: "/doctors",
        iconMode: "doctors",
      },
      { id: "appointments", label: "Appointments", icon: "/calender.svg", path: "/appointments" },
      { id: "prescriptions", label: "Prescriptions", icon: "/pill.svg", path: "/prescriptions" },
      { id: "payments", label: "Payments", icon: "/payment.svg", path: "/payment" },
    ];
  }

  return [
    { id: "hospitals", label: "Hospitals", icon: "/building.svg", path: "/hospitals" },
    { id: "doctors", label: "Doctors", icon: "/pill.svg", path: "/doctors", iconMode: "doctors" },
    { id: "medicines", label: "Medicines", icon: "/pill.svg", path: "/medicines" },
    { id: "payments", label: "Payments", icon: "/call.svg", path: "/payment" },
  ];
}

function MobileBottomNav(): JSX.Element | null {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const navItems = mobileNavigationItemsForRole(user?.role);
  if (navItems.length === 0) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#dedee1] bg-app-background px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:hidden"
      aria-label="Mobile bottom navigation"
    >
      <div className="mx-auto flex w-full max-w-md items-center justify-center gap-4 px-2">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              onClick={() => navigate(item.path)}
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                isActive ? "bg-primary-2 text-white" : "text-x-70 hover:bg-grey-light"
              }`}
            >
              {item.iconMode === "doctors" ? (
                <Stethoscope className="h-5 w-5" strokeWidth={2} />
              ) : (
                <img
                  className="h-5 w-5"
                  alt=""
                  src={item.icon}
                  style={{
                    filter: isActive ? "brightness(0) invert(1)" : "none",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Wraps authenticated app routes: shared top bar + page content via `<Outlet />`.
 */
export const MainLayout = (): JSX.Element => {
  return (
    <div className="bg-app-background w-full min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex flex-1 min-h-0 min-w-0 flex-col pb-20 md:pb-0">
        <Outlet />
      </div>
      <MobileBottomNav />
    </div>
  );
};
