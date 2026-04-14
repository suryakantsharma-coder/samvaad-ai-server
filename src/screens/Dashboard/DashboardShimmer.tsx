import { cn } from "../../lib/utils";

function ShimmerCard({ className }: { className?: string }): JSX.Element {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[10px] bg-white shadow-[0px_2px_6px_#a2a6b040] border-0",
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[#ececee]/75" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[38%] bg-gradient-to-r from-transparent via-white/85 to-transparent animate-nav-tab-shimmer" />
    </div>
  );
}

/**
 * Skeleton layout shown while dashboard API data is loading (initial load and refetch).
 */
export function DashboardShimmer(): JSX.Element {
  return (
    <>
      <div
        className="flex flex-1 min-h-0 gap-[15px] px-[30px] pt-[15px] items-stretch"
        aria-busy="true"
        aria-label="Loading dashboard"
      >
        <div className="flex flex-col gap-[15px] flex-1 min-w-0 min-h-0 overflow-y-auto pb-[15px]">
          <div className="flex gap-[15px]">
            <ShimmerCard className="flex-1 h-[148px]" />
            <ShimmerCard className="flex-1 h-[148px]" />
            <ShimmerCard className="flex-1 h-[148px]" />
          </div>

          <div className="flex gap-[15px]">
            <div className="w-[320px] flex-shrink-0">
              <ShimmerCard className="h-[375px] w-full" />
            </div>
            <div className="flex-1 min-w-0">
              <ShimmerCard className="h-[375px] w-full" />
            </div>
          </div>

          <ShimmerCard className="h-[420px] w-full" />
        </div>

        <div className="w-[min(100%,420px)] sm:w-[410px] shrink-0 flex flex-col min-h-0 overflow-hidden pb-[15px] self-stretch">
          <ShimmerCard className="h-[965px] w-full min-h-0 flex-1" />
        </div>
      </div>

      <section className="w-full shrink-0 px-[30px] pb-[30px]">
        <ShimmerCard className="h-[min(28rem,55vh)] w-full" />
      </section>
    </>
  );
}
