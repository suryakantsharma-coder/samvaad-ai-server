import { Badge } from "../ui/badge";
import { formatTime12h } from "../../lib/dateTimeDisplay";
import type { PaymentTableRow } from "../../types/payment.type";

export function statusBadgeClass(status: string): string {
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
export function displayPaymentStatus(status: string): string {
  const s = status.toLowerCase().trim();
  if (s === "paid" || s === "captured") return "Paid";
  if (s === "created" || s === "draft") return "Draft";
  return status;
}

export function displayPriceLabel(priceLabel: string): string {
  const price = priceLabel.replace("₹", "");
  const priceWithoutComma = price.replace(/\s*,\s*/g, "");
  const priceNumber = parseInt(priceWithoutComma) / 100;
  const priceString = priceNumber.toString();
  return priceString && priceString.length > 0 ? priceString : "—";
}

export function PayoutInstantCell({
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

export function TransactionPaidCell({ row }: { row: PaymentTableRow }): JSX.Element {
  if (row.paymentAtMs != null && !Number.isNaN(row.paymentAtMs)) {
    return <PayoutInstantCell atMs={row.paymentAtMs} />;
  }
  return (
    <div className="px-[20px] py-[16px] font-title-4l text-black">
      {row.paymentDateLabel}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }): JSX.Element {
  return (
    <Badge
      className={`rounded-[100px] px-2.5 py-[5px] font-title-4r ${statusBadgeClass(status)}`}
    >
      {displayPaymentStatus(status)}
    </Badge>
  );
}
