/**
 * Splits names into two balanced lines if they exceed standard length
 * or have long individual names (e.g. Bartholomew Whitfield).
 * Short names remain on a single line.
 */
export function formatNameLines(name) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) return [''];
  const words = trimmed.split(/\s+/);
  if (words.length <= 1) return [trimmed];

  // If long (>= 15 chars or has a word >= 9 chars)
  if (trimmed.length >= 15 || words.some((w) => w.length >= 9)) {
    let bestIdx = 1;
    let bestDiff = Infinity;
    for (let i = 1; i < words.length; i++) {
      const line1 = words.slice(0, i).join(' ');
      const line2 = words.slice(i).join(' ');
      const diff = Math.abs(line1.length - line2.length);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }
    return [words.slice(0, bestIdx).join(' '), words.slice(bestIdx).join(' ')];
  }

  return [trimmed];
}
