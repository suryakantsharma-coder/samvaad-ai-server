/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FACEBOOK_APP_ID?: string;
  readonly VITE_RAZORPAY_KEY_ID?: string;
  /** Meta Embedded Signup configuration ID for WhatsApp (FB.login). */
  readonly VITE_META_WHATSAPP_CONFIG_ID?: string;
  /** Optional URL opened by "Start onboarding" (defaults to Meta WhatsApp Manager). */
  readonly VITE_WHATSAPP_ONBOARDING_URL?: string;
  /** Two-step verification PIN for POST .../register (default 123456). */
  readonly VITE_WHATSAPP_REGISTER_PIN?: string;
  readonly VITE_WA_TEMPLATE_APPOINTMENT_CONFIRMATION?: string;
  readonly VITE_WA_TEMPLATE_POST_OPD_PRESCRIPTION?: string;
  readonly VITE_WA_TEMPLATE_MEDICINE_REMINDER?: string;
  readonly VITE_WA_TEMPLATE_DOSAGE_COMPLETION?: string;
  readonly VITE_WA_TEMPLATE_DOSAGE_FOLLOWUP_NOT_YET?: string;
}
