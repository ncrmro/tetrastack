/**
 * Utility functions for working with enums
 */

/**
 * Format an enum key into a readable label
 * Converts SNAKE_CASE to Title Case
 *
 * @example
 * formatEnumKey('IN_PROGRESS') // 'In Progress'
 * formatEnumKey('TODO') // 'Todo'
 * formatEnumKey('HIGH') // 'High'
 */
export function formatEnumKey(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Convert an enum object to an array of select options
 * Useful for generating <option> elements from enums
 *
 * @example
 * const options = enumToOptions(TASK_STATUS);
 * // [
 * //   { value: 'todo', label: 'Todo' },
 * //   { value: 'in_progress', label: 'In Progress' },
 * //   { value: 'done', label: 'Done' }
 * // ]
 */
export function enumToOptions<T extends Record<string, string>>(
  enumObj: T,
): Array<{ value: T[keyof T]; label: string }> {
  return Object.entries(enumObj).map(([key, value]) => ({
    value: value as T[keyof T],
    label: formatEnumKey(key),
  }))
}
