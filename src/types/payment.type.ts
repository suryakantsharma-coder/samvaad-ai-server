/** List item from `GET /api/payouts` (hospital payout period) vs transaction row from search. */
export type PaymentRowKind = "payout" | "transaction";

/** Normalized row for the Payments / Payouts table UI. */
export type PaymentTableRow = {
  /** Primary key for React lists — prefers Mongo `_id`. */
  id: string;
  /** `GET /api/payouts` summary rows; omit for Razorpay transaction lines. */
  rowKind?: PaymentRowKind;
  /** From payout list item when present. */
  hospitalId?: string;
  /** Payout billing window (`startDate` / `endDate` from API). */
  payoutStartAtMs?: number;
  payoutEndAtMs?: number;
  /** Mongo id for `PATCH /api/payouts/transactions/:id/status`. */
  transactionMongoId?: string;
  /** When present, "View patient" can open the patient record. */
  patientId?: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  doctorName: string;
  doctorEmail?: string;
  /** Shown in the details modal; may be "—" if the API omits it. */
  hospitalName: string;
  /** Scheduled appointment slot when provided by the API. */
  appointmentTimeLabel: string;
  priceLabel: string;
  paymentDateLabel: string;
  /** Local-time instant for sorting (ms since epoch). */
  paymentAtMs?: number;
  /** Raw Razorpay-style status e.g. `captured`, `created`. */
  status: string;
  razorpayOrderId?: string;
};

export type PaymentsListMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  /** From `data.overall.totalDoctors` when the API includes it. */
  totalDoctors?: number;
};
