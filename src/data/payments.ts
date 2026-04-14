import { authFetch } from "./api";
import type { PaymentTableRow, PaymentsListMeta } from "../types/payment.type";

type Dict = Record<string, unknown>;

function asDict(v: unknown): Dict | null {
  return v != null && typeof v === "object" && !Array.isArray(v)
    ? (v as Dict)
    : null;
}

function getStr(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function formatInrAmount(n: number): string {
  return `\u20B9${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function parsePrice(raw: unknown): string {
  if (raw == null) return "—";
  if (typeof raw === "string" && raw.trim()) {
    const s = raw.trim();
    return s.startsWith("\u20B9") || s.startsWith("Rs.") ? s : `\u20B9${s}`;
  }
  if (typeof raw === "number" && !Number.isNaN(raw)) {
    return formatInrAmount(raw);
  }
  return "—";
}

function parsePaymentAtMs(raw: unknown): number | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? undefined : d.getTime();
  }
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d.getTime();
}

function formatPaymentDate(raw: unknown): string {
  if (raw == null) return "—";
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return "—";
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return s;
}

function isLikelyMongoId(s: string): boolean {
  return /^[a-f\d]{24}$/i.test(s);
}

/** `GET /api/payouts` items: hospital period summaries (not individual Razorpay lines). */
function isPayoutListSummaryItem(r: Dict): boolean {
  const patient = asDict(r.patient);
  const hasPatientLine =
    Boolean(getStr(r.patientName)) ||
    Boolean(getStr(patient?.fullName) || getStr(patient?.name));
  return Boolean(
    getStr(r.hospitalId) &&
      (r.startDate != null || r.endDate != null) &&
      typeof r.totalPrice !== "undefined" &&
      !hasPatientLine,
  );
}

function normalizeRow(raw: unknown, index: number): PaymentTableRow {
  const r = asDict(raw) ?? {};

  if (isPayoutListSummaryItem(r)) {
    const idRaw = getStr(r._id);
    const id =
      idRaw && isLikelyMongoId(idRaw) ? idRaw : String(r._id ?? `row-${index}`);
    const startMs = parsePaymentAtMs(r.startDate);
    const endMs = parsePaymentAtMs(r.endDate);
    return {
      id,
      rowKind: "payout",
      hospitalId: getStr(r.hospitalId),
      patientName: "—",
      doctorName: "—",
      hospitalName: getStr(r.hospitalName) ?? "—",
      appointmentTimeLabel: "—",
      priceLabel: parsePrice(r.totalPrice),
      paymentDateLabel: formatPaymentDate(
        r.createdAt ?? r.createdDate ?? r.updatedAt,
      ),
      paymentAtMs:
        parsePaymentAtMs(r.createdAt) ??
        parsePaymentAtMs(r.createdDate) ??
        parsePaymentAtMs(r.updatedAt),
      status:
        getStr(r.status) ??
        getStr(r.razorpayStatus) ??
        getStr(r.paymentStatus) ??
        "—",
      payoutStartAtMs: startMs,
      payoutEndAtMs: endMs,
    };
  }

  const patient = asDict(r.patient);
  const doctor = asDict(r.doctor);
  const hospital = asDict(r.hospital);
  const appointment = asDict(r.appointment);
  const notes = asDict(r.notes);

  const mongoId =
    getStr(r._id) && isLikelyMongoId(getStr(r._id)!) ?
      getStr(r._id)
    : getStr(r._id);
  const legacyId = String(
    r._id ??
      r.id ??
      r.paymentId ??
      r.razorpayPaymentId ??
      r.razorpay_payment_id ??
      `row-${index}`,
  );

  const transactionMongoId =
    mongoId && isLikelyMongoId(mongoId) ? mongoId : undefined;

  const id = transactionMongoId ?? legacyId;

  const patientName =
    getStr(r.patientName) ??
    getStr(r.patientFullName) ??
    getStr(patient?.fullName) ??
    getStr(patient?.name) ??
    "—";

  const patientPhone =
    getStr(r.patientPhone) ??
    getStr(patient?.phoneNumber) ??
    getStr(patient?.phone);

  const patientEmail = getStr(r.patientEmail) ?? getStr(patient?.email);

  const doctorName =
    getStr(r.doctorName) ??
    getStr(r.doctorFullName) ??
    getStr(doctor?.fullName) ??
    getStr(doctor?.name) ??
    "—";

  const doctorEmail =
    getStr(r.doctorEmail) ??
    getStr(doctor?.email) ??
    getStr(asDict(doctor?.user)?.email);

  const hospitalName =
    getStr(r.hospitalName) ?? getStr(hospital?.name) ?? "—";

  const appointmentRaw =
    r.appointmentDateTime ??
    r.appointmentTime ??
    r.scheduledAt ??
    r.bookingSlot ??
    appointment?.appointmentDateTime ??
    appointment?.scheduledAt ??
    appointment?.date ??
    appointment?.startTime ??
    notes?.appointmentDateTime;
  const appointmentTimeLabel = formatPaymentDate(appointmentRaw);

  const priceLabel = parsePrice(
    r.price ?? r.amount ?? r.total ?? r.amountPaid ?? r.paidAmount,
  );

  const paymentDateLabel = formatPaymentDate(
    r.paymentDate ?? r.paidAt ?? r.createdAt ?? r.updatedAt ?? r.date,
  );

  const paymentAtMs =
    parsePaymentAtMs(r.paymentDate) ??
    parsePaymentAtMs(r.paidAt) ??
    parsePaymentAtMs(r.createdAt) ??
    parsePaymentAtMs(r.updatedAt) ??
    parsePaymentAtMs(r.date);

  const status =
    getStr(r.razorpayStatus) ??
    getStr(r.status) ??
    getStr(r.paymentStatus) ??
    getStr(r.state) ??
    "—";

  const patientId =
    getStr(r.patientId) ?? getStr(patient?._id) ?? getStr(patient?.id);

  const razorpayOrderId =
    getStr(r.razorpayOrderId) ??
    getStr(r.razorpay_order_id) ??
    getStr(r.orderId);

  return {
    id,
    rowKind: "transaction",
    transactionMongoId,
    patientId,
    patientName,
    patientPhone,
    patientEmail,
    doctorName,
    doctorEmail,
    hospitalName,
    appointmentTimeLabel,
    priceLabel,
    paymentDateLabel,
    paymentAtMs,
    status,
    razorpayOrderId,
  };
}

function extractListAndMeta(
  raw: unknown,
  fallbackPage: number,
  fallbackLimit: number,
): { rows: PaymentTableRow[]; meta: PaymentsListMeta } {
  const root = asDict(raw) ?? {};
  const dataNode = asDict(root.data) ?? root;

  let list: unknown[] = [];
  if (Array.isArray(dataNode)) {
    list = dataNode;
  } else if (Array.isArray(dataNode.transactions)) {
    list = dataNode.transactions;
  } else if (Array.isArray(dataNode.payouts)) {
    list = dataNode.payouts;
  } else if (Array.isArray(dataNode.payments)) {
    list = dataNode.payments;
  } else if (Array.isArray(dataNode.items)) {
    list = dataNode.items;
  } else if (Array.isArray(dataNode.records)) {
    list = dataNode.records;
  } else if (Array.isArray(dataNode.data)) {
    list = dataNode.data;
  }

  const rows = list.map((item, i) => normalizeRow(item, i));

  const pagination = asDict(dataNode.pagination) ?? {};
  const totalRaw = Number(
    pagination.total ?? dataNode.total ?? dataNode.totalCount,
  );
  const total = Number.isFinite(totalRaw) ? totalRaw : rows.length;
  const page = Number(pagination.page ?? dataNode.page ?? fallbackPage) || 1;
  const limit =
    Number(pagination.limit ?? dataNode.limit ?? fallbackLimit) ||
    fallbackLimit;
  const totalPagesRaw = Number(
    pagination.totalPages ?? dataNode.totalPages,
  );
  const totalPages =
    Number.isFinite(totalPagesRaw) && totalPagesRaw > 0 ?
      totalPagesRaw
    : Math.max(1, Math.ceil(total / limit) || 1);

  const overallBlock = asDict(dataNode.overall);
  let totalDoctors: number | undefined;
  if (overallBlock) {
    const n = Number(overallBlock.totalDoctors);
    if (Number.isFinite(n)) totalDoctors = n;
  }

  return {
    rows,
    meta: {
      total: Number.isFinite(total) ? total : rows.length,
      page,
      limit,
      totalPages,
      totalDoctors,
    },
  };
}

function assertPaymentsOk(raw: unknown): void {
  const root = asDict(raw);
  if (root && root.success === false) {
    throw new Error(
      getStr(root.message) ??
        getStr(root.error) ??
        "Request failed.",
    );
  }
}

/**
 * GET /api/payouts — list payout period summaries (scoped by auth; no hospitalId in query).
 * @param status API filter: `all`, `paid`, `draft`, etc.
 */
export async function fetchPayoutsPage(params: {
  page: number;
  limit: number;
  status: string;
  fromDate?: string;
  toDate?: string;
}): Promise<{ rows: PaymentTableRow[]; meta: PaymentsListMeta }> {
  const qs = new URLSearchParams({
    status: params.status.trim() || "all",
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.fromDate?.trim()) qs.set("fromDate", params.fromDate.trim());
  if (params.toDate?.trim()) qs.set("toDate", params.toDate.trim());
  const raw = await authFetch(`/api/payouts?${qs.toString()}`, {
    method: "GET",
  });
  assertPaymentsOk(raw);
  return extractListAndMeta(raw, params.page, params.limit);
}

/**
 * GET /api/payouts/transactions/search
 */
export async function fetchPayoutsSearch(params: {
  q: string;
  hospitalId: string;
  page: number;
  limit: number;
  fromDate?: string;
  toDate?: string;
  razorpayStatus?: string;
}): Promise<{ rows: PaymentTableRow[]; meta: PaymentsListMeta }> {
  const qs = new URLSearchParams({
    q: params.q.trim(),
    hospitalId: params.hospitalId.trim(),
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.fromDate?.trim()) qs.set("fromDate", params.fromDate.trim());
  if (params.toDate?.trim()) qs.set("toDate", params.toDate.trim());
  const rs = params.razorpayStatus?.trim();
  if (rs) qs.set("razorpayStatus", rs);
  const raw = await authFetch(
    `/api/payouts/transactions/search?${qs.toString()}`,
    { method: "GET" },
  );
  assertPaymentsOk(raw);
  return extractListAndMeta(raw, params.page, params.limit);
}

/**
 * PATCH /api/payouts/transactions/:transactionMongoId/status
 */
export async function patchPayoutTransactionRazorpayStatus(
  transactionMongoId: string,
  razorpayStatus: string,
): Promise<void> {
  const id = transactionMongoId.trim();
  if (!id) throw new Error("Missing transaction id.");
  const raw = await authFetch(
    `/api/payouts/transactions/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razorpayStatus }),
    },
  );
  assertPaymentsOk(raw);
}

/**
 * PATCH /api/payouts/:payoutMongoId/status — mark a payout period summary as paid (super admin).
 * Adjust path/body if your API differs.
 */
export async function patchPayoutSummaryStatus(
  payoutMongoId: string,
  status: string,
): Promise<void> {
  const id = payoutMongoId.trim();
  if (!id) throw new Error("Missing payout id.");
  const raw = await authFetch(
    `/api/payouts/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  assertPaymentsOk(raw);
}

/** @deprecated Use fetchPayoutsPage */
export async function fetchPaymentsPage(params: {
  hospitalId: string;
  page: number;
  limit: number;
  filter?: "all" | "today" | "tomorrow";
  fromDate?: string;
  toDate?: string;
  paymentStatus?: string;
}): Promise<{ rows: PaymentTableRow[]; meta: PaymentsListMeta }> {
  const ps = params.paymentStatus?.trim();
  const status =
    ps === "captured" || ps === "paid" ? "paid"
    : ps === "created" || ps === "draft" ? "draft"
    : "all";
  return fetchPayoutsPage({
    page: params.page,
    limit: params.limit,
    status,
    fromDate: params.fromDate,
    toDate: params.toDate,
  });
}

/** @deprecated Use fetchPayoutsSearch */
export async function fetchPaymentsSearch(params: {
  hospitalId: string;
  q: string;
  page: number;
  limit: number;
  paymentStatus?: string;
}): Promise<{ rows: PaymentTableRow[]; meta: PaymentsListMeta }> {
  return fetchPayoutsSearch({
    q: params.q,
    hospitalId: params.hospitalId,
    page: params.page,
    limit: params.limit,
    razorpayStatus: params.paymentStatus,
  });
}
