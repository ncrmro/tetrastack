/**
 * Converts a string into a URL-safe slug
 *
 * Features:
 * - Converts to lowercase
 * - Removes/normalizes accented characters (é → e)
 * - Removes special characters (apostrophes, commas, parentheses, etc.)
 * - Converts '&' to 'and'
 * - Replaces spaces and multiple hyphens with single hyphen
 * - Trims leading/trailing hyphens
 *
 * @param text - The text to convert to a slug
 * @returns URL-safe slug string
 *
 * @example
 * slugify("Chicken Noodle Soup, Garlic Bread and Salad")
 * // Returns: "chicken-noodle-soup-garlic-bread-and-salad"
 *
 * @example
 * slugify("Za'atar Seasoning")
 * // Returns: "zaatar-seasoning"
 *
 * @example
 * slugify("Café au Lait")
 * // Returns: "cafe-au-lait"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/&/g, 'and') // Convert ampersands to 'and'
    .replace(/[^\w\s-]/g, '') // Remove all non-word chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens
}

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
    return baseSlug
  }

  let counter = 2
  let uniqueSlug = `${baseSlug}-${counter}`

  while (existingSlugs.has(uniqueSlug)) {
    counter++
    uniqueSlug = `${baseSlug}-${counter}`
  }

  return uniqueSlug
}
