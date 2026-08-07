/** Indian mobile — digits only, max 10 */
export function formatPhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function displayPhone(value: string): string {
  return (value || "").replace(/\D/g, "").slice(0, 10);
}

/** Indian PIN — 6 digits */
export function formatPin(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

/** PAN uppercase alphanumeric, max 10 */
export function formatPan(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10);
}

/** TAN uppercase alphanumeric, max 10 */
export function formatTan(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10);
}

/** GSTIN uppercase alphanumeric, max 15 */
export function formatGstin(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 15);
}

/** IFSC uppercase alphanumeric, max 11 */
export function formatIfsc(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 11);
}
