/**
 * しきつめ（ブロック分け）の生成。
 * 枠をポリオミノで全面タイリング（ランダム＋バックトラック）し、その分割を答えとする。
 * 出題は「空の枠＋つかうブロック一覧」。唯一解は不要。
 */
import type { Difficulty } from '../../types.js';
import { mulberry32, type Rng } from '../../rng.js';

export interface BlockType {
  id: string;
  /** ひらがなのラベル */
  label: string;
  /** マス数 */
  size: number;
  /** 代表形（正規形のセル集合）。凡例の絵に使う */
  shape: [number, number][];
}

export const BLOCK_TYPES: BlockType[] = [
  { id: 'domino', label: '２マス', size: 2, shape: [[0, 0], [1, 0]] },
  { id: 'i3', label: '３マス まっすぐ', size: 3, shape: [[0, 0], [1, 0], [2, 0]] },
  { id: 'l3', label: '３マス かくっと', size: 3, shape: [[0, 0], [1, 0], [0, 1]] },
  { id: 'o4', label: '４マス しかく', size: 4, shape: [[0, 0], [1, 0], [0, 1], [1, 1]] },
];

export const BLOCK_BY_ID: Record<string, BlockType> = Object.fromEntries(
  BLOCK_TYPES.map((b) => [b.id, b]),
);

export interface Region {
  id: number;
  typeId: string;
  cells: [number, number][];
}

export interface TilingData {
  cols: number;
  rows: number;
  /** region[y][x] = 領域ID */
  region: number[][];
  regions: Region[];
  inventory: { typeId: string; count: number }[];
}

interface Setting {
  cols: number;
  rows: number;
}

const SETTINGS: Record<Difficulty, Setting> = {
  easy: { cols: 4, rows: 4 },
  normal: { cols: 4, rows: 5 },
  hard: { cols: 5, rows: 5 },
};

// 各ブロックの全向き（回転・反転）を正規化して用意
interface OrientedPiece {
  typeId: string;
  cells: [number, number][];
}

const PIECES: OrientedPiece[] = buildPieces();

export function generateTiling(seed: number, difficulty: Difficulty): TilingData {
  const rng = mulberry32(seed);
  const { cols, rows } = SETTINGS[difficulty];

  // まれに行き詰まったらシードをずらして再試行
  for (let attempt = 0; attempt < 200; attempt++) {
    const result = solve(cols, rows, rng);
    if (result) return result;
  }
  // 理論上ここには来ない（小さい枠なので必ず解ける）
  throw new Error('tiling generation failed');
}

function solve(cols: number, rows: number, rng: Rng): TilingData | null {
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(-1));
  const regions: Region[] = [];

  const firstEmpty = (): [number, number] | null => {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y][x] === -1) return [x, y];
      }
    }
    return null;
  };

  const place = (anchor: [number, number]): boolean => {
    const [ax, ay] = anchor;
    for (const piece of rng.shuffle(PIECES)) {
      const abs: [number, number][] = [];
      let ok = true;
      for (const [dx, dy] of piece.cells) {
        const x = ax + dx;
        const y = ay + dy;
        if (x < 0 || y < 0 || x >= cols || y >= rows || grid[y][x] !== -1) {
          ok = false;
          break;
        }
        abs.push([x, y]);
      }
      if (!ok) continue;

      const id = regions.length;
      for (const [x, y] of abs) grid[y][x] = id;
      regions.push({ id, typeId: piece.typeId, cells: abs });

      const next = firstEmpty();
      if (!next) return true;
      if (place(next)) return true;

      // 戻す
      for (const [x, y] of abs) grid[y][x] = -1;
      regions.pop();
    }
    return false;
  };

  const start = firstEmpty();
  if (!start) return null;
  if (!place(start)) return null;

  const inventoryMap = new Map<string, number>();
  for (const r of regions) inventoryMap.set(r.typeId, (inventoryMap.get(r.typeId) ?? 0) + 1);
  const inventory = BLOCK_TYPES.filter((b) => inventoryMap.has(b.id)).map((b) => ({
    typeId: b.id,
    count: inventoryMap.get(b.id)!,
  }));

  return { cols, rows, region: grid, regions, inventory };
}

/** ブロックの全向きを生成し、スキャン順で最初のセルが (0,0) になるよう正規化 */
function buildPieces(): OrientedPiece[] {
  const pieces: OrientedPiece[] = [];
  const seen = new Set<string>();
  for (const block of BLOCK_TYPES) {
    for (const cells of orientations(block.shape)) {
      const norm = normalizeScan(cells);
      const key = block.id + ':' + keyOf(norm);
      if (seen.has(key)) continue;
      seen.add(key);
      pieces.push({ typeId: block.id, cells: norm });
    }
  }
  return pieces;
}

function orientations(shape: [number, number][]): [number, number][][] {
  const out: [number, number][][] = [];
  let cur = shape;
  for (let flip = 0; flip < 2; flip++) {
    for (let rot = 0; rot < 4; rot++) {
      out.push(cur);
      cur = cur.map(([x, y]) => [y, -x]); // 90度回転
    }
    cur = cur.map(([x, y]) => [-x, y]); // 反転
  }
  return out;
}

/** スキャン順（y→x）で最初のセルを (0,0) に合わせて平行移動 */
function normalizeScan(cells: [number, number][]): [number, number][] {
  let first = cells[0];
  for (const c of cells) {
    if (c[1] < first[1] || (c[1] === first[1] && c[0] < first[0])) first = c;
  }
  return cells.map(([x, y]) => [x - first[0], y - first[1]]);
}

function keyOf(cells: [number, number][]): string {
  return cells
    .map(([x, y]) => `${x},${y}`)
    .sort()
    .join('|');
}
