// Path: src/common/utils/masking.util.ts

/**
 * Masks sensitive strings for safe API & UI display (SRS AUTH-07 / NFR-05).
 * Examples:
 *  - maskNationalId("29805121234567") -> "29XXXXXXXXXXXX"
 *  - maskFinancialIdentifier("12345678901234") -> "XXXXXXXXXX1234"
 */
export function maskNationalId(idNumber: string): string {
  const clean = idNumber.trim();
  if (clean.length <= 4) return 'XXXX';
  return clean.slice(0, 2) + 'X'.repeat(clean.length - 2);
}

export function maskFinancialIdentifier(value: string): string {
  const clean = value.replace(/\s+/g, '');
  if (clean.length <= 4) return 'XXXX';
  return 'X'.repeat(Math.max(4, clean.length - 4)) + clean.slice(-4);
}