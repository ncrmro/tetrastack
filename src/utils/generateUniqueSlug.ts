/**
 * Generates a unique slug by appending a number suffix if needed
 *
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Set of existing slugs to check against
 * @returns A unique slug, potentially with a numeric suffix
 *
 * @example
 * generateUniqueSlug("chicken-soup", new Set(["chicken-soup"]))
 * // Returns: "chicken-soup-2"
 */
export function generateUniqueSlug(
  baseSlug: string,
  existingSlugs: Set<string>,
): string {
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.has(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}
