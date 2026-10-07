/**
 * Formats a list of group numbers or group objects into a natural title string.
 * e.g.:
 * [1] -> "Group 1"
 * [1, 2] -> "Groups 1 and 2"
 * [1, 2, 3] -> "Groups 1, 2, and 3"
 * [1, 2, 3, 4] -> "Groups 1, 2, 3, and 4"
 */
export function formatGroupTitle(groups) {
  if (!groups || !groups.length) return '';
  const numbers = groups.map((g) => (typeof g === 'object' && g !== null && 'number' in g ? g.number : g));
  if (numbers.length === 1) {
    return `Group ${numbers[0]}`;
  }
  if (numbers.length === 2) {
    return `Groups ${numbers[0]} and ${numbers[1]}`;
  }
  const leading = numbers.slice(0, -1).join(', ');
  const last = numbers[numbers.length - 1];
  return `Groups ${leading}, and ${last}`;
}

/**
 * Chunks an array of groups into batches of specified size.
 */
export function chunkGroups(groups, size = 1) {
  const s = Math.max(1, Number(size) || 1);
  if (!groups || !groups.length) return [];
  const batches = [];
  for (let i = 0; i < groups.length; i += s) {
    batches.push(groups.slice(i, i + s));
  }
  return batches;
}

/**
 * Calculates adaptive font size based on member count and multi-card layout.
 */
export function fontFor(n, multiCount = 1) {
  if (multiCount === 1) {
    if (n <= 6) return 'clamp(2.7rem, 7.2vh, 5.1rem)';
    if (n <= 12) return 'clamp(2.1rem, 5.4vh, 3.9rem)';
    if (n <= 20) return 'clamp(1.725rem, 4.35vh, 3.15rem)';
    return 'clamp(1.425rem, 3.45vh, 2.25rem)';
  }
  if (multiCount === 2) {
    if (n <= 6) return 'clamp(1.8rem, 4.2vh, 3.0rem)';
    if (n <= 12) return 'clamp(1.4rem, 3.2vh, 2.4rem)';
    if (n <= 20) return 'clamp(1.15rem, 2.5vh, 1.8rem)';
    return 'clamp(0.95rem, 2.0vh, 1.4rem)';
  }
  if (multiCount === 3) {
    if (n <= 6) return 'clamp(1.35rem, 3.0vh, 2.1rem)';
    if (n <= 12) return 'clamp(1.1rem, 2.4vh, 1.65rem)';
    if (n <= 20) return 'clamp(0.92rem, 1.9vh, 1.35rem)';
    return 'clamp(0.8rem, 1.5vh, 1.15rem)';
  }
  // multiCount >= 4
  if (n <= 6) return 'clamp(1.2rem, 2.5vh, 1.8rem)';
  if (n <= 12) return 'clamp(1.0rem, 2.0vh, 1.45rem)';
  if (n <= 20) return 'clamp(0.85rem, 1.6vh, 1.25rem)';
  return 'clamp(0.72rem, 1.3vh, 1.05rem)';
}

