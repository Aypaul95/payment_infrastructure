export function toTermiiPhoneNumber(phone: string): string {
  const normalized = phone.trim().replace(/[\s()-]/g, "");

  // Nigerian local format: 08012345678 -> 2348012345678
  if (/^0[789][01]\d{8}$/.test(normalized)) {
    return `234${normalized.slice(1)}`;
  }

  // Nigerian international format: +2348012345678 -> 2348012345678
  if (/^\+234[789][01]\d{8}$/.test(normalized)) {
    return normalized.slice(1);
  }

  // Nigerian international format without plus: 2348012345678
  if (/^234[789][01]\d{8}$/.test(normalized)) {
    return normalized;
  }

  throw new Error("INVALID_NIGERIAN_PHONE_NUMBER");
}