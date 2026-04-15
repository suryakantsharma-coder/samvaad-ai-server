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
import {
  fetchPayoutsPage,
  fetchPayoutsSearch,
  patchPayoutSummaryStatus,
  patchPayoutTransactionRazorpayStatus,
} from "../../../../data/payments";
import { useAuth } from "../../../../contexts/AuthProvider";
import { formatTime12h } from "../../../../lib/dateTimeDisplay";
import { showError, showSuccess } from "../../../../lib/toast";
import { isSuperAdminRole } from "../../../../lib/userRole";
import type { PaymentTableRow } from "../../../../types/payment.type";

const PAGE_SIZE = 20;

/** GET /api/payouts `status` query (all | paid | draft, …). */
function statusFilterToPayoutListStatus(
  filter: "all" | "paid" | "draft",
): string {
  if (filter === "paid") return "paid";
  if (filter === "draft") return "draft";
  return "all";
}

/** Search API optional `razorpayStatus`. */
function statusFilterToRazorpayStatus(
  filter: "all" | "paid" | "draft",
): string | undefined {
  if (filter === "paid") return "captured";
  if (filter === "draft") return "created";
  return undefined;
}

function isLikelyMongoId(s: string): boolean {
  return /^[a-f\d]{24}$/i.test(s.trim());
}

function payoutPatchId(row: PaymentTableRow): string | undefined {
  if (row.rowKind === "payout") return undefined;
  if (row.transactionMongoId && isLikelyMongoId(row.transactionMongoId)) {
    return row.transactionMongoId;
  }
  if (isLikelyMongoId(row.id)) return row.id.trim();
  return undefined;
}

/** Super-admin “Mark as paid” applies to payout periods or transaction rows. */
function canMarkPaidRow(row: PaymentTableRow): boolean {
  if (row.rowKind === "payout") {
    return isLikelyMongoId(row.id);
  }
  return Boolean(payoutPatchId(row));
}

/** Show “Mark as paid” only for draft-style rows (payout `draft` or Razorpay `created`). */
function isRowDraftStatus(row: PaymentTableRow): boolean {
  const s = row.status.toLowerCase().trim();
  return s === "draft" || s === "created";
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
  if (s === "pending" || s === "processing") {
    return "bg-[#fff5e6] text-[#ff9800] hover:bg-[#fff5e6]";
  }
  if (s === "draft" || s === "created") {
    return "bg-[#e8e8ea] text-[#57575f] hover:bg-[#e8e8ea]";
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

/** Payout list + Razorpay: paid/captured → Paid; draft/created → Draft. */
function displayPaymentStatus(status: string): string {
  const s = status.toLowerCase().trim();
  if (s === "paid" || s === "captured") return "Paid";
  if (s === "created" || s === "draft") return "Draft";
  return status;
}

function dash(v: string | undefined): string {
  const t = v?.trim();
  return t && t.length > 0 ? t : "—";
}

function displayPriceLabel(priceLabel: string): string {
  const price = priceLabel.replace("₹", "");
  const priceWithoutComma = price.replace(/\s*,\s*/g, "");
  const priceNumber = parseInt(priceWithoutComma) / 100;
  const priceString = priceNumber.toString();
  return priceString && priceString.length > 0 ? priceString : "—";
}

function PayoutInstantCell({
  atMs,
}: {
  atMs: number | undefined;
}): JSX.Element {
  if (atMs != null && !Number.isNaN(atMs)) {
    return (
      <div className="flex flex-col gap-[3px] px-[20px] py-[16px]">
        <span className="font-title-4l font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
          {new Date(atMs).toLocaleDateString()}
        </span>
        <span className="font-title-5l font-[number:var(--title-5l-font-weight)] text-x-70 text-[length:var(--title-5l-font-size)] tracking-[var(--title-5l-letter-spacing)] leading-[var(--title-5l-line-height)] [font-style:var(--title-5l-font-style)]">
          {formatTime12h(atMs)}
        </span>
      </div>
    );
  }
  return <div className="px-[20px] py-[16px] font-title-4l text-x-70">—</div>;
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
              {row?.rowKind === "payout" ? "Payout details" : "Payment details"}
            </DialogTitle>
            <DialogDescription className="font-title-4r text-sm leading-relaxed text-x-70">
              {row?.rowKind === "payout"
                ? "Hospital payout period, total, and status from the payouts list."
                : "Full information for this payment, including hospital, patient, doctor, and appointment when available."}
            </DialogDescription>
          </DialogHeader>

          {row ? (
            <div className="mt-6 flex flex-col gap-4 text-left">
              <DetailBlock title="Hospital">
                <p className="font-title-4r text-[15px] leading-snug text-black">
                  {dash(row.hospitalName)}
                </p>
                {row.rowKind === "payout" && row.hospitalId ? (
                  <p className="mt-2 font-mono text-xs text-x-70 break-all">
                    {row.hospitalId}
                  </p>
                ) : null}
              </DetailBlock>

              {row.rowKind === "payout" ? (
                <DetailBlock title="Payout period">
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <dt className="font-title-5r text-xs text-x-70">Start</dt>
                      <dd className="font-title-4r text-sm leading-snug text-black">
                        {row.payoutStartAtMs != null
                          ? `${new Date(row.payoutStartAtMs).toLocaleString("en-IN")}`
                          : "—"}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="font-title-5r text-xs text-x-70">End</dt>
                      <dd className="font-title-4r text-sm leading-snug text-black">
                        {row.payoutEndAtMs != null
                          ? `${new Date(row.payoutEndAtMs).toLocaleString("en-IN")}`
                          : "—"}
                      </dd>
                    </div>
                  </dl>
                </DetailBlock>
              ) : (
                <>
                  <DetailBlock title="Patient">
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <dt className="font-title-5r text-xs text-x-70">
                          Name
                        </dt>
                        <dd className="font-title-4r text-sm leading-snug text-black">
                          {dash(row.patientName)}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="font-title-5r text-xs text-x-70">
                          Phone
                        </dt>
                        <dd className="font-title-4r text-sm leading-snug text-black">
                          {dash(row.patientPhone)}
                        </dd>
                      </div>
                    </dl>
                  </DetailBlock>

                  <DetailBlock title="Doctor">
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <dt className="font-title-5r text-xs text-x-70">
                          Name
                        </dt>
                        <dd className="font-title-4r text-sm leading-snug text-black">
                          {dash(row.doctorName)}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="font-title-5r text-xs text-x-70">
                          Email
                        </dt>
                        <dd className="font-title-4r text-sm leading-snug text-black break-all">
                          {dash(row.doctorEmail)}
                        </dd>
                      </div>
                    </dl>
                  </DetailBlock>
                </>
              )}

              <DetailBlock
                title={row.rowKind === "payout" ? "Payout" : "Payment"}
              >
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <dt className="font-title-5r text-xs text-x-70">
                      {row.rowKind === "payout" ? "Total" : "Amount"}
                    </dt>
                    <dd className="font-title-4r text-sm font-medium leading-snug text-black">
                      {displayPriceLabel(row.priceLabel)}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-title-5r text-xs text-x-70">
                      {row.rowKind === "payout" ? "Created" : "Paid on"}
                    </dt>
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
                      {row.rowKind === "payout" ? "Payout ID" : "Payment ID"}
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
  /** Required for search; list uses auth scope when omitted (e.g. super admin). */
  hospitalId?: string;
  /** YYYY-MM-DD — sent as fromDate / toDate on list and search. */
  listFromDate: string;
  listToDate: string;
  onRecordsMeta?: (meta: { total: number; totalDoctors?: number }) => void;
}

export const PaymentListSection = ({
  hospitalId = "",
  listFromDate,
  listToDate,
  onRecordsMeta,
}: PaymentListSectionProps): JSX.Element => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canMarkPaid = isSuperAdminRole(user?.role);
  const hospitalLinked = Boolean(hospitalId.trim());
  const canLoadList = hospitalLinked || canMarkPaid;
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PaymentTableRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailRow, setDetailRow] = useState<PaymentTableRow | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "draft">(
    "all",
  );
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");
  const onRecordsMetaRef = useRef(onRecordsMeta);
  onRecordsMetaRef.current = onRecordsMeta;

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  const orderedListRange = useMemo(() => {
    const a = listFromDate.trim();
    const b = listToDate.trim();
    if (!a || !b) {
      return {
        fromYmd: undefined as string | undefined,
        toYmd: undefined as string | undefined,
      };
    }
    if (a <= b) return { fromYmd: a, toYmd: b };
    return { fromYmd: b, toYmd: a };
  }, [listFromDate, listToDate]);

  const listDateRange = useMemo(() => {
    if (orderedListRange.fromYmd && orderedListRange.toYmd) {
      return {
        fromDate: orderedListRange.fromYmd,
        toDate: orderedListRange.toYmd,
      };
    }
    return {
      fromDate: undefined as string | undefined,
      toDate: undefined as string | undefined,
    };
  }, [orderedListRange.fromYmd, orderedListRange.toYmd]);

  const payoutListStatus = useMemo(
    () => statusFilterToPayoutListStatus(statusFilter),
    [statusFilter],
  );

  const searchRazorpayStatus = useMemo(
    () => statusFilterToRazorpayStatus(statusFilter),
    [statusFilter],
  );

  const displayRows = useMemo(() => {
    const sortMs = (row: PaymentTableRow) =>
      row.rowKind === "payout"
        ? (row.payoutStartAtMs ?? row.paymentAtMs ?? 0)
        : (row.paymentAtMs ?? 0);

    return [...rows].sort((a, b) => {
      const ta = sortMs(a);
      const tb = sortMs(b);
      if (ta === 0 && tb === 0) return 0;
      if (ta === 0) return 1;
      if (tb === 0) return -1;
      return dateSort === "newest" ? tb - ta : ta - tb;
    });
  }, [rows, dateSort]);

  const emptyStateMessage = useMemo(() => {
    if (rows.length > 0) return "";
    if (debouncedSearch.trim() && !hospitalLinked && !canMarkPaid) {
      return "Link a hospital to your account to search payouts, or clear the search to browse the list.";
    }
    if (debouncedSearch.trim()) return "No payments match your search.";
    if (statusFilter === "paid") {
      return "No paid payments match the current filters.";
    }
    if (statusFilter === "draft") {
      return "No draft payments match the current filters.";
    }
    if (orderedListRange.fromYmd && orderedListRange.toYmd) {
      return "No payments in the selected date range.";
    }
    return "No payments found.";
  }, [
    rows.length,
    debouncedSearch,
    statusFilter,
    hospitalLinked,
    canMarkPaid,
    orderedListRange.fromYmd,
    orderedListRange.toYmd,
  ]);

  const openDetails = (row: PaymentTableRow) => {
    setDetailRow(row);
    setDetailsOpen(true);
  };

  const loadRef = useRef<() => Promise<void>>(async () => {});

  const load = useCallback(async () => {
    if (!canLoadList) {
      setLoading(false);
      setRows([]);
      setTotalPages(1);
      onRecordsMetaRef.current?.({ total: 0, totalDoctors: undefined });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = debouncedSearch.trim();
      if (q) {
        if (!hospitalLinked && !canMarkPaid) {
          setRows([]);
          setTotalPages(1);
          onRecordsMetaRef.current?.({ total: 0, totalDoctors: undefined });
          return;
        }
        const { rows: nextRows, meta } = await fetchPayoutsSearch({
          ...(hospitalLinked ? { hospitalId: hospitalId.trim() } : {}),
          q,
          page,
          limit: PAGE_SIZE,
          fromDate: listDateRange.fromDate,
          toDate: listDateRange.toDate,
          razorpayStatus: searchRazorpayStatus,
        });
        setRows(nextRows);
        setTotalPages(meta.totalPages);
        onRecordsMetaRef.current?.({
          total: meta.total,
          totalDoctors: meta.totalDoctors,
        });
      } else {
        const { rows: nextRows, meta } = await fetchPayoutsPage({
          page,
          limit: PAGE_SIZE,
          status: payoutListStatus,
          fromDate: listDateRange.fromDate,
          toDate: listDateRange.toDate,
        });
        setRows(nextRows);
        setTotalPages(meta.totalPages);
        onRecordsMetaRef.current?.({
          total: meta.total,
          totalDoctors: meta.totalDoctors,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payments.");
      setRows([]);
      setTotalPages(1);
      onRecordsMetaRef.current?.({ total: 0, totalDoctors: undefined });
    } finally {
      setLoading(false);
    }
  }, [
    canLoadList,
    canMarkPaid,
    hospitalId,
    hospitalLinked,
    page,
    debouncedSearch,
    listDateRange.fromDate,
    listDateRange.toDate,
    payoutListStatus,
    searchRazorpayStatus,
  ]);

  loadRef.current = load;

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [hospitalId]);

  useEffect(() => {
    setPage(1);
  }, [listFromDate, listToDate]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleMarkAsPaid = useCallback(async (row: PaymentTableRow) => {
    if (!isRowDraftStatus(row)) {
      showError(
        "Cannot mark as paid",
        "Only draft items can be marked as paid.",
      );
      return;
    }
    if (!canMarkPaidRow(row)) {
      showError(
        "Cannot mark as paid",
        "This row has no valid id for the payouts API.",
      );
      return;
    }
    try {
      if (row.rowKind === "payout") {
        await patchPayoutSummaryStatus(row.id, "paid");
        showSuccess("Updated", "Payout marked as paid.");
      } else {
        const id = payoutPatchId(row);
        if (!id) return;
        await patchPayoutTransactionRazorpayStatus(id, "captured");
        showSuccess("Updated", "Transaction marked as captured (paid).");
      }
      await loadRef.current();
    } catch (e) {
      showError(
        "Update failed",
        e instanceof Error ? e.message : "Could not update status.",
      );
    }
  }, []);

  if (!canLoadList) {
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
        <div className="flex flex-col items-start gap-2">
          <ToggleGroup
            type="single"
            value={statusFilter}
            onValueChange={(v) => {
              if (v === "all" || v === "paid" || v === "draft") {
                setStatusFilter(v);
              }
            }}
            className="inline-flex items-center gap-[15px] p-[3px] bg-grey-light rounded-[100px]"
          >
            <ToggleGroupItem
              value="all"
              className="inline-flex items-center justify-center gap-[5px] px-5 py-[5px] rounded-[100px] font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] data-[state=on]:bg-primary-2 data-[state=on]:text-white bg-transparent text-x-70"
            >
              All
            </ToggleGroupItem>
            <ToggleGroupItem
              value="paid"
              className="inline-flex items-center justify-center gap-[5px] px-5 py-[5px] rounded-[100px] font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] data-[state=on]:bg-primary-2 data-[state=on]:text-white bg-transparent text-x-70"
            >
              Paid
            </ToggleGroupItem>
            <ToggleGroupItem
              value="draft"
              className="inline-flex items-center justify-center gap-[5px] px-5 py-[5px] rounded-[100px] font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] data-[state=on]:bg-primary-2 data-[state=on]:text-white bg-transparent text-x-70"
            >
              Draft
            </ToggleGroupItem>
          </ToggleGroup>
          {/* <p className="font-title-4r text-x-70 max-w-md leading-snug lg:max-w-sm">
            {canMarkPaid && !hospitalLinked
              ? "Super admin: search runs without a hospital filter if your API allows it."
              : "Search requires a hospital linked to your account."}
          </p> */}
        </div>

        <div className="flex w-full min-w-0 flex-nowrap items-center justify-end gap-[15px] overflow-x-auto lg:min-w-0 lg:flex-1">
          <div className="flex min-w-0 flex-1 max-w-[372px] items-center gap-2.5 px-2 py-2 bg-grey-light rounded-[100px] h-[38px]">
            <SearchIcon className="w-6 h-6 shrink-0 text-black opacity-70" />
            <Input
              placeholder={
                hospitalLinked || canMarkPaid
                  ? "Search payouts (e.g. pay_, order id)..."
                  : "Link a hospital to enable search…"
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!hospitalLinked && !canMarkPaid}
              className="min-w-0 flex-1 border-0 bg-transparent opacity-70 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] focus-visible:ring-0 focus-visible:ring-offset-0 p-0 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

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
                Hospital name
              </TableHead>
              <TableHead className="font-title-4m px-[20px] py-[10px] text-black">
                Price
              </TableHead>
              <TableHead className="font-title-4m px-[20px] py-[10px] text-black">
                Start Date
              </TableHead>
              <TableHead className="font-title-4m px-[20px] py-[10px] text-black">
                End Date
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
                    {row.hospitalName}
                  </TableCell>
                  <TableCell className="px-[20px] py-[16px] font-title-4l text-black">
                    {displayPriceLabel(row.priceLabel)}
                  </TableCell>
                  <TableCell className="p-0 align-top">
                    {row.rowKind === "payout" ? (
                      <PayoutInstantCell atMs={row.payoutStartAtMs} />
                    ) : (
                      <div className="px-[20px] py-[16px] font-title-4l text-x-70">
                        —
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="p-0 align-top">
                    {row.rowKind === "payout" ? (
                      <PayoutInstantCell atMs={row.payoutEndAtMs} />
                    ) : (
                      <div className="px-[20px] py-[16px] font-title-4l text-x-70">
                        —
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-[20px] py-[16px]">
                    <Badge
                      className={`rounded-[100px] px-2.5 py-[5px] font-title-4r ${statusBadgeClass(row.status)}`}
                    >
                      {displayPaymentStatus(row.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-[20px] py-[16px]">
                    <div className="flex flex-wrap items-center justify-start gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-full hover:bg-transparent active:bg-transparent data-[state=open]:bg-transparent"
                            aria-label={`More actions for ${row.rowKind === "payout" ? "payout" : "payment"} ${row.id}`}
                          >
                            <MoreVerticalIcon className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canMarkPaid &&
                          isRowDraftStatus(row) &&
                          canMarkPaidRow(row) ? (
                            <DropdownMenuItem
                              onClick={() => void handleMarkAsPaid(row)}
                            >
                              Mark as paid
                            </DropdownMenuItem>
                          ) : null}
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
                            onClick={() =>
                              void copyText(
                                row.rowKind === "payout"
                                  ? "Payout ID"
                                  : "Payment ID",
                                row.id,
                              )
                            }
                          >
                            {row.rowKind === "payout"
                              ? "Copy payout ID"
                              : "Copy payment ID"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
