import type { CDKey } from "@/src/types";

/** In-memory key status for display between cron runs (no Sanity writes). */
export function applyKeyStatusForDisplay(cdKeys: CDKey[]): CDKey[] {
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return cdKeys.map(key => {
    let updatedKey = { ...key };

    if (key.status !== "expired" && key.validUntil) {
      const validUntil = new Date(key.validUntil);
      if (now > validUntil) {
        updatedKey = { ...updatedKey, status: "expired" };
      }
    }

    if (updatedKey.status === "new") {
      const keyDate = key.createdAt || key.validFrom;
      if (keyDate) {
        const checkDate = new Date(keyDate);
        if (checkDate < oneMonthAgo) {
          updatedKey = { ...updatedKey, status: "active" };
        }
      }
    }

    return updatedKey;
  });
}
