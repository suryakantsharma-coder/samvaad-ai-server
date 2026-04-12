/** Indian mobile national part: 10 digits, first digit 6–9 */
const IN_MOBILE = /^[6-9]\d{9}$/;

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/** 10-digit Indian mobile (national, no country code). */
export function validateIndianMobileNational(national: string): string | null {
  const d = digitsOnly(national);
  if (d.length !== 10) {
    return "Enter a 10-digit mobile number with +91.";
  }
  if (!IN_MOBILE.test(d)) {
    return "Enter a valid Indian mobile number (starts with 6–9).";
  }
  return null;
}

export function requirePlus91(countryCode: string): string | null {
  if (countryCode.trim() !== "+91") {
    return "Phone numbers must use country code +91.";
  }
  return null;
}

export function isValidHttpUrl(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateIndiaPincode(pin: string): string | null {
  const d = digitsOnly(pin);
  if (d.length !== 6) return "Pincode must be 6 digits.";
  return null;
}

export function validateEmail(email: string): string | null {
  const t = email.trim();
  if (!t) return "Email is required.";
  if (!EMAIL_RE.test(t)) return "Enter a valid email address.";
  return null;
}

export function validateNonEmpty(value: string, label: string): string | null {
  if (!value.trim()) return `${label} is required.`;
  return null;
}

export function validateHospitalReviewUrls(
  a: string,
  b: string,
): string | null {
  const u0 = a.trim();
  const u1 = b.trim();
  if (!u0 || !u1) return "Both review URLs are required.";
  if (!isValidHttpUrl(u0) || !isValidHttpUrl(u1)) {
    return "Review URLs must be valid http(s) links.";
  }
  return null;
}

export type SettingsHospitalFormInput = {
  hospitalName: string;
  address: string;
  city: string;
  pincode: string;
  officialEmail: string;
  contactPerson: string;
  registrationNumber: string;
  hospitalUrl: string;
  phoneRouting: string;
  phoneRoutingCountryCode: string;
  whatsappNumber: string;
  whatsappCountryCode: string;
  emergencyCountryCode: string;
  emergencyPhone: string;
  receptionistCountryCode: string;
  receptionistPhone: string;
  reviewUrls: readonly [string, string];
};

export function validateSettingsHospitalForm(
  f: SettingsHospitalFormInput,
): string | null {
  let err: string | null;
  err = validateNonEmpty(f.hospitalName, "Hospital name");
  if (err) return err;
  err = validateNonEmpty(f.address, "Address");
  if (err) return err;
  err = validateNonEmpty(f.city, "City");
  if (err) return err;
  err = validateIndiaPincode(f.pincode);
  if (err) return err;
  err = validateEmail(f.officialEmail);
  if (err) return err;
  err = validateNonEmpty(f.contactPerson, "Contact person");
  if (err) return err;
  err = validateNonEmpty(f.registrationNumber, "Registration / GST number");
  if (err) return err;
  if (!isValidHttpUrl(f.hospitalUrl)) {
    return "Hospital website must be a valid http(s) URL.";
  }
  err = requirePlus91(f.phoneRoutingCountryCode);
  if (err) return err;
  err = validateIndianMobileNational(f.phoneRouting);
  if (err) return err;
  err = requirePlus91(f.whatsappCountryCode);
  if (err) return err;
  err = validateIndianMobileNational(f.whatsappNumber);
  if (err) return err;
  err = requirePlus91(f.emergencyCountryCode);
  if (err) return err;
  err = validateIndianMobileNational(f.emergencyPhone);
  if (err) return err;
  err = requirePlus91(f.receptionistCountryCode);
  if (err) return err;
  err = validateIndianMobileNational(f.receptionistPhone);
  if (err) return err;
  return validateHospitalReviewUrls(f.reviewUrls[0], f.reviewUrls[1]);
}

export type CreateHospitalFormInput = {
  hospitalName: string;
  email: string;
  contactPerson: string;
  gstRegistration: string;
  address: string;
  city: string;
  pincode: string;
  hospitalUrl: string;
  phone: string;
  whatsappCountryCode: string;
  whatsappPhone: string;
  emergencyCountryCode: string;
  emergencyPhone: string;
  receptionistCountryCode: string;
  receptionistPhone: string;
  reviewUrls: readonly [string, string];
};

export function validateCreateHospitalForm(
  f: CreateHospitalFormInput,
): string | null {
  let err: string | null;
  err = validateNonEmpty(f.hospitalName, "Hospital name");
  if (err) return err;
  err = validateIndianMobileNational(f.phone);
  if (err) return err;
  err = validateEmail(f.email);
  if (err) return err;
  err = validateNonEmpty(f.contactPerson, "Contact person");
  if (err) return err;
  err = validateNonEmpty(f.gstRegistration, "GST/Registration number");
  if (err) return err;
  err = validateNonEmpty(f.address, "Address");
  if (err) return err;
  err = validateNonEmpty(f.city, "City");
  if (err) return err;
  err = validateIndiaPincode(f.pincode);
  if (err) return err;
  if (!isValidHttpUrl(f.hospitalUrl)) {
    return "Hospital URL must be a valid http(s) URL.";
  }
  err = requirePlus91(f.whatsappCountryCode);
  if (err) return err;
  err = validateIndianMobileNational(f.whatsappPhone);
  if (err) return err;
  err = requirePlus91(f.emergencyCountryCode);
  if (err) return err;
  err = validateIndianMobileNational(f.emergencyPhone);
  if (err) return err;
  err = requirePlus91(f.receptionistCountryCode);
  if (err) return err;
  err = validateIndianMobileNational(f.receptionistPhone);
  if (err) return err;
  return validateHospitalReviewUrls(f.reviewUrls[0], f.reviewUrls[1]);
}
