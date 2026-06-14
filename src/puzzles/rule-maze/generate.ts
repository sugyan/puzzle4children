/**
 * きまりめいろの生成。
 * スタート(0,0)→ゴール(N-1,N-1) の自己回避ウォークを引き、経路上のマス i に
 * cycle[i % k] を置く（=正解パス）。残りのマスは同じ記号集合からランダムに埋める。
 * 唯一解は不要（分岐があってもよい）。
 */
import type { Difficulty } from '../../types.js';
import type { Rng } from '../../rng.js';
import { mulberry32 } from '../../rng.js';
import { pickIconSet } from '../../icons.js';

export interface MazeData {
  n: number;
  /** grid[y][x] = アイコンID */
  grid: string[][];
  /** 正解パス（スタートからゴールまでの座標列） */
  path: [number, number][];
  /** 周期パターン（アイコンIDの並び） */
  cycle: string[];
}

interface Setting {
  n: number;
  k: number;
  minLen: number;
}

const SETTINGS: Record<Difficulty, Setting> = {
  easy: { n: 5, k: 2, minLen: 11 },
  normal: { n: 6, k: 3, minLen: 17 },
  hard: { n: 7, k: 4, minLen: 25 },
};

const DIRS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function generateMaze(seed: number, difficulty: Difficulty): MazeData {
  const rng = mulberry32(seed);
  const { n, k, minLen } = SETTINGS[difficulty];

  const path = findPath(n, minLen, rng);
  const cycle = pickIconSet(k).map((i) => i.id);

  // グリッドを全マス埋める（まずはランダム）
  const grid: string[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => rng.pick(cycle)),
  );

  // 正解パスに周期パターンを上書き
  path.forEach(([x, y], i) => {
    grid[y][x] = cycle[i % k];
  });

  return { n, grid, path, cycle };
}

/**
 * (0,0)→(n-1,n-1) の自己回避ウォークを探す。
 * 長さ minLen 以上の経路を優先（難易度＝経路長）。
 * 予算内に見つからなければ、それまでに見つかった最長の経路を返す。
 */
function findPath(n: number, minLen: number, rng: Rng): [number, number][] {
  const visited = new Uint8Array(n * n);
  const stack: [number, number][] = [];
  const idx = (x: number, y: number) => y * n + x;
  let budget = 400000;
  let best: [number, number][] | null = null;

  const dfs = (x: number, y: number): boolean => {
    if (budget-- <= 0) return false;
    visited[idx(x, y)] = 1;
    stack.push([x, y]);

    if (x === n - 1 && y === n - 1) {
      if (stack.length >= minLen) return true;
      if (!best || stack.length > best.length) best = stack.slice();
      visited[idx(x, y)] = 0;
      stack.pop();
      return false;
    }

    for (const [dx, dy] of rng.shuffle(DIRS)) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
      if (visited[idx(nx, ny)]) continue;
      if (dfs(nx, ny)) return true;
    }

    visited[idx(x, y)] = 0;
    stack.pop();
    return false;
  };

  if (dfs(0, 0)) return stack.slice();
  if (best) return best;

  // 最終手段: スネーク経路（奇数Nではゴールに到達する）
  return snakePath(n);
}

function snakePath(n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let y = 0; y < n; y++) {
    if (y % 2 === 0) {
      for (let x = 0; x < n; x++) out.push([x, y]);
    } else {
      for (let x = n - 1; x >= 0; x--) out.push([x, y]);
    }
  }
  return out;
}
