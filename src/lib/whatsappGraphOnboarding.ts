import {
  postWhatsappTemplateAssignment,
  putWhatsappOnboardingStatus,
  type WhatsappOnboardingStatusPayload,
} from "../data/whatsapp";

/** Graph API version for WhatsApp onboarding calls. */
export const WHATSAPP_GRAPH_API_VERSION = "v21.0";

export type WhatsappOnboardingStepId =
  | "register"
  | "subscribed_apps"
  | "phone_status"
  | "template_assignment";

export interface WhatsappOnboardingStepState {
  id: WhatsappOnboardingStepId;
  label: string;
  status: "idle" | "running" | "success" | "failed";
  httpStatus?: number;
  errorMessage?: string;
  completedAt?: string;
}

export function defaultOnboardingSteps(): WhatsappOnboardingStepState[] {
  return [
    {
      id: "register",
      label: "Register phone (POST /PHONE_NUMBER_ID/register)",
      status: "idle",
    },
    {
      id: "subscribed_apps",
      label: "Subscribe app (POST /WABA_ID/subscribed_apps)",
      status: "idle",
    },
    {
      id: "phone_status",
      label: "Phone status (GET /PHONE_NUMBER_ID?fields=…)",
      status: "idle",
    },
    {
      id: "template_assignment",
      label: "Template assignment (POST /api/whatsapp-template-assignment)",
      status: "idle",
    },
  ];
}

/** Builds step list UI from server-stored onboarding flags (GET /api/whatsapp/onboarding). */
export function stepsFromOnboardingFlags(
  registrationPhone: boolean,
  subscribeApp: boolean,
  verifyRegistration: boolean,
): WhatsappOnboardingStepState[] {
  const steps = defaultOnboardingSteps();
  steps[0].status = registrationPhone ? "success" : "idle";
  steps[1].status = subscribeApp ? "success" : "idle";
  steps[2].status = verifyRegistration ? "success" : "idle";
  return steps;
}

export function isOnboardingFullyComplete(
  flags: WhatsappOnboardingStatusPayload,
): boolean {
  return (
    flags.registrationPhone &&
    flags.subscribeApp &&
    flags.verifyRegistration
  );
}

/** Parsed from GET /api/whatsapp/creds – supports common field names. */
export function extractGraphCredsFromCredsApi(raw: unknown): {
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
} | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const nested = r.data;
  const o =
    nested != null && typeof nested === "object" && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : r;

  const phone =
    o.phone_number_id ??
    o.phoneNumberId ??
    o.phone_numberId;
  const waba = o.waba_id ?? o.wabaId;
  const token =
    o.access_token ??
    o.accessToken ??
    o.long_lived_token ??
    o.longLivedToken;

  if (
    phone == null ||
    waba == null ||
    token == null ||
    String(phone).trim() === "" ||
    String(waba).trim() === "" ||
    String(token).trim() === ""
  ) {
    return null;
  }
  return {
    phoneNumberId: String(phone).trim(),
    wabaId: String(waba).trim(),
    accessToken: String(token).trim(),
  };
}

function isStepHttpSuccess(res: Response): boolean {
  return res.ok && res.status === 200;
}

async function syncOnboardingToServer(
  flags: WhatsappOnboardingStatusPayload,
): Promise<void> {
  try {
    await putWhatsappOnboardingStatus(flags);
  } catch {
    /* upsert failed; Graph step already reflected in UI */
  }
}

/**
 * Runs the three Graph API calls in order. On failure: toasts via `onStepError`, continues to next step.
 * Upserts onboarding flags via PUT /api/whatsapp/onboarding after each step.
 */
export async function runWhatsappGraphOnboarding(params: {
  hospitalId: string;
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  pin: string;
  onStepUpdate: (steps: WhatsappOnboardingStepState[]) => void;
  onStepError: (stepLabel: string, message: string) => void;
}): Promise<boolean> {
  const {
    hospitalId,
    phoneNumberId,
    wabaId,
    accessToken,
    pin,
    onStepUpdate,
    onStepError,
  } = params;

  const hospital = hospitalId.trim();
  const serverFlags: WhatsappOnboardingStatusPayload = {
    hospitalId: hospital,
    registrationPhone: false,
    subscribeApp: false,
    verifyRegistration: false,
  };

  const steps = defaultOnboardingSteps();
  const v = WHATSAPP_GRAPH_API_VERSION;

  const runOne = async (
    index: number,
    runFetch: () => Promise<Response>,
  ): Promise<void> => {
    steps[index] = { ...steps[index], status: "running" };
    onStepUpdate([...steps]);

    let res: Response;
    try {
      res = await runFetch();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Network or CORS error — try from backend proxy";
      steps[index] = {
        ...steps[index],
        status: "failed",
        errorMessage: msg,
        completedAt: new Date().toISOString(),
      };
      if (index === 0) serverFlags.registrationPhone = false;
      if (index === 1) serverFlags.subscribeApp = false;
      if (index === 2) serverFlags.verifyRegistration = false;
      await syncOnboardingToServer(serverFlags);
      onStepError(steps[index].label, msg);
      onStepUpdate([...steps]);
      return;
    }

    const httpStatus = res.status;
    let errBody = "";
    if (!isStepHttpSuccess(res)) {
      errBody = await res.text();
    }

    const ok = isStepHttpSuccess(res);
    steps[index] = {
      ...steps[index],
      status: ok ? "success" : "failed",
      httpStatus,
      errorMessage: ok
        ? undefined
        : errBody.slice(0, 280) || `HTTP ${httpStatus}`,
      completedAt: new Date().toISOString(),
    };

    if (index === 0) serverFlags.registrationPhone = ok;
    if (index === 1) serverFlags.subscribeApp = ok;
    if (index === 2) serverFlags.verifyRegistration = ok;

    await syncOnboardingToServer(serverFlags);

    if (!ok) {
      onStepError(
        steps[index].label,
        steps[index].errorMessage ?? `HTTP ${httpStatus}`,
      );
    }
    onStepUpdate([...steps]);
  };

  const runTemplateAssignment = async (): Promise<void> => {
    const stepIndex = 3;
    steps[stepIndex] = { ...steps[stepIndex], status: "running" };
    onStepUpdate([...steps]);

    const templateEnv = {
      appointmentConfirmation: (
        import.meta.env.VITE_WA_TEMPLATE_APPOINTMENT_CONFIRMATION ?? ""
      ).trim(),
      postOpdPrescription: (
        import.meta.env.VITE_WA_TEMPLATE_POST_OPD_PRESCRIPTION ?? ""
      ).trim(),
      medicineReminder: (
        import.meta.env.VITE_WA_TEMPLATE_MEDICINE_REMINDER ?? ""
      ).trim(),
      dosageCompletion: (
        import.meta.env.VITE_WA_TEMPLATE_DOSAGE_COMPLETION ?? ""
      ).trim(),
      dosageFollowupNotYet: (
        import.meta.env.VITE_WA_TEMPLATE_DOSAGE_FOLLOWUP_NOT_YET ?? ""
      ).trim(),
    };

    const missing: string[] = [];
    if (!hospital) missing.push("hospitalId");
    if (!phoneNumberId?.trim()) missing.push("phone_number_id");
    if (!templateEnv.appointmentConfirmation) {
      missing.push("VITE_WA_TEMPLATE_APPOINTMENT_CONFIRMATION");
    }
    if (!templateEnv.postOpdPrescription) {
      missing.push("VITE_WA_TEMPLATE_POST_OPD_PRESCRIPTION");
    }
    if (!templateEnv.medicineReminder) {
      missing.push("VITE_WA_TEMPLATE_MEDICINE_REMINDER");
    }
    if (!templateEnv.dosageCompletion) {
      missing.push("VITE_WA_TEMPLATE_DOSAGE_COMPLETION");
    }
    if (!templateEnv.dosageFollowupNotYet) {
      missing.push("VITE_WA_TEMPLATE_DOSAGE_FOLLOWUP_NOT_YET");
    }

    if (missing.length > 0) {
      const msg = `Missing required fields for template assignment: ${missing.join(", ")}`;
      steps[stepIndex] = {
        ...steps[stepIndex],
        status: "failed",
        errorMessage: msg,
        completedAt: new Date().toISOString(),
      };
      onStepError(steps[stepIndex].label, msg);
      onStepUpdate([...steps]);
      return;
    }

    try {
      await postWhatsappTemplateAssignment({
        hospitalId: hospital,
        phone_number_id: phoneNumberId.trim(),
        templates: templateEnv,
      });
      steps[stepIndex] = {
        ...steps[stepIndex],
        status: "success",
        httpStatus: 200,
        completedAt: new Date().toISOString(),
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Template assignment failed";
      steps[stepIndex] = {
        ...steps[stepIndex],
        status: "failed",
        errorMessage: msg,
        completedAt: new Date().toISOString(),
      };
      onStepError(steps[stepIndex].label, msg);
    }
    onStepUpdate([...steps]);
  };

  await runOne(0, () =>
    fetch(`https://graph.facebook.com/${v}/${phoneNumberId}/register`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        pin,
      }),
    }),
  );

  await runOne(1, () =>
    fetch(`https://graph.facebook.com/${v}/${wabaId}/subscribed_apps`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }),
  );

  await runOne(2, () =>
    fetch(
      `https://graph.facebook.com/${v}/${phoneNumberId}?fields=verified_name,code_verification_status,quality_rating,name_status`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    ),
  );

  await runTemplateAssignment();

  return steps.every((s) => s.status === "success");
}
