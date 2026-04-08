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
}
