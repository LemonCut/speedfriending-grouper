/**
 * Fisher–Yates shuffle (non-mutating).
 * @param {Array} arr
 * @param {() => number} rng returns [0, 1)
 */
export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Randomly split bits into `groupCount` groups (one per Byte).
 * Sizes differ by at most one; the first (M mod N) groups get the extra bit.
 * Groups smaller than the max size for this split are flagged `belowMax`.
 */
export function createGroups(bits, groupCount, rng = Math.random) {
  if (!Number.isInteger(groupCount) || groupCount < 1) {
    throw new Error('At least one Byte is required to create groups');
  }
  const shuffled = shuffle(bits, rng);
  const buckets = Array.from({ length: groupCount }, () => []);
  shuffled.forEach((bit, i) => buckets[i % groupCount].push(bit));

  const maxSize = Math.ceil(bits.length / groupCount);
  const groups = buckets.map((members, i) => ({
    number: i + 1,
    members,
    size: members.length,
    belowMax: members.length < maxSize,
  }));
  return { maxSize, groups };
}
