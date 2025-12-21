/**
 * Parse command line parameters from --param key=value format
 */
export function parseParams(args: string[]): Record<string, unknown> {
  const params: Record<string, unknown> = {};

  for (const arg of args) {
    // Split on first = only (values can contain =)
    const equalIndex = arg.indexOf('=');
    if (equalIndex === -1) {
      throw new Error(
        `Invalid param format: ${arg}. Expected format: key=value`,
      );
    }

    const key = arg.substring(0, equalIndex);
    const value = arg.substring(equalIndex + 1);

    // Parse nested keys (e.g., "user.email" -> {user: {email: ...}})
    const keys = key.split('.');
    const parsedValue = coerceValue(value);

    // Set nested value
    let current: Record<string, unknown> = params;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = parsedValue;
  }

  return params;
}

/**
 * Coerce string value to appropriate type
 */
function coerceValue(str: string): unknown {
  // Boolean
  if (str === 'true') return true;
  if (str === 'false') return false;

  // Null
  if (str === 'null') return null;

  // Number
  if (!isNaN(Number(str)) && str !== '') {
    return Number(str);
  }

  // String (default)
  return str;
}
