import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ChevronDown,
  Loader2,
  PhoneCall,
  Building2,
  User,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  extractDoctorEmail,
  fetchPublicTelecallerDetails,
} from "../../data/publicTelecaller";
import { API_BASE_URL } from "../../config";
import { authFetch } from "../../data/api";
import type { PublicTelecallerPayload } from "../../types/telecaller.type";
import { resolveTelecallerBookingAmountInr } from "../../lib/telecallerPricing";
import { PublicBrandHeader } from "../../components/layout/PublicBrandHeader";

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
};

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

type DoctorLite = {
  _id: string;
  fullName: string;
  designation?: string;
  availability?: string;
  email?: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

function displayHospitalAddress(
  hospital?: PublicTelecallerPayload["hospital"],
): string {
  if (!hospital) return "—";
  const cityPin = [hospital.city, hospital.pincode].filter(Boolean).join(" ");
  return [hospital.address, cityPin].filter(Boolean).join(", ") || "—";
}

function buildTimeSlotsFromAvailability(availability?: string): string[] {
  if (!availability) {
    return ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
  }
  const parts = availability.split("-").map((p) => p.trim());
  if (parts.length !== 2)
    return ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];

  const parse = (raw: string): number | null => {
    const m = raw.match(/^(\d{1,2})(?::(\d{2}))?$/);
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2] ?? "0");
    if (
      Number.isNaN(hh) ||
      Number.isNaN(mm) ||
      hh < 0 ||
      hh > 23 ||
      mm < 0 ||
      mm > 59
    ) {
      return null;
    }
    return hh * 60 + mm;
  };
  const start = parse(parts[0]);
  const end = parse(parts[1]);
  if (start == null || end == null || end <= start) {
    return ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
  }
  const slots: string[] = [];
  for (let t = start; t <= end; t += 30) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return slots;
}

/** Send appointment datetime explicitly in IST offset. */
function toIstDateTime(date: string, time: string): string {
  return `${date}T${time}:00+05:30`;
}

/** Display "HH:MM" (24h) as "h:mm AM/PM" for the time select. */
function formatTimeHhMmTo12Hour(hhmm: string): string {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return hhmm;
  const h24 = Number(m[1]);
  const minutes = m[2];
  if (Number.isNaN(h24) || h24 < 0 || h24 > 23) return hhmm;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${minutes} ${period}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function ensureRazorpayLoaded(): Promise<boolean> {
  if (window.Razorpay) return true;
  const exists = document.querySelector('script[data-razorpay-sdk="true"]');
  if (!exists) {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpaySdk = "true";
    document.body.appendChild(script);
  }
  return new Promise((resolve) => {
    const maxWaitMs = 7000;
    const start = Date.now();
    const timer = window.setInterval(() => {
      if (window.Razorpay) {
        clearInterval(timer);
        resolve(true);
      } else if (Date.now() - start > maxWaitMs) {
        clearInterval(timer);
        resolve(false);
      }
    }, 120);
  });
}

function makeMeetUrl(appointmentId: string): string {
  void appointmentId;
  return "https://meet.google.com/abc-defg-hij";
}

async function patchAppointmentVideoUrl(appointmentId: string): Promise<void> {
  await authFetch(`/api/appointments/${encodeURIComponent(appointmentId)}`, {
    method: "PATCH",
    body: { videoUrl: makeMeetUrl(appointmentId) },
  });
}

async function patchAppointmentScheduleAndVideoUrl(
  appointmentId: string,
  appointmentDateTime: string,
): Promise<void> {
  await authFetch(`/api/appointments/${encodeURIComponent(appointmentId)}`, {
    method: "PATCH",
    body: {
      videoUrl: makeMeetUrl(appointmentId),
      appointmentDateTime,
    },
  });
}

async function saveTelecallerTransaction(input: {
  patientId: string;
  appointmentId: string;
  hospitalId: string;
  payment: RazorpaySuccess;
}): Promise<void> {
  await authFetch("/api/tele-caller/transactions", {
    method: "POST",
    body: {
      patientId: input.patientId,
      appointmentId: input.appointmentId,
      hospitalId: input.hospitalId,
      razorpay_payment_id: input.payment.razorpay_payment_id,
      razorpay_order_id: input.payment.razorpay_order_id ?? "",
      razorpay_signature: input.payment.razorpay_signature ?? "",
      consentAcknowledged: true,
      termsVersion: "2026-04-01",
    },
  });
}

async function verifyRazorpayPaymentWithBackend(
  payment: RazorpaySuccess,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/razorpay/verify-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payment),
  });
  if (!res.ok) {
    throw new Error("Payment verification failed.");
  }
}

async function createRazorpayOrder(
  patientId: string,
  amountInr: number,
  notes: Record<string, unknown>,
): Promise<{ order?: RazorpayOrder; keyId?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/razorpay/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        patientId,
        amount: amountInr * 100,
        currency: "INR",
        notes,
      }),
    });
    if (res.ok) {
      const raw = (await res.json().catch(() => null)) as
        | (RazorpayOrder & { key?: string; keyId?: string })
        | {
            success?: boolean;
            key?: string;
            keyId?: string;
            id?: string;
            amount?: number;
            currency?: string;
          }
        | null;
      const order = raw as RazorpayOrder | null;
      if (order?.id && order.amount && order.currency) {
        return {
          order,
          keyId:
            (raw as { key?: string; keyId?: string })?.keyId ??
            (raw as { key?: string })?.key,
        };
      }
      if (
        raw &&
        typeof raw === "object" &&
        "id" in raw &&
        "amount" in raw &&
        "currency" in raw
      ) {
        return { order: raw as RazorpayOrder };
      }
    }
  } catch {
    // Fallback to app-specific endpoint below.
  }
  try {
    const raw = (await authFetch("/api/tele-caller/transactions/order", {
      method: "POST",
      body: {
        patientId,
        amount: amountInr,
        currency: "INR",
      },
    })) as {
      data?: {
        order?: RazorpayOrder;
        keyId?: string;
      };
      order?: RazorpayOrder;
      keyId?: string;
    } | null;
    return {
      order: raw?.data?.order ?? raw?.order,
      keyId: raw?.data?.keyId ?? raw?.keyId,
    };
  } catch {
    return {};
  }
}

export const PublicTelecaller = (): JSX.Element => {
  const { patientId } = useParams<{ patientId: string }>();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [details, setDetails] = useState<PublicTelecallerPayload | null>(null);
  const [doctors, setDoctors] = useState<DoctorLite[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [visitReason, setVisitReason] = useState("");
  const [email, setEmail] = useState("");
  const [failureToast, setFailureToast] = useState<string | null>(null);

  useEffect(() => {
    const id = patientId?.trim();
    if (!id) {
      setLoading(false);
      setError("Invalid patient link.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPublicTelecallerDetails(id)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError("Unable to find patient details for booking.");
          setDetails(null);
          return;
        }
        setDetails(data);
        setDoctors(data.doctors ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to load booking details.");
          setDetails(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  useEffect(() => {
    setSelectedDoctorId("");
    setSelectedDate("");
    setSelectedTime("");
  }, [patientId]);

  useEffect(() => {
    // Fallback: load doctors from secured doctor list if tele-caller payload didn't include doctors.
    if (doctors.length > 0) return;
    if (!localStorage.getItem("token")) return;
    authFetch("/api/doctors?page=1&limit=100", { method: "GET" })
      .then((raw) => {
        const d = raw as { data?: { doctors?: unknown[] } };
        const list = Array.isArray(d?.data?.doctors) ? d.data?.doctors : [];
        const mapped = (list ?? [])
          .map((x) => x as Record<string, unknown>)
          .map((x) => ({
            _id: String(x._id ?? ""),
            fullName: String(x.fullName ?? ""),
            designation:
              typeof x.designation === "string" ? x.designation : undefined,
            availability:
              typeof x.availability === "string" ? x.availability : undefined,
            email: extractDoctorEmail(x),
          }))
          .filter((x) => x._id && x.fullName);
        setDoctors(mapped);
      })
      .catch(() => undefined);
  }, [doctors.length]);

  /**
   * Doctors from API, or a single synthetic row from last visit so public (logged-out) booking still works.
   * If the list has no per-doctor email, reuse `lastAppointment.doctorEmail` when the row is the same doctor
   * (otherwise Razorpay `notes.doctorEmail` stays empty).
   */
  const doctorsForUi = useMemo((): DoctorLite[] => {
    const la = details?.lastAppointment;
    const fallbackEmail = la?.doctorEmail?.trim();
    const lastId = la?.doctorId?.trim();
    const lastNameLower = la?.doctorName?.trim().toLowerCase();

    if (doctors.length > 0) {
      return doctors.map((d) => {
        const existing = d.email?.trim();
        if (existing) return d;
        const sameById = lastId && d._id === lastId;
        const sameByName =
          lastNameLower &&
          d.fullName.trim().toLowerCase() === lastNameLower;
        if ((sameById || sameByName) && fallbackEmail) {
          return { ...d, email: fallbackEmail };
        }
        return d;
      });
    }

    const id = lastId;
    const name = la?.doctorName?.trim();
    if (id && name) {
      return [
        {
          _id: id,
          fullName: name,
          email: fallbackEmail,
        },
      ];
    }
    return [];
  }, [
    doctors,
    details?.lastAppointment?.doctorId,
    details?.lastAppointment?.doctorName,
    details?.lastAppointment?.doctorEmail,
  ]);

  const selectedDoctor = useMemo(
    () => doctorsForUi.find((d) => d._id === selectedDoctorId),
    [doctorsForUi, selectedDoctorId],
  );

  useEffect(() => {
    if (!details) return;
    const reason = details.lastAppointment?.reason?.trim();
    if (reason) setVisitReason(reason);
  }, [details?.patient?._id]);

  useEffect(() => {
    if (selectedDoctorId && !doctorsForUi.some((d) => d._id === selectedDoctorId)) {
      setSelectedDoctorId("");
      setSelectedTime("");
    }
  }, [doctorsForUi, selectedDoctorId]);

  useEffect(() => {
    if (!details) return;
    if (!selectedDoctorId) {
      const lastDoctorId = details.lastAppointment?.doctorId?.trim();
      if (lastDoctorId) {
        const byId = doctorsForUi.find((d) => d._id === lastDoctorId);
        if (byId) {
          setSelectedDoctorId(byId._id);
          return;
        }
      }
      const lastDoctorName = details.lastAppointment?.doctorName?.trim();
      if (lastDoctorName) {
        const lowered = lastDoctorName.toLowerCase();
        const byName = doctorsForUi.find(
          (d) => d.fullName.toLowerCase() === lowered,
        );
        if (byName) {
          setSelectedDoctorId(byName._id);
          return;
        }
      }
      if (doctorsForUi.length > 0) {
        setSelectedDoctorId(doctorsForUi[0]._id);
      }
    }
  }, [details, doctorsForUi, selectedDoctorId]);

  const availableTimes = useMemo(
    () => buildTimeSlotsFromAvailability(selectedDoctor?.availability),
    [selectedDoctor?.availability],
  );

  useEffect(() => {
    if (!selectedTime) return;
    if (!availableTimes.includes(selectedTime)) {
      setSelectedTime("");
    }
  }, [availableTimes, selectedTime]);

  const telecallerAmountInr = useMemo(
    () => resolveTelecallerBookingAmountInr(details),
    [details],
  );
  const amountLabel = useMemo(
    () =>
      `₹${telecallerAmountInr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
    [telecallerAmountInr],
  );
  const normalizedEmail = email.trim().toLowerCase();
  const hasValidEmail = isValidEmail(normalizedEmail);

  useEffect(() => {
    if (!failureToast) return;
    const timer = window.setTimeout(() => setFailureToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [failureToast]);

  const handlePay = async () => {
    const id = patientId?.trim();
    if (!id || !details) return;
    if (!selectedDoctorId || !selectedDate || !selectedTime) {
      setError("Doctor, date and time are required before payment.");
      return;
    }
    if (!visitReason.trim()) {
      setError("Please enter reason for visit before payment.");
      return;
    }
    if (!normalizedEmail) {
      setError("Email ID is required before payment.");
      return;
    }
    if (!hasValidEmail) {
      setError("Please enter a valid email ID before payment.");
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setPaying(true);
    try {
      const sdkReady = await ensureRazorpayLoaded();
      if (!sdkReady || !window.Razorpay) {
        throw new Error("Razorpay SDK failed to load.");
      }

      const { order, keyId } = await createRazorpayOrder(
        id,
        telecallerAmountInr,
        {
          bookVideoAppointment: true,
          patient: details.patient._id,
          doctor: selectedDoctorId,
          reason: visitReason.trim(),
          patientEmail: normalizedEmail,
          doctorEmail: selectedDoctor?.email?.trim() ?? "",
          appointmentDateTime: toIstDateTime(selectedDate, selectedTime),
          hospitalId: details.hospitalId ?? details.hospital?._id ?? "",
          teleCallerPriceInr: telecallerAmountInr,
          videoUrl: details.appointmentId
            ? makeMeetUrl(details.appointmentId)
            : "",
        },
      );
      const resolvedKey =
        keyId ||
        import.meta.env.VITE_RAZORPAY_KEY_ID ||
        "rzp_test_1DP5mmOlF5G5ag";
      const amountPaise = order?.amount ?? telecallerAmountInr * 100;
      const currency = order?.currency ?? "INR";
      const displayName = details.hospital?.name || "Samvaad";

      const options: Record<string, unknown> = {
        key: resolvedKey,
        amount: amountPaise,
        currency,
        name: displayName,
        description: "Telecaller Appointment Booking",
        order_id: order?.id,
        prefill: {
          name: details.patient.fullName,
          contact: details.patient.phoneNumber,
          email: normalizedEmail,
        },
        notes: {
          patientId: details.patient._id,
          patientName: details.patient.fullName,
          patientEmail: normalizedEmail,
          doctorEmail: selectedDoctor?.email?.trim() ?? "",
          reason: visitReason.trim(),
          bookingType: "telecaller",
        },
        theme: { color: "#0ea5e9" },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
        handler: async (response: RazorpaySuccess) => {
          try {
            await verifyRazorpayPaymentWithBackend(response);
            const hasToken = !!localStorage.getItem("token");
            const appointmentId = details.appointmentId;
            const hospitalId = details.hospitalId ?? details.hospital?._id;
            const appointmentDateTime = toIstDateTime(selectedDate, selectedTime);

            // Post-payment workflow is best-effort for public links.
            if (hasToken && appointmentId) {
              await patchAppointmentScheduleAndVideoUrl(
                appointmentId,
                appointmentDateTime,
              ).catch(async () => {
                await patchAppointmentVideoUrl(appointmentId).catch(
                  () => undefined,
                );
              });
            }
            if (hasToken && appointmentId && hospitalId) {
              await saveTelecallerTransaction({
                patientId: id,
                appointmentId,
                hospitalId,
                payment: response,
              }).catch(() => undefined);
            }
            setSuccessMessage(
              "Payment completed. Our team will contact you shortly.",
            );
          } catch {
            setFailureToast("Payment failed. Please retry.");
          } finally {
            setPaying(false);
          }
        },
      };

      const rz = new window.Razorpay(options);
      rz.open();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Payment initialization failed.",
      );
      setFailureToast("Payment failed. Please retry.");
      setPaying(false);
    }
  };

  return (
    <div className="bg-app-background w-full min-h-screen flex flex-col text-black">
      <PublicBrandHeader />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="max-w-2xl w-full mx-auto">
        {successMessage ? (
          <div className="rounded-[12px] border border-[#86efac] bg-[#f0fdf4] p-8 md:p-10 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#dcfce7] text-[#166534] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-[30px] leading-[34px] font-medium [font-family:'Archivo',Helvetica] text-[#166534]">
              Payment Successful
            </h1>
            <p className="font-title-4r text-base text-[#166534]">
              {successMessage}
            </p>
          </div>
        ) : (
          <div className="rounded-[12px] border border-[#dedee1] bg-white p-6 md:p-8 space-y-5">
            <div className="space-y-1">
              <h1 className="text-[30px] leading-[34px] font-medium [font-family:'Archivo',Helvetica]">
                Telecaller Appointment
              </h1>
              <p className="font-title-4r text-x-70 text-sm">
                Confirm details and proceed with secure payment.
              </p>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-x-70 font-title-4r">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading details...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-[10px] border border-[#fecaca] bg-[#fff1f2] p-3 text-sm text-[#9f1239]">
                {error}
              </div>
            )}

            {!loading && details && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-[10px] border border-[#dedee1] p-3 space-y-1">
                    <p className="font-title-4m text-x-70 flex items-center gap-2">
                      <User className="w-4 h-4" /> Patient
                    </p>
                    <p className="font-title-4r text-black">
                      {details.patient.fullName}
                    </p>
                    <p className="font-title-5r text-x-70">
                      {details.patient.age ?? "—"} yrs •{" "}
                      {details.patient.gender ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-[10px] border border-[#dedee1] p-3 space-y-1">
                    <p className="font-title-4m text-x-70 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Hospital
                    </p>
                    <p className="font-title-4r text-black">
                      {details.hospital?.name ?? "—"}
                    </p>
                    <p className="font-title-5r text-x-70">
                      {displayHospitalAddress(details.hospital)}
                    </p>
                  </div>
                </div>

                <div className="rounded-[10px] border border-[#dedee1] p-4 space-y-2">
                  <label
                    htmlFor="patient-email"
                    className="font-title-4m text-x-70 text-sm"
                  >
                    Email ID <span className="text-[#dc2626]">*</span>
                  </label>
                  <input
                    id="patient-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email ID"
                    className="h-10 w-full rounded-[8px] border border-[#dedee1] px-3 text-sm bg-white"
                  />
                  <p className="font-title-5r text-[#b45309]">
                    This email is very crucial because it is required to join
                    the meeting.
                  </p>
                  {email.trim() && !hasValidEmail && (
                    <p className="font-title-5r text-[#dc2626]">
                      Please enter a valid email ID.
                    </p>
                  )}
                </div>

                <div className="rounded-[10px] border border-[#dedee1] p-4 space-y-2">
                  <label
                    htmlFor="visit-reason"
                    className="font-title-4m text-x-70 text-sm"
                  >
                    Disease / Reason for visit
                  </label>
                  <textarea
                    id="visit-reason"
                    value={visitReason}
                    onChange={(e) => setVisitReason(e.target.value)}
                    onBlur={() => {
                      if (!details) return;
                      if (visitReason.trim()) return;
                      const reason = details.lastAppointment?.reason?.trim();
                      if (reason) setVisitReason(reason);
                    }}
                    placeholder="Enter disease or reason for visit"
                    rows={3}
                    className="w-full rounded-[8px] border border-[#dedee1] px-3 py-2 text-sm bg-white text-black/90 resize-y"
                  />
                </div>

                <div className="rounded-[10px] border border-[#dedee1] p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-title-4m text-x-70 text-sm">
                      Booking Amount
                    </p>
                    <p className="text-[26px] leading-[30px] font-semibold">
                      {amountLabel}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="flex flex-col gap-1 min-w-[180px] max-w-[280px]">
                        <span className="font-title-4m text-x-70 text-xs leading-none">
                          Doctor
                        </span>
                        <div
                          className="min-h-10 flex items-center rounded-[8px] border border-[#dedee1] bg-[#f9fafb] px-3 py-2 text-sm text-black/90"
                          aria-live="polite"
                        >
                          {selectedDoctor ? (
                            <span className="font-title-4r line-clamp-2">
                              {selectedDoctor.fullName}
                              {selectedDoctor.designation
                                ? ` (${selectedDoctor.designation})`
                                : ""}
                            </span>
                          ) : doctorsForUi.length === 0 ? (
                            <span className="font-title-4r text-x-70">
                              No doctor available
                            </span>
                          ) : (
                            <span className="font-title-4r text-x-70">—</span>
                          )}
                        </div>
                      </div>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="h-10 rounded-[8px] border border-[#dedee1] px-3 text-sm"
                      />
                      <div className="relative min-w-[158px]">
                        <select
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          disabled={!selectedDoctorId}
                          className="h-10 w-full cursor-pointer appearance-none rounded-[8px] border border-[#c5c7ce] bg-white pl-3 pr-10 text-sm text-black/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="">
                            {selectedDoctorId
                              ? "Select time"
                              : "Pick doctor first"}
                          </option>
                          {availableTimes.map((slot) => (
                            <option key={slot} value={slot}>
                              {formatTimeHhMmTo12Hour(slot)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]"
                          aria-hidden
                        />
                      </div>
                      {/* Hidden input preserves native value semantics for potential browser autofill */}
                      <input
                        type="time"
                        value={selectedTime}
                        readOnly
                        className="hidden"
                      />
                    </div>
                    <Button
                      type="button"
                      className="inline-flex items-center gap-2 px-5 py-2.5 h-auto rounded-[10px] bg-primary-2 hover:bg-primary-2/90 text-white font-title-4r disabled:opacity-70"
                      onClick={handlePay}
                      disabled={
                        paying ||
                        !selectedDoctorId ||
                        !selectedDate ||
                        !selectedTime ||
                        !visitReason.trim() ||
                        !hasValidEmail
                      }
                    >
                      {paying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <PhoneCall className="w-4 h-4" />
                          Pay {amountLabel}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </div>
      {failureToast && (
        <div className="fixed right-4 top-4 z-50 rounded-[10px] border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#9f1239] shadow-md">
          {failureToast}
        </div>
      )}
    </div>
  );
};
