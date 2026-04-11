/** Normalized row for the Payments table UI. */
export type PaymentTableRow = {
  id: string;
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
  /** Local-time instant for All / Today / Tomorrow filters (ms since epoch). */
  paymentAtMs?: number;
  status: string;
  razorpayOrderId?: string;
};

export type PaymentsListMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
