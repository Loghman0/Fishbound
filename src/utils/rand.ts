/** Random helpers used by systems. Kept tiny on purpose. */
export const rand = {
  pick<T>(arr: readonly T[]): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  },
  range(min: number, max: number): number {
    return min + Math.random() * (max - min);
  },
  chance(p: number): boolean {
    return Math.random() < p;
  },
};
