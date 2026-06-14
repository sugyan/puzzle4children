/**
 * シード付き乱数。mulberry32 を使い、同じシードからは必ず同じ列を返す。
 * すべてのパズル生成はこの RNG だけを使うことで再現性を保証する。
 */
export interface Rng {
  /** 0 以上 1 未満の浮動小数 */
  next(): number;
  /** 0 以上 maxExclusive 未満の整数 */
  int(maxExclusive: number): number;
  /** 配列から1つ選ぶ */
  pick<T>(arr: readonly T[]): T;
  /** 配列をシャッフルした新しい配列を返す（元配列は変更しない） */
  shuffle<T>(arr: readonly T[]): T[];
}

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (maxExclusive: number): number => Math.floor(next() * maxExclusive);
  return {
    next,
    int,
    pick<T>(arr: readonly T[]): T {
      return arr[int(arr.length)];
    },
    shuffle<T>(arr: readonly T[]): T[] {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(i + 1);
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
}
