import type { PublicTelecallerPayload } from "../types/telecaller.type";

/** Used when the public tele-caller payload has no hospital or no `teleCallerPrice`. */
export const TELECALLER_BOOKING_FALLBACK_INR = 400;

/**
 * INR amount charged on the public `/telecaller/:patientId` Razorpay checkout.
 * Prefer `hospital.teleCallerPrice` from GET `/api/tele-caller/patients/:id`.
 */
export function resolveTelecallerBookingAmountInr(
  payload: PublicTelecallerPayload | null | undefined,
): number {
  const p = payload?.hospital?.teleCallerPrice;
  if (typeof p === "number" && Number.isFinite(p) && p >= 0) {
    return Math.round(p);
  }
  return TELECALLER_BOOKING_FALLBACK_INR;
}
