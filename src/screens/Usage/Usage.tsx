import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Coins,
  PhoneCall,
} from "lucide-react";
import { currentMonthStartEndYmd } from "../../lib/currentMonthDateRange";
import { FinanceListDateRangeBar } from "../../components/payment/FinanceListDateRangeBar";
import { ListError } from "../../components/ui/list-error";
import { Pagination } from "../../components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableLoadingRow,
  TableRow,
} from "../../components/ui/table";
import { fetchCallAnalytics } from "../../data/callAnalytics";
import type { CallAnalyticsPayload } from "../../types/callAnalytics.type";

const PAGE_SIZE = 20;

function isAbortError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof DOMException && err.name === "AbortError") return true;
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return message.includes("abort");
}

function formatSecondsToReadable(totalSeconds: number): string {
  const safe = Math.max(0, Math.trunc(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatDateTime(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function formatDirection(value?: string): string {
  if (!value?.trim()) return "—";
  if (value.toLowerCase() === "inbound") return "Inbound";
  if (value.toLowerCase() === "outbound") return "Outbound";
  return value;
}

function statusBadgeClasses(status?: string): string {
  const normalized = status?.toLowerCase() ?? "";
  if (normalized === "completed") {
    return "bg-[#e8f7ef] text-[#0f8a4b]";
  }
  if (normalized === "failed" || normalized === "busy" || normalized === "no-answer") {
    return "bg-[#fdecec] text-[#ba1a1a]";
  }
  return "bg-grey-light text-x-70";
}

type UsageKpiCardProps = {
  icon: JSX.Element;
  label: string;
  value: string;
  helper: string;
};

function UsageKpiCard({ icon, label, value, helper }: UsageKpiCardProps): JSX.Element {
  return (
    <div className="rounded-[10px] bg-white border border-[#dedee1] p-4 md:p-5 flex flex-col gap-2">
      <div className="inline-flex items-center gap-2.5">
        <span className="inline-flex items-center justify-center rounded-full bg-grey-light p-2.5">
          {icon}
        </span>
        <p className="font-title-4m text-x-70">{label}</p>
      </div>
      <p className="font-title-1 text-black">{value}</p>
      <p className="font-title-4r text-x-70">{helper}</p>
    </div>
  );
}

export const Usage = (): JSX.Element => {
  const [range, setRange] = useState(() => currentMonthStartEndYmd());
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<CallAnalyticsPayload | null>(null);

  const loadAnalytics = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await fetchCallAnalytics({
          page,
          limit: PAGE_SIZE,
          startDate: range.start,
          endDate: range.end,
          signal,
        });
        if (signal?.aborted) return;
        setPayload(data);
      } catch (err) {
        if (isAbortError(err) || signal?.aborted) {
          return;
        }
        setPayload(null);
        setError(err instanceof Error ? err.message : "Failed to load usage analytics.");
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [page, range.end, range.start],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadAnalytics(controller.signal);
    return () => controller.abort();
  }, [loadAnalytics]);

  useEffect(() => {
    setPage(1);
  }, [range.start, range.end]);

  const totals = payload?.totals;
  const calls = payload?.calls ?? [];
  const pagination = payload?.pagination;

  const kpis = useMemo(
    () => [
      {
        id: "credits-used",
        icon: <Coins className="h-5 w-5 text-primary-2" aria-hidden />,
        label: "Credits Used",
        value: (totals?.totalCreditsUsed ?? 0).toLocaleString("en-IN"),
        helper: "In selected date range",
      },
      {
        id: "total-calls",
        icon: <PhoneCall className="h-5 w-5 text-primary-2" aria-hidden />,
        label: "Total Calls",
        value: (totals?.totalCalls ?? 0).toLocaleString("en-IN"),
        helper: `${(totals?.missedCalls ?? 0).toLocaleString("en-IN")} missed calls`,
      },
      {
        id: "answered-calls",
        icon: <CheckCircle2 className="h-5 w-5 text-primary-2" aria-hidden />,
        label: "Answered Calls",
        value: (totals?.answeredCalls ?? 0).toLocaleString("en-IN"),
        helper: "Calls marked as answered",
      },
      {
        id: "avg-duration",
        icon: <CalendarClock className="h-5 w-5 text-primary-2" aria-hidden />,
        label: "Avg Call Duration",
        value: formatSecondsToReadable(Math.round(totals?.averageCallDuration ?? 0)),
        helper: `Total duration: ${formatSecondsToReadable(totals?.totalDuration ?? 0)}`,
      },
    ],
    [totals],
  );

  return (
    <div className="w-full flex flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-col lg:flex-row items-start justify-between gap-4">
        <div className="inline-flex flex-col items-start gap-[5px]">
          <h1 className="text-[40px] leading-[44px] font-medium text-black [font-family:'Archivo',Helvetica]">
            Usage
          </h1>
          <p className="font-title-3l text-black opacity-90 max-w-prose">
            Monthly call analytics and credit usage for your voice number.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#dedee1] px-3 py-1.5">
            <BarChart3 className="h-4 w-4 text-primary-2" aria-hidden />
            <span className="font-title-4r text-x-70">
              {payload?.hospitalName ?? "Hospital"}
              {payload?.voiceAgentNumber ? ` • ${payload.voiceAgentNumber}` : ""}
            </span>
          </div>
        </div>

        <div className="inline-flex rounded-[50px] border border-[#dedee1] bg-white">
          <FinanceListDateRangeBar
            start={range.start}
            end={range.end}
            onRangeChange={setRange}
          />
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <UsageKpiCard
            key={kpi.id}
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.value}
            helper={kpi.helper}
          />
        ))}
      </section>

      <section className="flex flex-col bg-white rounded-[10px] overflow-hidden border border-[#dedee1]">
        <div className="px-5 md:px-6 py-4 border-b border-[#dedee1]">
          <h2 className="font-title-3m text-black">Call Details</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-grey-dark hover:bg-grey-dark border-0">
              <TableHead className="px-5 py-3 text-black font-title-4m">Caller</TableHead>
              <TableHead className="px-5 py-3 text-black font-title-4m">Start time</TableHead>
              <TableHead className="px-5 py-3 text-black font-title-4m">Direction</TableHead>
              <TableHead className="px-5 py-3 text-black font-title-4m">Duration</TableHead>
              <TableHead className="px-5 py-3 text-black font-title-4m">Credits</TableHead>
              <TableHead className="px-5 py-3 text-black font-title-4m">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableLoadingRow colSpan={6} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0 align-top">
                  <ListError message={error} />
                </TableCell>
              </TableRow>
            ) : calls.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-5 py-12 text-center font-title-4r text-x-70"
                >
                  No call records found in this date range.
                </TableCell>
              </TableRow>
            ) : (
              calls.map((call) => (
                <TableRow
                  key={call._id}
                  className="border-b border-[#dedee1] hover:bg-grey-light/50"
                >
                  <TableCell className="px-5 py-4 font-title-4l text-black max-w-[180px] truncate">
                    {call.from || "Unknown"}
                  </TableCell>
                  <TableCell className="px-5 py-4 font-title-4l text-black">
                    {formatDateTime(call.startTime ?? call.createdAt)}
                  </TableCell>
                  <TableCell className="px-5 py-4 font-title-4l text-black">
                    {formatDirection(call.direction)}
                  </TableCell>
                  <TableCell className="px-5 py-4 font-title-4l text-black">
                    {formatSecondsToReadable(call.duration ?? 0)}
                  </TableCell>
                  <TableCell className="px-5 py-4 font-title-4l text-black">
                    {(call.creditUsed ?? 0).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClasses(call.status)}`}
                    >
                      {call.status || "Unknown"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!loading && !error && (pagination?.totalPages ?? 1) > 1 && (
          <Pagination
            currentPage={page}
            totalPages={pagination?.totalPages ?? 1}
            onPageChange={setPage}
          />
        )}
      </section>
    </div>
  );
};
