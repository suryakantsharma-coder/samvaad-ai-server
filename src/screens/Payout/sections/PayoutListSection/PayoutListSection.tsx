import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreVertical as MoreVerticalIcon,
  Search as SearchIcon,
} from "lucide-react";
import { PaymentDetailsDialog } from "../../../../components/payment/PaymentDetailsDialog";
import { copyFinanceLabelToClipboard } from "../../../../components/payment/financeClipboard";
import {
  PayoutInstantCell,
  StatusBadge,
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
import { FinanceListDateRangeBar } from "../../../../components/payment/FinanceListDateRangeBar";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../../../../components/ui/toggle-group";
import {
  fetchPayoutsPage,
  fetchPayoutsSearch,
  patchPayoutSummaryStatus,
  patchPayoutTransactionRazorpayStatus,
} from "../../../../data/payments";
import { showError, showSuccess } from "../../../../lib/toast";
import type { PaymentTableRow } from "../../../../types/payment.type";
import type { SuperAdminPayoutFilter } from "../PayoutHeaderSection";

const PAGE_SIZE = 20;

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

function canMarkPaidRow(row: PaymentTableRow): boolean {
  if (row.rowKind === "payout") {
    return isLikelyMongoId(row.id);
  }
  return Boolean(payoutPatchId(row));
}

function isRowDraftStatus(row: PaymentTableRow): boolean {
  const s = row.status.toLowerCase().trim();
  return s === "draft" || s === "created";
}

export interface PayoutListSectionProps {
  hospitalId?: string;
  listFromDate: string;
  listToDate: string;
  onListDateRangeChange: (range: { start: string; end: string }) => void;
  payoutFilter: SuperAdminPayoutFilter;
  onPayoutFilterChange: (filter: SuperAdminPayoutFilter) => void;
  onRecordsMeta?: (meta: { total: number; totalDoctors?: number }) => void;
}

export const PayoutListSection = ({
  hospitalId = "",
  listFromDate,
  listToDate,
  onListDateRangeChange,
  payoutFilter,
  onPayoutFilterChange,
  onRecordsMeta,
}: PayoutListSectionProps): JSX.Element => {
  const navigate = useNavigate();
  const hospitalLinked = Boolean(hospitalId.trim());
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PaymentTableRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailRow, setDetailRow] = useState<PaymentTableRow | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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

  const payoutApiFilter = payoutFilter;

  const emptyStateMessage = useMemo(() => {
    if (rows.length > 0) return "";
    if (debouncedSearch.trim()) {
      return "No payouts match your search.";
    }
    if (payoutApiFilter === "paid") {
      return "No paid payouts match the current filters.";
    }
    if (payoutApiFilter === "draft") {
      return "No draft payouts match the current filters.";
    }
    if (orderedListRange.fromYmd && orderedListRange.toYmd) {
      return "No payouts in the selected date range.";
    }
    return "No payouts found.";
  }, [
    rows.length,
    debouncedSearch,
    payoutApiFilter,
    orderedListRange.fromYmd,
    orderedListRange.toYmd,
  ]);

  const openDetails = (row: PaymentTableRow) => {
    setDetailRow(row);
    setDetailsOpen(true);
  };

  const loadRef = useRef<() => Promise<void>>(async () => {});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = debouncedSearch.trim();
      if (q) {
        const { rows: nextRows, meta } = await fetchPayoutsSearch({
          q,
          page,
          limit: PAGE_SIZE,
          filter: payoutApiFilter,
          sort: dateSort,
          fromDate: listDateRange.fromDate,
          toDate: listDateRange.toDate,
          ...(hospitalLinked ? { hospitalId: hospitalId.trim() } : {}),
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
          filter: payoutApiFilter,
          fromDate: listDateRange.fromDate,
          toDate: listDateRange.toDate,
          sort: dateSort,
        });
        setRows(nextRows);
        setTotalPages(meta.totalPages);
        onRecordsMetaRef.current?.({
          total: meta.total,
          totalDoctors: meta.totalDoctors,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payouts.");
      setRows([]);
      setTotalPages(1);
      onRecordsMetaRef.current?.({ total: 0, totalDoctors: undefined });
    } finally {
      setLoading(false);
    }
  }, [
    hospitalId,
    hospitalLinked,
    page,
    debouncedSearch,
    listDateRange.fromDate,
    listDateRange.toDate,
    payoutApiFilter,
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
  }, [payoutFilter]);

  useEffect(() => {
    setPage(1);
  }, [dateSort]);

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
      <div className="flex flex-col gap-4 px-5 md:px-6 pt-5 md:pt-6 pb-[26px]">
        <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-[15px]">
          <ToggleGroup
            type="single"
            value={payoutFilter}
            onValueChange={(v) => {
              if (v === "all" || v === "draft" || v === "paid")
                onPayoutFilterChange(v as SuperAdminPayoutFilter);
            }}
            className="inline-flex items-center gap-[15px] p-[3px] bg-white rounded-[100px] border border-[#dedee1]"
          >
            <ToggleGroupItem
              value="all"
              className="inline-flex items-center justify-center gap-[5px] px-5 py-[5px] rounded-[100px] font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] data-[state=on]:bg-primary-2 data-[state=on]:text-white bg-transparent text-x-70"
            >
              All
            </ToggleGroupItem>

            <ToggleGroupItem
              value="draft"
              className="inline-flex items-center justify-center gap-[5px] px-5 py-[5px] rounded-[100px] font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] data-[state=on]:bg-primary-2 data-[state=on]:text-white bg-transparent text-x-70"
            >
              Draft
            </ToggleGroupItem>
            <ToggleGroupItem
              value="paid"
              className="inline-flex items-center justify-center gap-[5px] px-5 py-[5px] rounded-[100px] font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] data-[state=on]:bg-primary-2 data-[state=on]:text-white bg-transparent text-x-70"
            >
              Paid
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="w-[60%] flex flex-wrap items-center justify-end gap-[15px]">
            <div className="flex min-w-0 flex-1 max-w-[372px] basis-full sm:basis-auto items-center gap-2.5 px-2 py-2 bg-grey-light rounded-[100px] h-[38px] sm:min-w-[200px]">
              <SearchIcon className="w-6 h-6 shrink-0 text-black opacity-70" />
              <Input
                placeholder="Search hospitals (name)…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent opacity-70 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
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
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-[20px] py-12 text-center font-title-4r text-x-70"
                >
                  {emptyStateMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-[#dedee1] hover:bg-grey-light/50"
                >
                  <TableCell className="px-[20px] py-[16px] font-title-4l text-black">
                    {row.hospitalName}
                  </TableCell>
                  <TableCell className="px-[20px] py-[16px] font-title-4l text-black">
                    ₹ {displayPriceLabel(row.priceLabel)}
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
                            aria-label={`More actions for ${row.rowKind === "payout" ? "payout" : "payment"} ${row.id}`}
                          >
                            <MoreVerticalIcon className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isRowDraftStatus(row) && canMarkPaidRow(row) ? (
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
                              void copyFinanceLabelToClipboard(
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
