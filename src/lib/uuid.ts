import { v7 as uuidv7 } from 'uuid';

/**
 * Generate a UUIDv7 following RFC 9562 specification
 * Uses the npm uuid package's v7 implementation
 *
 * UUIDv7 structure:
 * - 48 bits: Unix timestamp in milliseconds
 * - 4 bits: version (0111 = 7)
 * - 12 bits: random data
 * - 2 bits: variant (10)
 * - 62 bits: random data
 *
 * @returns A UUIDv7 string in the format xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx
 */
export function generateUuidV7(): string {
  return uuidv7();
}
