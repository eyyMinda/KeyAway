// CD Key ID generation utilities

/**
 * Generates a unique ID for a CD key
 * @param key - The CD key string
 * @returns A unique ID based on the key content
 */
export function generateCDKeyId(key: string): string {
  // Create a hash of the key for consistent ID generation
  const hash = key
    .replace(/\s+/g, "") // Remove spaces
    .toLowerCase()
    .split("")
    .reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

  // Add timestamp for uniqueness
  const timestamp = Date.now().toString(36);

  return `key_${Math.abs(hash).toString(36)}_${timestamp}`;
}

/**
 * Generates a unique ID for a CD key with a prefix
 * @param key - The CD key string
 * @param prefix - Optional prefix for the ID
 * @returns A unique ID with the specified prefix
 */
export function generateCDKeyIdWithPrefix(key: string, prefix?: string): string {
  const baseId = generateCDKeyId(key);
  return prefix ? `${prefix}_${baseId}` : baseId;
}
