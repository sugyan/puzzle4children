/**
 * なかまはずれ の生成。
 * すべて同じ特徴をもつアイテムを並べ、1つだけある特徴（形／大きさ／数）を変える。
 * 子どもは「1つだけ ちがう」ものを ○で囲む。違いは1つだけなので自己検証できる。
 */
import type { Difficulty } from '../../types.js';
import { mulberry32 } from '../../rng.js';

export type Axis = 'shape' | 'size' | 'count';

export interface OddItem {
  iconId: string;
  /** size軸: 大きさ倍率（既定1） */
  scale: number;
  /** count軸: 表示する個数（指定時は個数で見せる） */
  count?: number;
}

export interface OddData {
  cols: number;
  rows: number;
  axis: Axis;
  items: OddItem[]; // row-major
  oddIndex: number;
}

const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'moon', 'flower'];

interface Setting {
  cols: number;
  rows: number;
  axes: Axis[];
}

const SETTINGS: Record<Difficulty, Setting> = {
  easy: { cols: 3, rows: 2, axes: ['shape'] },
  normal: { cols: 3, rows: 3, axes: ['shape', 'size', 'count'] },
  hard: { cols: 3, rows: 3, axes: ['count', 'size'] },
};

export function generateOdd(seed: number, difficulty: Difficulty): OddData {
  const rng = mulberry32(seed);
  const s = SETTINGS[difficulty];
  const axis = rng.pick(s.axes);
  const total = s.cols * s.rows;
  const oddIndex = rng.int(total);

  let items: OddItem[];
  switch (axis) {
    case 'shape': {
      const common = rng.pick(SHAPES);
      const odd = rng.pick(SHAPES.filter((id) => id !== common));
      items = Array.from({ length: total }, () => ({ iconId: common, scale: 1 }));
      items[oddIndex] = { iconId: odd, scale: 1 };
      break;
    }
    case 'size': {
      const icon = rng.pick(SHAPES);
      // hard はやや控えめな差にして難しくする
      const oddScale =
        difficulty === 'hard' ? rng.pick([0.72, 1.3]) : rng.pick([0.6, 1.5]);
      items = Array.from({ length: total }, () => ({ iconId: icon, scale: 1 }));
      items[oddIndex] = { iconId: icon, scale: oddScale };
      break;
    }
    case 'count':
    default: {
      const icon = 'circle';
      const common = difficulty === 'hard' ? 4 + rng.int(3) : 2 + rng.int(3); // hard:4-6 / 他:2-4
      const odd = rng.next() < 0.5 ? common - 1 : common + 1;
      items = Array.from({ length: total }, () => ({ iconId: icon, scale: 1, count: common }));
      items[oddIndex] = { iconId: icon, scale: 1, count: Math.max(1, odd) };
      break;
    }
  }

  return { cols: s.cols, rows: s.rows, axis, items, oddIndex };
}

export { SHAPES };
