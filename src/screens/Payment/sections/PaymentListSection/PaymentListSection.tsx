import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical as MoreVerticalIcon } from "lucide-react";
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
import { LoadingSpinner } from "../../../../components/ui/loading-spinner";
import { Pagination } from "../../../../components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { fetchPaymentsPage } from "../../../../data/payments";
import { showError, showSuccess, showWarning } from "../../../../lib/toast";
import type { PaymentTableRow } from "../../../../types/payment.type";

const PAGE_SIZE = 20;

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

function dash(v: string | undefined): string {
  const t = v?.trim();
  return t && t.length > 0 ? t : "—";
}

function formatPrice(price: string): string {
  return `₹ ${parseInt(price.replace("₹", "").replace(",", "")) / 100}`;
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
                      {row.paymentDateLabel}
                    </dd>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <dt className="font-title-5r text-xs text-x-70">Status</dt>
                    <dd>
                      <Badge
                        className={`rounded-[100px] px-2.5 py-[5px] font-title-4r ${statusBadgeClass(row.status)}`}
                      >
                        {row.status}
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
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PaymentTableRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailRow, setDetailRow] = useState<PaymentTableRow | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const onRecordsMetaRef = useRef(onRecordsMeta);
  onRecordsMetaRef.current = onRecordsMeta;

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
  }, [hospitalId, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [hospitalId]);

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
      <div className="flex flex-col overflow-x-auto -mx-0 min-h-[200px]">
        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        )}
        {!loading && error && <ListError message={error} />}
        {!loading && !error && (
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
                  Payment date
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
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-[20px] py-12 text-center font-title-4r text-x-70"
                  >
                    No payments found for this hospital.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
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
                    <TableCell className="px-[20px] py-[16px] font-title-4l text-black">
                      {row.paymentDateLabel}
                    </TableCell>
                    <TableCell className="px-[20px] py-[16px]">
                      <Badge
                        className={`rounded-[100px] px-2.5 py-[5px] font-title-4r ${statusBadgeClass(row.status)}`}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-[20px] py-[16px]">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-grey-light"
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
                          <DropdownMenuItem
                            onClick={() =>
                              showWarning(
                                "Download receipt",
                                "Receipt download is not available for this payment yet.",
                              )
                            }
                          >
                            Download receipt
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
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
