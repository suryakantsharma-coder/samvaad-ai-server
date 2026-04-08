import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, PhoneCall, Building2, User, ShieldCheck } from "lucide-react";
import { Button } from "../../components/ui/button";
import { fetchPublicTelecallerDetails } from "../../data/publicTelecaller";
import { API_BASE_URL } from "../../config";
import { authFetch } from "../../data/api";
import type { PublicTelecallerPayload } from "../../types/telecaller.type";

const TELECALLER_AMOUNT_INR = 400;

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
          }))
          .filter((x) => x._id && x.fullName);
        setDoctors(mapped);
      })
      .catch(() => undefined);
  }, [doctors.length]);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d._id === selectedDoctorId),
    [doctors, selectedDoctorId],
  );
  const availableTimes = useMemo(
    () => buildTimeSlotsFromAvailability(selectedDoctor?.availability),
    [selectedDoctor?.availability],
  );

  const amountLabel = useMemo(() => `₹${TELECALLER_AMOUNT_INR}`, []);

  const handlePay = async () => {
    const id = patientId?.trim();
    if (!id || !details) return;
    if (!selectedDoctorId || !selectedDate || !selectedTime) {
      setError("Please select doctor, date and time before payment.");
      return;
    }
    if (!visitReason.trim()) {
      setError("Please enter reason for visit before payment.");
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
        TELECALLER_AMOUNT_INR,
        {
          bookVideoAppointment: true,
          patient: details.patient._id,
          doctor: selectedDoctorId,
          reason: visitReason.trim(),
          appointmentDateTime: toIstDateTime(selectedDate, selectedTime),
          hospitalId: details.hospitalId ?? details.hospital?._id ?? "",
          videoUrl: details.appointmentId
            ? makeMeetUrl(details.appointmentId)
            : "",
        },
      );
      const resolvedKey =
        keyId ||
        import.meta.env.VITE_RAZORPAY_KEY_ID ||
        "rzp_test_1DP5mmOlF5G5ag";
      const amountPaise = order?.amount ?? TELECALLER_AMOUNT_INR * 100;
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
        },
        notes: {
          patientId: details.patient._id,
          patientName: details.patient.fullName,
          bookingType: "telecaller",
        },
        theme: { color: "#0ea5e9" },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
        handler: async (response: RazorpaySuccess) => {
          console.log("Razorpay payment response:", response);
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
            "Payment successful. Our telecaller will contact you shortly.",
          );
          setPaying(false);
        },
      };

      const rz = new window.Razorpay(options);
      rz.open();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Payment initialization failed.",
      );
      setPaying(false);
    }
  };

  return (
    <div className="bg-app-background w-full min-h-screen flex flex-col gap-6 p-4 md:p-6 text-black">
      <div className="max-w-2xl w-full mx-auto">
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
                  htmlFor="visit-reason"
                  className="font-title-4m text-x-70 text-sm"
                >
                  Disease / Reason for visit
                </label>
                <textarea
                  id="visit-reason"
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  placeholder="Type symptoms or reason for consultation..."
                  rows={3}
                  className="w-full rounded-[8px] border border-[#dedee1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-2/20"
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
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => {
                        setSelectedDoctorId(e.target.value);
                        setSelectedTime("");
                      }}
                      className="h-10 min-w-[180px] rounded-[8px] border border-[#dedee1] px-3 text-sm bg-white"
                    >
                      <option value="">Select doctor</option>
                      {doctors.map((doc) => (
                        <option key={doc._id} value={doc._id}>
                          {doc.fullName}
                          {doc.designation ? ` (${doc.designation})` : ""}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="h-10 rounded-[8px] border border-[#dedee1] px-3 text-sm"
                    />
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      disabled={!selectedDoctorId}
                      className="h-10 min-w-[130px] rounded-[8px] border border-[#dedee1] px-3 text-sm bg-white disabled:opacity-60"
                    >
                      <option value="">
                        {selectedDoctorId ? "Select time" : "Pick doctor first"}
                      </option>
                      {availableTimes.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
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
                      !visitReason.trim()
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

              {successMessage && (
                <div className="rounded-[10px] border border-[#86efac] bg-[#f0fdf4] p-3 text-sm text-[#166534] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
