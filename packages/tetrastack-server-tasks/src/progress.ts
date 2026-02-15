/**
 * Create a progress bar string with block characters
 */
export function createProgressBar(percent: number, width = 20): string {
  // Clamp percent to 0-100
  const clampedPercent = Math.max(0, Math.min(100, percent));

  const filled = Math.round((clampedPercent / 100) * width);
  const empty = width - filled;

  return '█'.repeat(filled) + '░'.repeat(empty);
}
