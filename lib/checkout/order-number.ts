/**
 * Generate a unique-ish order number in format KAR-YYYYMM-XXXXX
 * Collision-resistant for human-readable display.
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  // 5 random uppercase alphanumerics, exclude confusing chars (0/O, 1/I)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 5; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `KAR-${yyyy}${mm}-${suffix}`;
}
