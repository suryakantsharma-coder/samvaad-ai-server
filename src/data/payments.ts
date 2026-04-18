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

  const dateRangeBlock = asDict(dataNode.dateRange);
  let totalAmountPaise: number | undefined;
  if (dateRangeBlock) {
    const paise = Number(dateRangeBlock.totalAmountPaise);
    if (Number.isFinite(paise)) totalAmountPaise = paise;
  }
  if (totalAmountPaise === undefined && overallBlock) {
    const paise = Number(overallBlock.totalAmountPaise);
    if (Number.isFinite(paise)) totalAmountPaise = paise;
  }

  return {
    rows,
    meta: {
      total: Number.isFinite(total) ? total : rows.length,
      page,
      limit,
      totalPages,
      totalDoctors,
      totalAmountPaise,
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
 * GET /api/payouts — list payout period summaries (scoped by auth).
 * @param filter API query: `all`, `paid`, `draft`, etc.
 * @param sort `newest` | `oldest` when supported by the API.
 */
export async function fetchPayoutsPage(params: {
  page: number;
  limit: number;
  filter: "all" | "paid" | "draft";
  fromDate?: string;
  toDate?: string;
  sort?: "newest" | "oldest";
}): Promise<{ rows: PaymentTableRow[]; meta: PaymentsListMeta }> {
  const filter =
    params.filter === "paid" || params.filter === "draft" ? params.filter
    : "all";
  const qs = new URLSearchParams({
    filter,
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.fromDate?.trim()) qs.set("fromDate", params.fromDate.trim());
  if (params.toDate?.trim()) qs.set("toDate", params.toDate.trim());
  const sort = params.sort?.trim();
  if (sort === "newest" || sort === "oldest") qs.set("sort", sort);
  const raw = await authFetch(`/api/payouts?${qs.toString()}`, {
    method: "GET",
  });
  assertPaymentsOk(raw);
  return extractListAndMeta(raw, params.page, params.limit);
}

/**
 * GET /api/payments — hospital-scoped payment list (`filter`: all | paid | draft, …).
 */
export async function fetchHospitalPaymentsList(params: {
  hospitalId: string;
  page: number;
  limit: number;
  /** Sent as `filter` query (e.g. all, paid, draft). */
  filter: "all" | "paid" | "draft";
  fromDate?: string;
  toDate?: string;
  /** GET /api/payments `sort` (e.g. newest, oldest). */
  sort?: "newest" | "oldest";
}): Promise<{ rows: PaymentTableRow[]; meta: PaymentsListMeta }> {
  const hid = params.hospitalId.trim();
  if (!hid) throw new Error("Missing hospital id.");
  const filter =
    params.filter === "paid" || params.filter === "draft" ? params.filter
    : "all";
  const qs = new URLSearchParams({
    hospitalId: hid,
    filter,
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.fromDate?.trim()) qs.set("fromDate", params.fromDate.trim());
  if (params.toDate?.trim()) qs.set("toDate", params.toDate.trim());
  const sort = params.sort?.trim();
  if (sort === "newest" || sort === "oldest") qs.set("sort", sort);
  const raw = await authFetch(`/api/payments?${qs.toString()}`, {
    method: "GET",
  });
  assertPaymentsOk(raw);
  return extractListAndMeta(raw, params.page, params.limit);
}

/**
 * GET /api/payments/search — hospital-scoped search (`paymentStatus`: e.g. captured, created).
 */
export async function fetchHospitalPaymentsSearch(params: {
  hospitalId: string;
  q: string;
  page: number;
  limit: number;
  paymentStatus?: string;
  fromDate?: string;
  toDate?: string;
  sort?: "newest" | "oldest";
}): Promise<{ rows: PaymentTableRow[]; meta: PaymentsListMeta }> {
  const hid = params.hospitalId.trim();
  if (!hid) throw new Error("Missing hospital id.");
  const q = params.q.trim();
  if (!q) throw new Error("Missing search query.");
  const qs = new URLSearchParams({
    hospitalId: hid,
    q,
    page: String(params.page),
    limit: String(params.limit),
  });
  const ps = params.paymentStatus?.trim();
  if (ps) qs.set("paymentStatus", ps);
  if (params.fromDate?.trim()) qs.set("fromDate", params.fromDate.trim());
  if (params.toDate?.trim()) qs.set("toDate", params.toDate.trim());
  const sort = params.sort?.trim();
  if (sort === "newest" || sort === "oldest") qs.set("sort", sort);
  const raw = await authFetch(`/api/payments/search?${qs.toString()}`, {
    method: "GET",
  });
  assertPaymentsOk(raw);
  return extractListAndMeta(raw, params.page, params.limit);
}

/**
 * GET /api/payouts/search — super-admin payout search (`filter`: all | paid | draft, …).
 * `hospitalId` optional when the API allows narrowing by hospital.
 */
export async function fetchPayoutsSearch(params: {
  q: string;
  page: number;
  limit: number;
  filter: "all" | "paid" | "draft";
  sort?: "newest" | "oldest";
  fromDate?: string;
  toDate?: string;
  hospitalId?: string;
}): Promise<{ rows: PaymentTableRow[]; meta: PaymentsListMeta }> {
  const q = params.q.trim();
  if (!q) throw new Error("Missing search query.");
  const filter =
    params.filter === "paid" || params.filter === "draft" ? params.filter
    : "all";
  const qs = new URLSearchParams({
    q,
    filter,
    page: String(params.page),
    limit: String(params.limit),
  });
  const sort = params.sort?.trim();
  if (sort === "newest" || sort === "oldest") qs.set("sort", sort);
  const hid = params.hospitalId?.trim();
  if (hid) qs.set("hospitalId", hid);
  if (params.fromDate?.trim()) qs.set("fromDate", params.fromDate.trim());
  if (params.toDate?.trim()) qs.set("toDate", params.toDate.trim());
  const raw = await authFetch(`/api/payouts/search?${qs.toString()}`, {
    method: "GET",
  });
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
 * PATCH /api/payouts/list/:payoutListMongoId/status — update payout list row status (e.g. `paid`).
 * Server expects a super-admin Bearer token.
 */
export async function patchPayoutSummaryStatus(
  payoutListMongoId: string,
  status: string,
): Promise<void> {
  const id = payoutListMongoId.trim();
  if (!id) throw new Error("Missing payout list id.");
  const raw = await authFetch(
    `/api/payouts/list/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  assertPaymentsOk(raw);
}

/** @deprecated Prefer {@link fetchHospitalPaymentsList} */
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
  const listFilter: "all" | "paid" | "draft" =
    ps === "captured" || ps === "paid" ? "paid"
    : ps === "created" || ps === "draft" ? "draft"
    : params.filter === "today" || params.filter === "tomorrow" ? "all"
    : (params.filter ?? "all");
  return fetchHospitalPaymentsList({
    hospitalId: params.hospitalId,
    page: params.page,
    limit: params.limit,
    filter: listFilter,
    fromDate: params.fromDate,
    toDate: params.toDate,
  });
}

/** @deprecated Prefer {@link fetchHospitalPaymentsSearch} */
export async function fetchPaymentsSearch(params: {
  hospitalId: string;
  q: string;
  page: number;
  limit: number;
  paymentStatus?: string;
}): Promise<{ rows: PaymentTableRow[]; meta: PaymentsListMeta }> {
  return fetchHospitalPaymentsSearch({
    q: params.q,
    hospitalId: params.hospitalId,
    page: params.page,
    limit: params.limit,
    paymentStatus: params.paymentStatus,
  });
}
