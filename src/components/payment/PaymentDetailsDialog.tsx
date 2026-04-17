import type { ReactNode } from "react";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { formatTime12h } from "../../lib/dateTimeDisplay";
import type { PaymentTableRow } from "../../types/payment.type";
import {
  displayPaymentStatus,
  displayPriceLabel,
  statusBadgeClass,
} from "./paymentRowDisplay";

function dash(v: string | undefined): string {
  const t = v?.trim();
  return t && t.length > 0 ? t : "—";
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

export function PaymentDetailsDialog({
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
