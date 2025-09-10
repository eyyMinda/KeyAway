// CD Key ID generation utilities
import { randomUUID } from "crypto";

/**
 * Generates a unique ID for a CD key
 * @param key - The CD key string
 * @param validUntil - The valid until date string
 * @returns A unique ID in format: key_{timestamp}_{validUntil}_{uuid8chars}
 */
export function generateCDKeyId(key: string, validUntil?: string): string {
  // Get current timestamp (6-8 characters)
  const timestamp = Date.now().toString(36).slice(-6);

  // Get valid until date (6-8 characters from date)
  const validUntilStr = validUntil ? new Date(validUntil).getTime().toString(36).slice(-6) : "000000";

  // Generate 8-character UUID
  const uuid8 = randomUUID().replace(/-/g, "").slice(0, 8);

  return `key_${timestamp}_${validUntilStr}_${uuid8}`;
}

/**
 * Generates a unique ID for a CD key with a prefix
 * @param key - The CD key string
 * @param validUntil - The valid until date string
 * @param prefix - Optional prefix for the ID
 * @returns A unique ID with the specified prefix
 */
export function generateCDKeyIdWithPrefix(key: string, validUntil?: string, prefix?: string): string {
  const baseId = generateCDKeyId(key, validUntil);
  return prefix ? `${prefix}_${baseId}` : baseId;
}
