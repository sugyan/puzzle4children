/**
 * なかまはずれ の生成。
 * 各マスは複数の図形を並べた「カード」。すべて同じカードのうち、1枚だけが違う。
 * 違いは (a) 1つの図形が別物に変わる(replace) か (b) 2つの並び順が入れ替わる(swap)。
 * じっくり見比べないと分からないようにし、選択肢数も難易度で増やす。
 */
import type { Difficulty } from '../../types.js';
import { mulberry32, type Rng } from '../../rng.js';

export type Mutation = 'replace' | 'swap';

export interface Card {
  /** 左から並ぶ図形ID */
  shapes: string[];
}

export interface OddData {
  cols: number;
  rows: number;
  mutation: Mutation;
  cards: Card[]; // row-major
  oddIndex: number;
}

const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'moon', 'flower'];

interface Setting {
  cols: number;
  rows: number;
  /** 1カードあたりの図形数 */
  m: number;
  mutations: Mutation[];
}

const SETTINGS: Record<Difficulty, Setting> = {
  easy: { cols: 3, rows: 2, m: 2, mutations: ['replace'] },
  normal: { cols: 3, rows: 3, m: 3, mutations: ['replace'] },
  hard: { cols: 4, rows: 3, m: 4, mutations: ['replace', 'swap'] },
};

export function generateOdd(seed: number, difficulty: Difficulty): OddData {
  const rng = mulberry32(seed);
  const s = SETTINGS[difficulty];
  const total = s.cols * s.rows;
  const oddIndex = rng.int(total);
  const mutation = rng.pick(s.mutations);

  const template = makeTemplate(rng, s.m);
  const odd = mutate(rng, template, mutation);

  const cards: Card[] = Array.from({ length: total }, () => ({ shapes: template.slice() }));
  cards[oddIndex] = { shapes: odd };

  return { cols: s.cols, rows: s.rows, mutation, cards, oddIndex };
}

/** 2種類以上の図形を含むテンプレートを作る（swap が成立するように） */
function makeTemplate(rng: Rng, m: number): string[] {
  for (let t = 0; t < 100; t++) {
    const tpl = Array.from({ length: m }, () => rng.pick(SHAPES));
    if (new Set(tpl).size >= 2) return tpl;
  }
  return SHAPES.slice(0, m);
}

function mutate(rng: Rng, tpl: string[], mutation: Mutation): string[] {
  const odd = tpl.slice();
  if (mutation === 'swap') {
    const pairs: [number, number][] = [];
    for (let i = 0; i < tpl.length; i++) {
      for (let j = i + 1; j < tpl.length; j++) {
        if (tpl[i] !== tpl[j]) pairs.push([i, j]);
      }
    }
    const [i, j] = rng.pick(pairs);
    [odd[i], odd[j]] = [odd[j], odd[i]];
  } else {
    const slot = rng.int(tpl.length);
    const cur = tpl[slot];
    odd[slot] = rng.pick(SHAPES.filter((x) => x !== cur));
  }
  return odd;
}

export { SHAPES };
