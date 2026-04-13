/** WhatsApp + notification flags for Integrations & Notifications (hospital-settings API). */
export type HospitalWhatsappSettings = {
  isEnabled: boolean;
  appointment: boolean;
  prescription: boolean;
  medicinesReminder: boolean;
};

export type HospitalTeleCallerSettings = {
  isEnabled: boolean;
};

export type HospitalSettings = {
  whatsapp: HospitalWhatsappSettings;
  teleCaller: HospitalTeleCallerSettings;
};

export type CreateHospitalSettingsPayload = {
  whatsapp: HospitalWhatsappSettings;
  teleCaller: HospitalTeleCallerSettings;
};

/** PATCH /hospital-settings/me — partial nested updates. */
export type PatchHospitalSettingsPayload = {
  whatsapp?: Partial<HospitalWhatsappSettings>;
  teleCaller?: Partial<HospitalTeleCallerSettings>;
};
