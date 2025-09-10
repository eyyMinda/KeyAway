import crypto from "crypto";

/**
 * Key hashing utilities for CD key privacy and identification
 * Uses SHA-256 with a salt for consistent hashing
 * Works on both client and server side
 */

const SALT = process.env.ANALYTICS_SALT || process.env.NEXT_PUBLIC_ANALYTICS_SALT || "keyaway-default-salt";

/**
 * Creates a hash of a CD key for privacy-preserving storage (server-side)
 * @param key - The CD key to hash
 * @returns A consistent hash of the key
 */
export function hashCDKey(key: string): string {
  const trimmedKey = key.replace(/\s+/g, "").toUpperCase();
  return crypto
    .createHash("sha256")
    .update(trimmedKey + SALT)
    .digest("hex")
    .substring(0, 16);
}

/**
 * Creates a hash of a CD key for privacy-preserving storage (client-side)
 * Uses Web Crypto API for SHA-256 hashing
 * @param key - The CD key to hash
 * @returns A consistent hash of the key
 */
export async function hashCDKeyClient(key: string): Promise<string> {
  const trimmedKey = key.replace(/\s+/g, "").toUpperCase();
  const input = trimmedKey + SALT;

  // Use Web Crypto API for SHA-256 (same as server-side)
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return hashHex.substring(0, 16);
}

/**
 * Creates a short identifier for a CD key (first 3 + last 3 chars)
 * @param key - The CD key
 * @returns Short identifier like "ABC***XYZ"
 */
export function getKeyIdentifier(key: string): string {
  const trimmedKey = key.replace(/\s+/g, "").toUpperCase();
  if (trimmedKey.length <= 6) return "***";
  return `${trimmedKey.slice(0, 3)}***${trimmedKey.slice(-3)}`;
}

/**
 * Normalizes a CD key for consistent processing
 * @param key - The CD key to normalize
 * @returns Normalized key (trimmed, uppercase)
 */
export function normalizeKey(key: string): string {
  return key.replace(/\s+/g, "").toUpperCase();
}
