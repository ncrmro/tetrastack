interface SlugifyOptions {
  separator?: string;
  lowercase?: boolean;
  strict?: boolean;
  maxLength?: number;
}

/**
 * Converts a string to a URL-friendly slug
 *
 * @param text - The text to slugify
 * @param options - Optional configuration
 * @returns A URL-friendly slug
 *
 * @example
 * slugify('Chicken & Rice') // 'chicken-and-rice'
 * slugify('Café au Lait') // 'cafe-au-lait'
 * slugify("Chef's Special") // 'chefs-special'
 */
export function slugify(text: string, options: SlugifyOptions = {}): string {
  const {
    separator = '-',
    lowercase = true,
    strict = true,
    maxLength,
  } = options;

  let result = text;

  if (lowercase) {
    result = result.toLowerCase();
  }

  // Convert ampersands to "and" before removing special characters
  result = result.replace(/&/g, ' and ');

  if (strict) {
    result = result
      .normalize('NFD') // Normalize unicode characters
      .replace(/[\u0300-\u036f]/g, '') // Remove accents/diacritics
      .replace(/[^\w\s-]/g, ''); // Remove all non-word chars (except spaces and hyphens)
  }

  result = result
    .replace(/\s+/g, separator) // Replace spaces with separator
    .replace(new RegExp(`${separator}+`, 'g'), separator) // Replace multiple separators with single
    .replace(new RegExp(`^${separator}|${separator}$`, 'g'), ''); // Trim leading/trailing separators

  if (maxLength) {
    result = result.substring(0, maxLength);
  }

  return result;
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
