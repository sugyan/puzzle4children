/**
 * パターンのつづき の生成。
 * 単純な繰り返しだけでなく、回転・数の増加・大小など複数の「きまり」を行ごとに混ぜる。
 * 各行は十分な数を見せたあと行末を空白にし、子どもが続きを書く（きまりが分かれば自己検証できる）。
 */
import type { Difficulty } from '../../types.js';
import { mulberry32, type Rng } from '../../rng.js';

export type CellSpec =
  | { t: 'icon'; id: string }
  | { t: 'count'; n: number }
  | { t: 'rot'; deg: number }
  | { t: 'size'; id: string; scale: number };

export type PatternKind = 'repeat' | 'rotate' | 'grow' | 'size';

export interface PatternRow {
  kind: PatternKind;
  /** 行末の空白（埋める）マス数 */
  blanks: number;
  specs: CellSpec[];
}

export interface PatternData {
  rows: PatternRow[];
}

// 子どもが鉛筆で描きやすい単純な形
const DRAWABLE = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond'];
const MAX_DOTS = 9;

interface Setting {
  rows: number;
  blanks: number;
  kinds: PatternKind[];
  pool: number;
  repeatPeriods: number[];
  growSteps: number[];
  sizePeriods: number[];
}

const SETTINGS: Record<Difficulty, Setting> = {
  easy: {
    rows: 3, blanks: 1, kinds: ['repeat', 'size', 'grow'],
    pool: 3, repeatPeriods: [2], growSteps: [1], sizePeriods: [2],
  },
  normal: {
    rows: 4, blanks: 2, kinds: ['repeat', 'rotate', 'grow', 'size'],
    pool: 4, repeatPeriods: [2, 3], growSteps: [1], sizePeriods: [2],
  },
  hard: {
    rows: 5, blanks: 2, kinds: ['repeat', 'rotate', 'grow', 'size'],
    pool: 6, repeatPeriods: [3, 4], growSteps: [1, 2], sizePeriods: [2, 3],
  },
};

export function generatePattern(seed: number, difficulty: Difficulty): PatternData {
  const rng = mulberry32(seed);
  const s = SETTINGS[difficulty];

  const rows: PatternRow[] = [];
  let prev: PatternKind | null = null;
  for (let r = 0; r < s.rows; r++) {
    let kind = rng.pick(s.kinds);
    if (kind === prev) kind = rng.pick(s.kinds); // できるだけ連続させない
    prev = kind;
    rows.push(buildRow(rng, kind, s));
  }
  return { rows };
}

function buildRow(rng: Rng, kind: PatternKind, s: Setting): PatternRow {
  switch (kind) {
    case 'repeat': {
      const pool = DRAWABLE.slice(0, s.pool);
      const k = rng.pick(s.repeatPeriods);
      const base = makeBase(rng, pool, k);
      const length = 2 * k + s.blanks;
      const specs = Array.from({ length }, (_, i): CellSpec => ({ t: 'icon', id: base[i % k] }));
      return { kind, blanks: s.blanks, specs };
    }
    case 'rotate': {
      const start = rng.pick([0, 90, 180, 270]);
      const dir = rng.pick([90, -90]);
      const length = 4 + s.blanks; // 1周ぶん見せてから続ける
      const specs = Array.from({ length }, (_, i): CellSpec => ({
        t: 'rot',
        deg: (((start + i * dir) % 360) + 360) % 360,
      }));
      return { kind, blanks: s.blanks, specs };
    }
    case 'grow': {
      const step = rng.pick(s.growSteps);
      const visible = step === 1 ? 4 : 3;
      const length = visible + s.blanks;
      const maxStart = Math.max(1, MAX_DOTS - (length - 1) * step);
      const start = 1 + rng.int(maxStart);
      const specs = Array.from({ length }, (_, i): CellSpec => ({ t: 'count', n: start + i * step }));
      return { kind, blanks: s.blanks, specs };
    }
    case 'size':
    default: {
      const id = rng.pick(DRAWABLE.slice(0, 4));
      const period = rng.pick(s.sizePeriods);
      const scales = period === 2 ? [0.5, 1.0] : [0.45, 0.72, 1.0];
      const length = 2 * period + s.blanks;
      const specs = Array.from({ length }, (_, i): CellSpec => ({ t: 'size', id, scale: scales[i % period] }));
      return { kind, blanks: s.blanks, specs };
    }
  }
}

/** 周期パターンの1周期分。全部同じや、つなぎ目で重複する形は避ける。 */
function makeBase(rng: Rng, pool: string[], k: number): string[] {
  for (let tries = 0; tries < 100; tries++) {
    const base = Array.from({ length: k }, () => rng.pick(pool));
    if (new Set(base).size < 2) continue;
    if (base[0] === base[k - 1]) continue;
    return base;
  }
  return Array.from({ length: k }, (_, i) => pool[i % pool.length]);
}
