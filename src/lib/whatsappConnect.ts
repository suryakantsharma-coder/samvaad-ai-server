import { API_BASE_URL } from "../config";
import { showError, showSuccess } from "./toast";

const pending: {
  waba_id?: string;
  phone_number_id?: string;
  code?: string;
  hospitalId?: string;
} = {};

let embeddedListenerAttached = false;
let callbackInFlight = false;
/** Lets FB.login + FINISH postMessage land in one POST when both arrive close together. */
const TRY_SEND_DEBOUNCE_MS = 500;
let trySendTimer: ReturnType<typeof setTimeout> | null = null;

function clearPending() {
  if (trySendTimer) {
    clearTimeout(trySendTimer);
    trySendTimer = null;
  }
  delete pending.waba_id;
  delete pending.phone_number_id;
  delete pending.code;
  delete pending.hospitalId;
}

/** All four fields are required before calling POST /api/whatsapp/callback. */
function hasAllRequired(): boolean {
  const c = pending.code?.trim();
  const w = pending.waba_id?.trim();
  const p = pending.phone_number_id?.trim();
  const h = pending.hospitalId?.trim();
  return Boolean(c && w && p && h);
}

function buildCallbackBody(): {
  code: string;
  waba_id: string;
  phone_number_id: string;
  hospitalId: string;
} {
  return {
    code: pending.code!.trim(),
    waba_id: pending.waba_id!.trim(),
    phone_number_id: pending.phone_number_id!.trim(),
    hospitalId: pending.hospitalId!.trim(),
  };
}

function scheduleTrySend() {
  if (!hasAllRequired()) return;
  if (trySendTimer) clearTimeout(trySendTimer);
  trySendTimer = setTimeout(() => {
    trySendTimer = null;
    void executeTrySend();
  }, TRY_SEND_DEBOUNCE_MS);
}

async function executeTrySend() {
  if (!hasAllRequired()) return;
  if (callbackInFlight) return;
  callbackInFlight = true;
  try {
    const res = await fetch(`${API_BASE_URL}/api/whatsapp/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildCallbackBody()),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed (${res.status})`);
    }
    showSuccess("WhatsApp", "WhatsApp Business account connected.");
    clearPending();
    window.dispatchEvent(new CustomEvent("samvaad:whatsapp-creds-stored"));
  } catch (e) {
    showError(
      "WhatsApp",
      e instanceof Error
        ? e.message
        : "Could not complete WhatsApp connection.",
    );
  } finally {
    callbackInFlight = false;
  }
}

/**
 * Listen for Embedded Signup completion so `waba_id` and `phone_number_id`
 * are available to pair with the auth code from `FB.login`.
 */
export function ensureWhatsAppEmbeddedSignupListener(): void {
  if (embeddedListenerAttached || typeof window === "undefined") return;
  embeddedListenerAttached = true;
  window.addEventListener("message", (event) => {
    if (!event.origin.includes("facebook.com")) return;

    let data: unknown = event.data;

    if (typeof data === "string") {
      try {
        data = JSON.parse(data) as unknown;
      } catch {
        return;
      }
    }

    if (
      typeof data !== "object" ||
      data === null ||
      (data as { type?: string }).type !== "WA_EMBEDDED_SIGNUP"
    ) {
      return;
    }

    const msg = data as {
      event?: string;
      data?: { waba_id?: unknown; phone_number_id?: unknown };
    };

    if (msg.event === "FINISH" && msg.data) {
      pending.waba_id =
        msg.data.waba_id != null ? String(msg.data.waba_id) : undefined;
      pending.phone_number_id =
        msg.data.phone_number_id != null
          ? String(msg.data.phone_number_id)
          : undefined;
      console.log("[WhatsApp Embedded Signup] FINISH postMessage received", {
        origin: event.origin,
        waba_id: pending.waba_id,
        phone_number_id: pending.phone_number_id,
        rawData: msg.data,
        hospitalId: pending.hospitalId,
        code: pending.code,
      });
      scheduleTrySend();
    }
  });
}

export type ConnectWhatsAppResult =
  | { ok: true }
  | { ok: false; reason: "no_config" | "no_fb" | "no_hospital" };

/**
 * Starts Meta Embedded Signup for WhatsApp. Requires Facebook JS SDK and
 * `VITE_META_WHATSAPP_CONFIG_ID`. When the flow completes, posts to
 * `POST /api/whatsapp/callback` with **required** `code`, `waba_id`,
 * `phone_number_id`, and `hospitalId`.
 *
 * @param hospitalId Hospital id for the linked account (sent to your API). Required.
 */
export function connectWhatsAppEmbeddedSignup(
  hospitalId?: string,
): ConnectWhatsAppResult {
  ensureWhatsAppEmbeddedSignupListener();
  const hid = hospitalId?.trim();
  if (!hid) {
    return { ok: false, reason: "no_hospital" };
  }
  pending.hospitalId = hid;

  const configId = (import.meta.env.VITE_META_WHATSAPP_CONFIG_ID ?? "").trim();
  if (!configId) {
    return { ok: false, reason: "no_config" };
  }
  const fb = (
    window as Window & {
      FB?: {
        login: (
          cb: (r: {
            authResponse?: { code?: string };
            status?: string;
          }) => void,
          opts: Record<string, unknown>,
        ) => void;
      };
    }
  ).FB;
  if (!fb?.login) {
    return { ok: false, reason: "no_fb" };
  }

  fb.login(
    (response: { authResponse?: { code?: string }; status?: string }) => {
      if (response.authResponse?.code) {
        pending.code = response.authResponse.code;
        scheduleTrySend();
      } else if (
        response.status === "not_authorized" ||
        response.status === "unknown"
      ) {
        showError(
          "WhatsApp",
          "Sign-in was cancelled or could not be completed.",
        );
      }
    },
    {
      config_id: configId,
      response_type: "code",
      override_default_response_type: true,
    },
  );
  return { ok: true };
}
