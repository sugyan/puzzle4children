/**
 * パターンのつづき の生成。
 * 各行は周期 k の繰り返しパターン。十分な数（2周期以上）を見せたあと、
 * 行末の数マスを空白にして子どもが続きを書く。きまりが繰り返すので自己検証できる。
 */
import type { Difficulty } from '../../types.js';
import { mulberry32, type Rng } from '../../rng.js';

export interface PatternRow {
  period: number;
  /** 行末の空白（埋める）マス数 */
  blanks: number;
  /** アイコンIDの並び（空白マスにも正解のIDが入っている） */
  cells: string[];
}

export interface PatternData {
  rows: PatternRow[];
}

// 子どもが鉛筆で描きやすい単純な形だけを使う
const DRAWABLE = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond'];

interface Setting {
  rows: number;
  periods: number[];
  blanks: number;
  pool: number;
}

const SETTINGS: Record<Difficulty, Setting> = {
  easy: { rows: 3, periods: [2], blanks: 2, pool: 3 },
  normal: { rows: 4, periods: [2, 3], blanks: 2, pool: 4 },
  hard: { rows: 5, periods: [3, 4], blanks: 2, pool: 6 },
};

export function generatePattern(seed: number, difficulty: Difficulty): PatternData {
  const rng = mulberry32(seed);
  const s = SETTINGS[difficulty];
  const pool = DRAWABLE.slice(0, s.pool);

  const rows: PatternRow[] = [];
  for (let r = 0; r < s.rows; r++) {
    const period = rng.pick(s.periods);
    const base = makeBase(rng, pool, period);
    const visible = 2 * period; // 2周期以上みせてからきまりを推測させる
    const length = visible + s.blanks;
    const cells = Array.from({ length }, (_, i) => base[i % period]);
    rows.push({ period, blanks: s.blanks, cells });
  }
  return { rows };
}

/** 周期パターンの1周期分。全部同じや、つなぎ目で重複する形は避ける。 */
function makeBase(rng: Rng, pool: string[], k: number): string[] {
  for (let tries = 0; tries < 100; tries++) {
    const base = Array.from({ length: k }, () => rng.pick(pool));
    if (new Set(base).size < 2) continue; // 全部同じはNG
    if (base[0] === base[k - 1]) continue; // つなぎ目の重複を避ける
    return base;
  }
  return Array.from({ length: k }, (_, i) => pool[i % pool.length]);
}
