import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreVertical as MoreVerticalIcon,
  Search as SearchIcon,
} from "lucide-react";
import { PaymentDetailsDialog } from "../../../../components/payment/PaymentDetailsDialog";
import { copyFinanceLabelToClipboard } from "../../../../components/payment/financeClipboard";
import {
  StatusBadge,
  TransactionPaidCell,
  displayPriceLabel,
} from "../../../../components/payment/paymentRowDisplay";
import { Button } from "../../../../components/ui/button";
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
import { Input } from "../../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import {
  fetchHospitalPaymentsList,
  fetchHospitalPaymentsSearch,
} from "../../../../data/payments";
import type { PaymentTableRow } from "../../../../types/payment.type";

const PAGE_SIZE = 20;

function statusFilterToPaymentsSearchStatus(
  filter: "all" | "paid" | "draft",
): string | undefined {
  if (filter === "paid") return "captured";
  if (filter === "draft") return "created";
  return undefined;
}

export interface PaymentListSectionProps {
  hospitalId?: string;
  listFromDate: string;
  listToDate: string;
  onRecordsMeta?: (meta: {
    total: number;
    totalDoctors?: number;
    totalAmountPaise?: number;
  }) => void;
}

export const PaymentListSection = ({
  hospitalId = "",
  listFromDate,
  listToDate,
  onRecordsMeta,
}: PaymentListSectionProps): JSX.Element => {
  const navigate = useNavigate();
  const hospitalLinked = Boolean(hospitalId.trim());
  const canLoadList = hospitalLinked;
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PaymentTableRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailRow, setDetailRow] = useState<PaymentTableRow | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter] = useState<"all" | "paid" | "draft">("all");
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

  const paymentsSearchStatus = useMemo(
    () => statusFilterToPaymentsSearchStatus(statusFilter),
    [statusFilter],
  );

  const serverPaymentSortActive = hospitalLinked;

  const displayRows = useMemo(() => {
    if (serverPaymentSortActive) return rows;
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
  }, [rows, dateSort, serverPaymentSortActive]);

  const emptyStateMessage = useMemo(() => {
    if (rows.length > 0) return "";
    if (debouncedSearch.trim() && !hospitalLinked) {
      return "Link a hospital to your account to search payments, or clear the search to browse the list.";
    }
    if (debouncedSearch.trim()) {
      return "No payments match your search.";
    }
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
      onRecordsMetaRef.current?.({
        total: 0,
        totalDoctors: undefined,
        totalAmountPaise: undefined,
      });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = debouncedSearch.trim();
      if (q) {
        const { rows: nextRows, meta } = await fetchHospitalPaymentsSearch({
          hospitalId: hospitalId.trim(),
          q,
          page,
          limit: PAGE_SIZE,
          paymentStatus: paymentsSearchStatus,
          fromDate: listDateRange.fromDate,
          toDate: listDateRange.toDate,
          sort: dateSort,
        });
        setRows(nextRows);
        setTotalPages(meta.totalPages);
        onRecordsMetaRef.current?.({
          total: meta.total,
          totalDoctors: meta.totalDoctors,
          totalAmountPaise: meta.totalAmountPaise,
        });
      } else {
        const { rows: nextRows, meta } = await fetchHospitalPaymentsList({
          hospitalId: hospitalId.trim(),
          page,
          limit: PAGE_SIZE,
          filter: statusFilter,
          fromDate: listDateRange.fromDate,
          toDate: listDateRange.toDate,
          sort: dateSort,
        });
        setRows(nextRows);
        setTotalPages(meta.totalPages);
        onRecordsMetaRef.current?.({
          total: meta.total,
          totalDoctors: meta.totalDoctors,
          totalAmountPaise: meta.totalAmountPaise,
        });
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load payments.",
      );
      setRows([]);
      setTotalPages(1);
      onRecordsMetaRef.current?.({
        total: 0,
        totalDoctors: undefined,
        totalAmountPaise: undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [
    canLoadList,
    hospitalId,
    page,
    debouncedSearch,
    listDateRange.fromDate,
    listDateRange.toDate,
    paymentsSearchStatus,
    statusFilter,
    dateSort,
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

  useEffect(() => {
    setPage(1);
  }, [dateSort]);

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
        <div className="flex flex-col items-start gap-2" />

        <div className="flex w-full min-w-0 flex-nowrap items-center justify-end gap-[15px] overflow-x-auto lg:min-w-0 lg:flex-1">
          <div className="flex min-w-0 flex-1 max-w-[372px] items-center gap-2.5 px-2 py-2 bg-grey-light rounded-[100px] h-[38px]">
            <SearchIcon className="w-6 h-6 shrink-0 text-black opacity-70" />
            <Input
              placeholder="Search payments (patient, payment id, order id)…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!hospitalLinked}
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
                Patient
              </TableHead>
              <TableHead className="font-title-4m px-[20px] py-[10px] text-black">
                Doctor
              </TableHead>
              <TableHead className="font-title-4m px-[20px] py-[10px] text-black">
                Amount
              </TableHead>
              <TableHead className="font-title-4m px-[20px] py-[10px] text-black">
                Paid on
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
                <TableCell
                  colSpan={6}
                  className="p-0 align-top"
                >
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
                  <TableCell className="px-[20px] py-[16px] font-title-4l text-black max-w-[180px]">
                    {row.patientName}
                  </TableCell>
                  <TableCell className="px-[20px] py-[16px] font-title-4l text-black max-w-[180px]">
                    {row.doctorName}
                  </TableCell>
                  <TableCell className="px-[20px] py-[16px] font-title-4l text-black">
                    ₹ {displayPriceLabel(row.priceLabel)}
                  </TableCell>
                  <TableCell className="p-0 align-top">
                    <TransactionPaidCell row={row} />
                  </TableCell>
                  <TableCell className="px-[20px] py-[16px]">
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="px-[20px] py-[16px]">
                    <div className="flex flex-wrap items-center justify-start gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-full hover:bg-transparent active:bg-transparent data-[state=open]:bg-transparent"
                            aria-label={`More actions for payment ${row.id}`}
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
                            onClick={() =>
                              void copyFinanceLabelToClipboard(
                                "Payment ID",
                                row.id,
                              )
                            }
                          >
                            Copy payment ID
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
