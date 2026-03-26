/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
} as const;

/**
 * Print success message in green
 */
export function success(message: string): string {
  return `${COLORS.green}${message}${COLORS.reset}`;
}

/**
 * Print error message in red
 */
export function error(message: string): string {
  return `${COLORS.red}${message}${COLORS.reset}`;
}

/**
 * Print warning message in yellow
 */
export function warn(message: string): string {
  return `${COLORS.yellow}${message}${COLORS.reset}`;
}

/**
 * Print informational message in cyan
 */
export function info(message: string): string {
  return `${COLORS.cyan}${message}${COLORS.reset}`;
}

/**
 * Print dimmed message in gray
 */
export function dim(message: string): string {
  return `${COLORS.gray}${message}${COLORS.reset}`;
}

/**
 * Print bold message
 */
export function bold(message: string): string {
  return `${COLORS.bold}${message}${COLORS.reset}`;
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}

/**
 * Print array of objects as table (wrapper around console.table)
 */
export function table(data: unknown[]): void {
  console.table(data);
}

/**
 * Print horizontal divider line
 */
export function divider(char = '═', width = 70): string {
  return char.repeat(width);
}
