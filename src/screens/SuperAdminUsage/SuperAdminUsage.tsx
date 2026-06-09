import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarClock, Coins, PhoneCall } from "lucide-react";
import { ListError } from "../../components/ui/list-error";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableLoadingRow,
  TableRow,
} from "../../components/ui/table";
import { fetchSuperAdminCallAnalytics } from "../../data/superAdminCallAnalytics";
import type { SuperAdminCallAnalyticsRow } from "../../types/superAdminCallAnalytics.type";

function formatSecondsToReadable(totalSeconds: number): string {
  const safe = Math.max(0, Math.trunc(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function isAbortError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof DOMException && err.name === "AbortError") return true;
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return message.includes("abort");
}

type KpiCardProps = {
  icon: JSX.Element;
  label: string;
  value: string;
  helper: string;
};

function KpiCard({ icon, label, value, helper }: KpiCardProps): JSX.Element {
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

export const SuperAdminUsage = (): JSX.Element => {
  const [rows, setRows] = useState<SuperAdminCallAnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSuperAdminCallAnalytics(controller.signal);
        if (controller.signal.aborted) return;
        setRows(data);
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) return;
        setRows([]);
        setError(err instanceof Error ? err.message : "Failed to load usage analytics.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.totalHospitals += 1;
        acc.totalCalls += row.totalCalls;
        acc.totalCreditsUsed += row.totalCreditsUsed;
        acc.totalDuration += row.totalDuration;
        return acc;
      },
      { totalHospitals: 0, totalCalls: 0, totalCreditsUsed: 0, totalDuration: 0 },
    );
  }, [rows]);

  return (
    <div className="w-full flex flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-col items-start gap-[5px]">
        <h1 className="text-[40px] leading-[44px] font-medium text-black [font-family:'Archivo',Helvetica]">
          Usage
        </h1>
        <p className="font-title-3l text-black opacity-90 max-w-prose">
          Credit and call usage across all hospitals.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={<BarChart3 className="h-5 w-5 text-primary-2" aria-hidden />}
          label="Hospitals"
          value={totals.totalHospitals.toLocaleString("en-IN")}
          helper="Hospitals with usage analytics"
        />
        <KpiCard
          icon={<PhoneCall className="h-5 w-5 text-primary-2" aria-hidden />}
          label="Total Calls"
          value={totals.totalCalls.toLocaleString("en-IN")}
          helper="Across all hospitals"
        />
        <KpiCard
          icon={<Coins className="h-5 w-5 text-primary-2" aria-hidden />}
          label="Credits Used"
          value={totals.totalCreditsUsed.toLocaleString("en-IN")}
          helper="Total credit consumption"
        />
        <KpiCard
          icon={<CalendarClock className="h-5 w-5 text-primary-2" aria-hidden />}
          label="Total Duration"
          value={formatSecondsToReadable(totals.totalDuration)}
          helper="Combined call duration"
        />
      </section>

      <section className="flex flex-col bg-white rounded-[10px] overflow-hidden border border-[#dedee1]">
        <div className="px-5 md:px-6 py-4 border-b border-[#dedee1]">
          <h2 className="font-title-3m text-black">Hospital Usage Breakdown</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-grey-dark hover:bg-grey-dark border-0">
              <TableHead className="px-5 py-3 text-black font-title-4m">Hospital</TableHead>
              <TableHead className="px-5 py-3 text-black font-title-4m">Voice Number</TableHead>
              <TableHead className="px-5 py-3 text-black font-title-4m">Calls</TableHead>
              <TableHead className="px-5 py-3 text-black font-title-4m">Answered</TableHead>
              <TableHead className="px-5 py-3 text-black font-title-4m">Missed</TableHead>
              <TableHead className="px-5 py-3 text-black font-title-4m">Credits</TableHead>
              <TableHead className="px-5 py-3 text-black font-title-4m">Avg Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableLoadingRow colSpan={7} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0 align-top">
                  <ListError message={error} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="px-5 py-12 text-center font-title-4r text-x-70">
                  No usage records found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.hospitalId} className="border-b border-[#dedee1] hover:bg-grey-light/50">
                  <TableCell className="px-5 py-4 font-title-4l text-black max-w-[260px] truncate">
                    {row.hospitalName}
                  </TableCell>
                  <TableCell className="px-5 py-4 font-title-4l text-black">
                    {row.voiceAgentNumber || "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4 font-title-4l text-black">
                    {row.totalCalls.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="px-5 py-4 font-title-4l text-black">
                    {row.answeredCalls.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="px-5 py-4 font-title-4l text-black">
                    {row.missedCalls.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="px-5 py-4 font-title-4l text-black">
                    {row.totalCreditsUsed.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="px-5 py-4 font-title-4l text-black">
                    {formatSecondsToReadable(Math.round(row.averageCallDuration))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
};
