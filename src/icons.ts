/**
 * 白黒印刷でも形のシルエットで区別できる自作アイコンセット。
 * 各アイコンは 100x100 の座標系（中心 50,50）で定義し、renderIcon で
 * 任意の位置・サイズに配置する。色には依存せず、形だけで識別できる。
 */
import { el } from './svg.js';

export interface IconDef {
  id: string;
  /** ひらがなの名前（凡例・読み上げ用） */
  label: string;
  /** 100x100 座標系で描いた中身（stroke/fill は renderIcon 側で付与） */
  inner: string;
}

// 5つの頂点を持つ星（外半径38 / 内半径15, 中心50,50）
const STAR_POINTS = [
  [50, 12],
  [58.8, 37.9],
  [86.1, 38.3],
  [64.3, 54.6],
  [72.3, 80.7],
  [50, 65],
  [27.7, 80.7],
  [35.7, 54.6],
  [13.9, 38.3],
  [41.2, 37.9],
]
  .map((p) => p.join(','))
  .join(' ');

// 花の5枚の花びら（中心から半径22の位置に円）
const FLOWER_PETALS = [
  [50, 28],
  [70.9, 43.2],
  [62.9, 67.8],
  [37.1, 67.8],
  [29.1, 43.2],
];

export const ICONS: IconDef[] = [
  {
    id: 'circle',
    label: 'まる',
    inner: `<circle cx="50" cy="50" r="34"/>`,
  },
  {
    id: 'square',
    label: 'しかく',
    inner: `<rect x="18" y="18" width="64" height="64" rx="6"/>`,
  },
  {
    id: 'triangle',
    label: 'さんかく',
    inner: `<polygon points="50,16 84,82 16,82"/>`,
  },
  {
    id: 'star',
    label: 'ほし',
    inner: `<polygon points="${STAR_POINTS}"/>`,
  },
  {
    id: 'heart',
    label: 'はーと',
    inner: `<path d="M50 82 C 14 54, 22 24, 42 26 C 48 27, 50 33, 50 38 C 50 33, 52 27, 58 26 C 78 24, 86 54, 50 82 Z"/>`,
  },
  {
    id: 'moon',
    label: 'つき',
    inner: `<path d="M60 14 A 38 38 0 1 0 60 86 A 30 30 0 1 1 60 14 Z"/>`,
  },
  {
    id: 'diamond',
    label: 'ひしがた',
    inner: `<polygon points="50,12 88,50 50,88 12,50"/>`,
  },
  {
    id: 'flower',
    label: 'はな',
    inner:
      FLOWER_PETALS.map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="15"/>`).join('') +
      `<circle cx="50" cy="50" r="13"/>`,
  },
];

export const ICON_BY_ID: Record<string, IconDef> = Object.fromEntries(
  ICONS.map((i) => [i.id, i]),
);

/** 先頭から k 個のアイコンを返す（難易度に応じた種類数） */
export function pickIconSet(k: number): IconDef[] {
  return ICONS.slice(0, k);
}

/**
 * アイコンを (cx,cy) を中心に size 幅で描画する。
 * fill / stroke は色に頼らず、黒線＋淡いグレー塗りを既定とする。
 */
export function renderIcon(
  id: string,
  cx: number,
  cy: number,
  size: number,
  opts: { fill?: string; stroke?: string } = {},
): string {
  const def = ICON_BY_ID[id];
  if (!def) return '';
  const fill = opts.fill ?? '#e8e8e8';
  const stroke = opts.stroke ?? '#111';
  const scale = size / 100;
  return el(
    'g',
    {
      transform: `translate(${round(cx - size / 2)} ${round(cy - size / 2)}) scale(${round(scale)})`,
      fill,
      stroke,
      'stroke-width': 5,
      'stroke-linejoin': 'round',
    },
    def.inner,
  );
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
