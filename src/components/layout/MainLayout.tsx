import { Outlet } from "react-router-dom";
import { AppHeader } from "./AppHeader";

/**
 * Wraps authenticated app routes: shared top bar + page content via `<Outlet />`.
 */
export const MainLayout = (): JSX.Element => {
  return (
    <div className="bg-app-background w-full min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex flex-1 min-h-0 min-w-0 flex-col">
        <Outlet />
      </div>
    </div>
  );
};
