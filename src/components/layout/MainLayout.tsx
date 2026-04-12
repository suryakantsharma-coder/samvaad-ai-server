import { Outlet } from "react-router-dom";
import { AppHeader } from "./AppHeader";

/**
 * Wraps authenticated app routes: shared top bar + page content via `<Outlet />`.
 */
export const MainLayout = (): JSX.Element => {
  return (
    <div className="bg-app-background w-full min-h-screen flex flex-col">
      <AppHeader />
      <Outlet />
    </div>
  );
};
