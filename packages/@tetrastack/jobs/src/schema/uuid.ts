/**
 * UUIDv7 generator for database IDs
 *
 * UUIDv7 is time-ordered, making it ideal for database primary keys:
 * - Sortable by creation time
 * - No database round-trip needed for ID generation
 * - Globally unique
 */

/**
 * Generate a UUIDv7 (time-ordered UUID)
 *
 * Format: ttttttt-tttt-7xxx-yxxx-xxxxxxxxxxxx
 * - t = unix timestamp in milliseconds (48 bits)
 * - 7 = version (4 bits)
 * - x = random (74 bits)
 * - y = variant (2 bits, always 10)
 */
export function generateUuidV7(): string {
  const timestamp = Date.now();
  const randomBytes = crypto.getRandomValues(new Uint8Array(10));

  // Extract timestamp parts
  const timestampHex = timestamp.toString(16).padStart(12, '0');

  // Build random portion with version and variant bits
  const randomHex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // UUIDv7 format with version 7 and variant 10
  const uuid = [
    timestampHex.slice(0, 8), // time_high
    timestampHex.slice(8, 12), // time_mid
    '7' + randomHex.slice(0, 3), // version + random
    ((parseInt(randomHex.slice(3, 5), 16) & 0x3f) | 0x80)
      .toString(16)
      .padStart(2, '0') + randomHex.slice(5, 7), // variant + random
    randomHex.slice(7, 19), // random
  ].join('-');

  return uuid;
}
