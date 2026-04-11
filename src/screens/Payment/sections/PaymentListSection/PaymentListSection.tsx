import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreVertical as MoreVerticalIcon,
  Search as SearchIcon,
} from "lucide-react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import { ListError } from "../../../../components/ui/list-error";
import { Pagination } from "../../../../components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableLoadingRow,
  TableRow,
} from "../../../../components/ui/table";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../../../../components/ui/toggle-group";
import { Input } from "../../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { fetchPaymentsPage } from "../../../../data/payments";
import { formatTime12h } from "../../../../lib/dateTimeDisplay";
import { showError, showSuccess } from "../../../../lib/toast";
import type { PaymentTableRow } from "../../../../types/payment.type";

const PAGE_SIZE = 20;

function toYMDLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDayMs(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function endOfDayMs(d: Date): number {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.getTime();
}

function rowMatchesDateTab(
  row: PaymentTableRow,
  tab: "all" | "today" | "tomorrow",
): boolean {
  if (tab === "all") return true;
  if (row.paymentAtMs == null) return false;
  const now = new Date();
  if (tab === "today") {
    return (
      row.paymentAtMs >= startOfDayMs(now) &&
      row.paymentAtMs <= endOfDayMs(now)
    );
  }
  const tmr = new Date(now);
  tmr.setDate(tmr.getDate() + 1);
  return (
    row.paymentAtMs >= startOfDayMs(tmr) && row.paymentAtMs <= endOfDayMs(tmr)
  );
}

function rowMatchesStatusFilter(
  row: PaymentTableRow,
  filter: "all" | "paid" | "pending" | "failed",
): boolean {
  if (filter === "all") return true;
  const s = row.status.toLowerCase().trim();
  if (filter === "paid") {
    return ["paid", "success", "completed", "captured"].includes(s);
  }
  if (filter === "pending") {
    return ["pending", "processing", "created"].includes(s);
  }
  if (filter === "failed") {
    return ["failed", "cancelled", "canceled", "refunded"].includes(s);
  }
  return true;
}

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (
    s === "paid" ||
    s === "success" ||
    s === "completed" ||
    s === "captured"
  ) {
    return "bg-[#d0f5e6] text-[#00c896] hover:bg-[#d0f5e6]";
  }
  if (s === "pending" || s === "processing" || s === "created") {
    return "bg-[#fff5e6] text-[#ff9800] hover:bg-[#fff5e6]";
  }
  if (
    s === "failed" ||
    s === "cancelled" ||
    s === "canceled" ||
    s === "refunded"
  ) {
    return "bg-[#ffe4e6] text-[#e11d48] hover:bg-[#ffe4e6]";
  }
  return "bg-grey-light text-black hover:bg-grey-light";
}

/** Razorpay and similar APIs use "captured" for a successful charge; show as Paid in the UI. */
function displayPaymentStatus(status: string): string {
  if (status.toLowerCase().trim() === "captured") return "Paid";
  return status;
}

function dash(v: string | undefined): string {
  const t = v?.trim();
  return t && t.length > 0 ? t : "—";
}

function formatPrice(price: string): string {
  return `₹ ${parseInt(price.replace("₹", "").replace(",", "")) / 100}`;
}

function rowMatchesSearch(row: PaymentTableRow, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (needle === "") return true;
  const hay = [
    row.patientName,
    row.doctorName,
    row.status,
    displayPaymentStatus(row.status),
    row.id,
    row.patientPhone,
    row.razorpayOrderId,
    row.paymentDateLabel,
    row.priceLabel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

function PaymentDateCell({ row }: { row: PaymentTableRow }): JSX.Element {
  if (row.paymentAtMs != null && !Number.isNaN(row.paymentAtMs)) {
    return (
      <div className="flex flex-col gap-[3px] px-[20px] py-[16px]">
        <span className="font-title-4l font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
          {new Date(row.paymentAtMs).toLocaleDateString()}
        </span>
        <span className="font-title-5l font-[number:var(--title-5l-font-weight)] text-x-70 text-[length:var(--title-5l-font-size)] tracking-[var(--title-5l-letter-spacing)] leading-[var(--title-5l-line-height)] [font-style:var(--title-5l-font-style)]">
          {formatTime12h(row.paymentAtMs)}
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-[3px] px-[20px] py-[16px]">
      <span className="font-title-4l font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
        {row.paymentDateLabel}
      </span>
    </div>
  );
}

function DetailBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <section className="rounded-[10px] border border-[#dedee1] bg-[#f9fafb] px-4 py-4 sm:px-5 sm:py-5">
      <p className="font-title-4m mb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-x-70">
        {title}
      </p>
      {children}
    </section>
  );
}

function PaymentDetailsDialog({
  row,
  open,
  onOpenChange,
}: {
  row: PaymentTableRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] w-[calc(100vw-1.5rem)] max-w-xl overflow-hidden gap-0 rounded-[12px] border border-[#dedee1] bg-white p-0 shadow-lg sm:w-full">
        <div className="max-h-[min(90vh,720px)] overflow-y-auto overscroll-contain px-5 pb-6 pt-14 sm:px-8 sm:pb-8 sm:pt-16">
          <DialogHeader className="space-y-2 border-b border-[#dedee1] pb-5 text-left">
            <DialogTitle className="[font-family:'Archivo',Helvetica] pr-10 text-xl font-medium leading-snug text-black">
              Payment details
            </DialogTitle>
            <DialogDescription className="font-title-4r text-sm leading-relaxed text-x-70">
              Full information for this payment, including hospital, patient,
              doctor, and appointment when available.
            </DialogDescription>
          </DialogHeader>

          {row ? (
            <div className="mt-6 flex flex-col gap-4 text-left">
              <DetailBlock title="Hospital">
                <p className="font-title-4r text-[15px] leading-snug text-black">
                  {dash(row.hospitalName)}
                </p>
              </DetailBlock>

              <DetailBlock title="Patient">
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <dt className="font-title-5r text-xs text-x-70">Name</dt>
                    <dd className="font-title-4r text-sm leading-snug text-black">
                      {dash(row.patientName)}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-title-5r text-xs text-x-70">Phone</dt>
                    <dd className="font-title-4r text-sm leading-snug text-black">
                      {dash(row.patientPhone)}
                    </dd>
                  </div>
                </dl>
              </DetailBlock>

              <DetailBlock title="Doctor">
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <dt className="font-title-5r text-xs text-x-70">Name</dt>
                    <dd className="font-title-4r text-sm leading-snug text-black">
                      {dash(row.doctorName)}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-title-5r text-xs text-x-70">Email</dt>
                    <dd className="font-title-4r text-sm leading-snug text-black break-all">
                      {dash(row.doctorEmail)}
                    </dd>
                  </div>
                </dl>
              </DetailBlock>

              {/* <DetailBlock title="Appointment">
                <p className="font-title-4r text-[15px] leading-snug text-black">
                  {dash(row.appointmentTimeLabel)}
                </p>

                <p className="font-title-4r text-[15px] leading-snug text-black">
                  Date {}
                  Time{new Date(row.appointmentTimeLabel).toLocaleTimeString()}
                  Time{new Date(row.).toLocaleTimeString()}
                </p>
              </DetailBlock> */}

              <DetailBlock title="Payment">
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <dt className="font-title-5r text-xs text-x-70">Amount</dt>
                    <dd className="font-title-4r text-sm font-medium leading-snug text-black">
                      {formatPrice(row.priceLabel)}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-title-5r text-xs text-x-70">Paid on</dt>
                    <dd className="font-title-4r text-sm leading-snug text-black">
                      {row.paymentAtMs != null &&
                      !Number.isNaN(row.paymentAtMs) ? (
                        <div className="flex flex-col gap-0.5">
                          <span>
                            {new Date(row.paymentAtMs).toLocaleDateString()}
                          </span>
                          <span className="font-title-5l text-x-70 text-xs">
                            {formatTime12h(row.paymentAtMs)}
                          </span>
                        </div>
                      ) : (
                        row.paymentDateLabel
                      )}
                    </dd>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <dt className="font-title-5r text-xs text-x-70">Status</dt>
                    <dd>
                      <Badge
                        className={`rounded-[100px] px-2.5 py-[5px] font-title-4r ${statusBadgeClass(row.status)}`}
                      >
                        {displayPaymentStatus(row.status)}
                      </Badge>
                    </dd>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <dt className="font-title-5r text-xs text-x-70">
                      Payment ID
                    </dt>
                    <dd className="rounded-[8px] border border-[#e8e9ec] bg-white px-3 py-2 font-mono text-xs leading-relaxed text-black">
                      {row.id}
                    </dd>
                  </div>
                  {row.razorpayOrderId ? (
                    <div className="space-y-1 sm:col-span-2">
                      <dt className="font-title-5r text-xs text-x-70">
                        Order ID
                      </dt>
                      <dd className="rounded-[8px] border border-[#e8e9ec] bg-white px-3 py-2 font-mono text-xs leading-relaxed text-black break-all">
                        {row.razorpayOrderId}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </DetailBlock>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

async function copyText(label: string, text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    showSuccess("Copied", `${label} copied to clipboard.`);
  } catch {
    showError("Copy failed", "Could not copy to clipboard.");
  }
}

export interface PaymentListSectionProps {
  hospitalId: string;
  onRecordsMeta?: (meta: { total: number }) => void;
}

export const PaymentListSection = ({
  hospitalId,
  onRecordsMeta,
}: PaymentListSectionProps): JSX.Element => {
  const navigate = useNavigate();
  const [dateTab, setDateTab] = useState<"all" | "today" | "tomorrow">(
    "today",
  );
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PaymentTableRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailRow, setDetailRow] = useState<PaymentTableRow | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "paid" | "pending" | "failed"
  >("all");
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");
  const onRecordsMetaRef = useRef(onRecordsMeta);
  onRecordsMetaRef.current = onRecordsMeta;

  const listFromTo = useMemo(() => {
    if (dateTab === "all") {
      return { fromDate: undefined as string | undefined, toDate: undefined as string | undefined };
    }
    const now = new Date();
    if (dateTab === "today") {
      const ymd = toYMDLocal(now);
      return { fromDate: ymd, toDate: ymd };
    }
    const tmr = new Date(now);
    tmr.setDate(tmr.getDate() + 1);
    const ymd = toYMDLocal(tmr);
    return { fromDate: ymd, toDate: ymd };
  }, [dateTab]);

  const afterDateTab = useMemo(
    () => rows.filter((r) => rowMatchesDateTab(r, dateTab)),
    [rows, dateTab],
  );

  const afterStatus = useMemo(
    () => afterDateTab.filter((r) => rowMatchesStatusFilter(r, statusFilter)),
    [afterDateTab, statusFilter],
  );

  const afterSearch = useMemo(() => {
    if (searchQuery.trim() === "") return afterStatus;
    return afterStatus.filter((r) => rowMatchesSearch(r, searchQuery));
  }, [afterStatus, searchQuery]);

  const displayRows = useMemo(() => {
    return [...afterSearch].sort((a, b) => {
      const ta = a.paymentAtMs ?? 0;
      const tb = b.paymentAtMs ?? 0;
      if (ta === 0 && tb === 0) return 0;
      if (ta === 0) return 1;
      if (tb === 0) return -1;
      return dateSort === "newest" ? tb - ta : ta - tb;
    });
  }, [afterSearch, dateSort]);

  const dateTabLabels = useMemo(
    () => [
      { id: "all" as const, label: "All" },
      { id: "today" as const, label: "Today" },
      { id: "tomorrow" as const, label: "Tomorrow" },
    ],
    [],
  );

  const emptyStateMessage = useMemo(() => {
    if (afterDateTab.length === 0) {
      if (dateTab === "today") return "No payments for today.";
      if (dateTab === "tomorrow") return "No payments for tomorrow.";
      return "No payments found for this hospital.";
    }
    if (afterStatus.length === 0) {
      return "No payments match the selected status.";
    }
    return "No payments match your search.";
  }, [
    dateTab,
    afterDateTab.length,
    afterStatus.length,
    afterSearch.length,
  ]);

  const openDetails = (row: PaymentTableRow) => {
    setDetailRow(row);
    setDetailsOpen(true);
  };

  const load = useCallback(async () => {
    if (!hospitalId.trim()) {
      setLoading(false);
      setRows([]);
      setTotalPages(1);
      onRecordsMetaRef.current?.({ total: 0 });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { rows: nextRows, meta } = await fetchPaymentsPage({
        hospitalId: hospitalId.trim(),
        page,
        limit: PAGE_SIZE,
        fromDate: listFromTo.fromDate,
        toDate: listFromTo.toDate,
      });
      setRows(nextRows);
      setTotalPages(meta.totalPages);
      onRecordsMetaRef.current?.({ total: meta.total });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payments.");
      setRows([]);
      setTotalPages(1);
      onRecordsMetaRef.current?.({ total: 0 });
    } finally {
      setLoading(false);
    }
  }, [hospitalId, page, listFromTo.fromDate, listFromTo.toDate]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [hospitalId]);

  useEffect(() => {
    setPage(1);
  }, [dateTab]);

  if (!hospitalId.trim()) {
    return (
      <section className="flex flex-col bg-white rounded-[10px] overflow-hidden min-h-[280px]">
        <ListError message="No hospital is linked to your account. Payments cannot be loaded." />
      </section>
    );
  }

  return (
    <section className="flex flex-col bg-white rounded-[10px] overflow-hidden">
      <PaymentDetailsDialog
        row={detailRow}
        open={detailsOpen}
        onOpenChange={(next) => {
          setDetailsOpen(next);
          if (!next) setDetailRow(null);
        }}
      />
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-5 md:px-6 pt-5 md:pt-6 pb-[26px]">
        <ToggleGroup
          type="single"
          value={dateTab}
          onValueChange={(v) => {
            if (v === "all" || v === "today" || v === "tomorrow") {
              setDateTab(v);
            }
          }}
          className="inline-flex items-center gap-[15px] p-[3px] bg-grey-light rounded-[100px]"
        >
          {dateTabLabels.map((tab) => (
            <ToggleGroupItem
              key={tab.id}
              value={tab.id}
              className="inline-flex items-center justify-center gap-[5px] px-5 py-[5px] rounded-[100px] font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] data-[state=on]:bg-primary-2 data-[state=on]:text-white bg-transparent text-x-70"
            >
              {tab.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="flex w-full min-w-0 flex-nowrap items-center justify-end gap-[15px] overflow-x-auto lg:min-w-0 lg:flex-1">
          <div className="flex min-w-0 flex-1 max-w-[372px] items-center gap-2.5 px-2 py-2 bg-grey-light rounded-[100px] h-[38px]">
            <SearchIcon className="w-6 h-6 shrink-0 text-black opacity-70" />
            <Input
              placeholder="Search by patient, doctor, status, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent opacity-70 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              if (
                value === "all" ||
                value === "paid" ||
                value === "pending" ||
                value === "failed"
              ) {
                setStatusFilter(value);
              }
            }}
          >
            <SelectTrigger className="flex h-[38px] w-[120px] shrink-0 items-center justify-between px-[15px] py-2 bg-grey-light rounded-[100px] border-0 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={dateSort}
            onValueChange={(value) => {
              if (value === "newest" || value === "oldest") {
                setDateSort(value);
              }
            }}
          >
            <SelectTrigger className="flex h-[38px] min-w-[120px] max-w-[160px] shrink-0 items-center justify-between px-[15px] py-2 bg-grey-light rounded-[100px] border-0 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col overflow-x-auto -mx-0 min-h-[200px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-grey-dark hover:bg-grey-dark border-0">
              <TableHead className="font-title-4m px-[20px] py-[10px] text-black">
                Patient name
              </TableHead>
              <TableHead className="font-title-4m px-[20px] py-[10px] text-black">
                Doctor
              </TableHead>
              <TableHead className="font-title-4m px-[20px] py-[10px] text-black">
                Price
              </TableHead>
              <TableHead className="font-title-4m px-[20px] py-[10px] text-black">
                Payment date and time
              </TableHead>
              <TableHead className="font-title-4m px-[20px] py-[10px] text-black">
                Status
              </TableHead>
              <TableHead className="font-title-4m px-[20px] py-[10px] text-black">
                Action
              </TableHead>
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
            ) : displayRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-[20px] py-12 text-center font-title-4r text-x-70"
                >
                  {emptyStateMessage}
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-[#dedee1] hover:bg-grey-light/50"
                >
                  <TableCell className="px-[20px] py-[16px] font-title-4l text-black">
                    {row.patientName}
                  </TableCell>
                  <TableCell className="px-[20px] py-[16px] font-title-4l text-black">
                    {row.doctorName}
                  </TableCell>
                  <TableCell className="px-[20px] py-[16px] font-title-4l text-black">
                    {formatPrice(row.priceLabel)}
                  </TableCell>
                  <TableCell className="p-[0px] align-top">
                    <PaymentDateCell row={row} />
                  </TableCell>
                  <TableCell className="px-[20px] py-[16px]">
                    <Badge
                      className={`rounded-[100px] px-2.5 py-[5px] font-title-4r ${statusBadgeClass(row.status)}`}
                    >
                      {displayPaymentStatus(row.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-[20px] py-[16px]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-transparent active:bg-transparent data-[state=open]:bg-transparent"
                          aria-label={`Actions for payment ${row.id}`}
                        >
                          <MoreVerticalIcon className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDetails(row)}>
                          View details
                        </DropdownMenuItem>
                        {row.patientId ? (
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(
                                `/prescriptions/patient/${row.patientId}`,
                              )
                            }
                          >
                            View patient
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          onClick={() => void copyText("Payment ID", row.id)}
                        >
                          Copy payment ID
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {!loading && !error && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </section>
  );
};
