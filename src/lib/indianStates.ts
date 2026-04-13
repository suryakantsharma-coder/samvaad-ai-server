/**
 * India: 28 states + Delhi (National Capital Territory) —29 common options for address forms.
 * Sorted alphabetically (Delhi grouped under D).
 */
export const INDIAN_STATES: readonly string[] = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi (NCT)",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

/** Ensures a legacy/API value not in the list still appears in the dropdown. */
export function indianStatesForSelect(currentValue: string | undefined): string[] {
  const base = [...INDIAN_STATES];
  const v = currentValue?.trim();
  if (v && !base.includes(v)) {
    return [v, ...base];
  }
  return base;
}
