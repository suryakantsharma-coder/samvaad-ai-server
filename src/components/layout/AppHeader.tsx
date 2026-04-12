import { memo, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  BellIcon,
  ChevronDownIcon,
  LogOutIcon,
  SettingsIcon,
} from "lucide-react";
import type { User } from "../../types/auth.type";
import { API_BASE_URL } from "../../config";
import { isSuperAdminRole } from "../../lib/userRole";

type NavItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
};

const DEFAULT_NAV_ITEMS: NavItem[] = [
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
  { id: "payments", label: "Payments", icon: "/call.svg", path: "/payment" },
];

function navigationItemsForUser(user: User | null): NavItem[] {
  if (!user) return [];
  if (isSuperAdminRole(user.role)) {
    return [
      { id: "dashboard", label: "Dashboard", icon: "/home.svg", path: "/" },
      {
        id: "hospitals",
        label: "Hospitals",
        icon: "/building.svg",
        path: "/hospitals",
      },
      // { id: "doctors", label: "Doctors", icon: "/pill.svg", path: "/doctors" },
      {
        id: "medicines",
        label: "Medicine",
        icon: "/pill.svg",
        path: "/medicines",
      },
      // {
      //   id: "payments",
      //   label: "Payments",
      //   icon: "/payment.svg",
      //   path: "/payment",
      // },
    ];
  }
  if (user.role === "doctor") {
    return [
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
    ];
  }
  if (user.role === "admin") {
    return [
      {
        id: "hospitals",
        label: "Hospitals",
        icon: "/building.svg",
        path: "/hospitals",
      },
      {
        id: "payments",
        label: "Payments",
        icon: "/payment.svg",
        path: "/payment",
      },
    ];
  }
  if (user.role === "hospital_admin") {
    return [
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
      {
        id: "payments",
        label: "Payments",
        icon: "/payment.svg",
        path: "/payment",
      },
    ];
  }
  return DEFAULT_NAV_ITEMS;
}

/** Full URL for avatar: API paths and `profilePicUrl` / legacy picture fields. */
function resolveUserAvatarSrcForNav(u: User | null | undefined): string {
  const raw = u?.profilePicUrl ?? u?.profilePictureUrl ?? u?.profilePicture;
  if (!raw?.trim()) return "/ellipse-1.png";
  const t = raw.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return t.startsWith("/") ? `${API_BASE_URL}${t}` : `${API_BASE_URL}/${t}`;
}

function initialsFromUserName(name: string | undefined): string {
  if (!name?.trim()) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const NAV_SHIMMER_PLACEHOLDER_COUNT = 5;

function HeaderNavTabsShimmer(): JSX.Element {
  return (
    <nav
      className="inline-flex flex-wrap items-center justify-center gap-[16px] md:gap-4 p-1 bg-white rounded-[50px] h-[42px] min-h-[42px]"
      aria-busy="true"
      aria-label="Loading navigation"
    >
      {Array.from({ length: NAV_SHIMMER_PLACEHOLDER_COUNT }).map((_, i) => (
        <div
          key={i}
          className="relative h-8 w-[92px] shrink-0 overflow-hidden rounded-full bg-grey-light/85"
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-[45%] bg-gradient-to-r from-transparent via-white/80 to-transparent animate-nav-tab-shimmer"
            aria-hidden
          />
        </div>
      ))}
    </nav>
  );
}

/**
 * Only this subtree subscribes to the router location — updates active tab without
 * re-rendering the logo or user menu on each navigation.
 */
function AppHeaderNavTabs(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, authHydrating } = useAuth();

  const navigationItems = useMemo(() => navigationItemsForUser(user), [user]);

  if (authHydrating) {
    return <HeaderNavTabsShimmer />;
  }

  console.log("navigationItems", navigationItems);

  return (
    <nav className="inline-flex flex-wrap items-center justify-center gap-[16px] md:gap-4 p-1 bg-white rounded-[50px] h-[42px]">
      {navigationItems.map((item) => {
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
      })}
    </nav>
  );
}

const AppHeaderUserMenu = memo(function AppHeaderUserMenu(): JSX.Element {
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();

  const userAvatarSrc = useMemo(() => resolveUserAvatarSrcForNav(user), [user]);
  const userAvatarInitials = useMemo(
    () => initialsFromUserName(user?.name),
    [user?.name],
  );

  return (
    <div className="inline-flex flex-wrap items-center gap-3 md:gap-5">
      <div className="flex justify-center items-center">
        <div className="rounded-[50px] bg-white px-2 pt-1 flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-[50px]">
              <div className="inline-flex items-center gap-[10px]">
                <Avatar className="w-9 h-9">
                  <AvatarImage
                    src={userAvatarSrc}
                    alt={user?.name || "User"}
                    loading="lazy"
                  />
                  <AvatarFallback>{userAvatarInitials}</AvatarFallback>
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
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <SettingsIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Notifications</span>
              </DropdownMenuItem>
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
    </div>
  );
});

/**
 * App shell header: logo, role-based nav tabs, user menu.
 * `useLocation` is isolated to {@link AppHeaderNavTabs} so route changes do not
 * re-run the user menu or logo. The header root is `memo`’d so when the layout
 * re-renders for an outlet swap, this component skips reconciliation unless props change.
 */
export const AppHeader = memo(function AppHeader(): JSX.Element {
  return (
    <header className="flex flex-col md:flex-row items-center justify-between w-full min-h-[78px] px-4 md:px-[30px] py-4 gap-4 relative">
      <img
        className="w-[140px] h-[52px]"
        alt="Febf d c"
        src="/Logo-light-bg.svg"
      />

      <AppHeaderNavTabs />

      <AppHeaderUserMenu />
    </header>
  );
});
