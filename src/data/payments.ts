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
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function parsePrice(raw: unknown): string {
  if (raw == null) return "—";
  if (typeof raw === "string" && raw.trim()) {
    const s = raw.trim();
    return s.startsWith("₹") ? s : `₹${s}`;
  }
  if (typeof raw === "number" && !Number.isNaN(raw)) {
    return formatInrAmount(raw);
  }
  return "—";
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

function normalizeRow(raw: unknown, index: number): PaymentTableRow {
  const r = asDict(raw) ?? {};
  const patient = asDict(r.patient);
  const doctor = asDict(r.doctor);
  const hospital = asDict(r.hospital);
  const appointment = asDict(r.appointment);
  const notes = asDict(r.notes);

  const id = String(
    r._id ??
      r.id ??
      r.paymentId ??
      r.razorpayPaymentId ??
      r.razorpay_payment_id ??
      `row-${index}`,
  );
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
    getStr(r.hospitalName) ??
    getStr(hospital?.name) ??
    "—";

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

  const status =
    getStr(r.status) ??
    getStr(r.paymentStatus) ??
    getStr(r.state) ??
    "—";

  const patientId =
    getStr(r.patientId) ??
    getStr(patient?._id) ??
    getStr(patient?.id);

  const razorpayOrderId =
    getStr(r.razorpayOrderId) ??
    getStr(r.razorpay_order_id) ??
    getStr(r.orderId);

  return {
    id,
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

  return {
    rows,
    meta: {
      total: Number.isFinite(total) ? total : rows.length,
      page,
      limit,
      totalPages,
    },
  };
}

export async function fetchPaymentsPage(params: {
  hospitalId: string;
  page: number;
  limit: number;
}): Promise<{ rows: PaymentTableRow[]; meta: PaymentsListMeta }> {
  const qs = new URLSearchParams({
    hospitalId: params.hospitalId,
    page: String(params.page),
    limit: String(params.limit),
  });
  const raw = await authFetch(`/api/payments?${qs.toString()}`, {
    method: "GET",
  });
  const root = asDict(raw);
  if (root && root.success === false) {
    throw new Error(
      getStr(root.message) ??
        getStr(root.error) ??
        "Failed to load payments.",
    );
  }
  return extractListAndMeta(raw, params.page, params.limit);
}
