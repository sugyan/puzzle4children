import { generateMaze } from '../src/puzzles/rule-maze/generate.js';
import { generateTiling, BLOCK_BY_ID } from '../src/puzzles/tiling/generate.js';
import { generatePattern } from '../src/puzzles/pattern-next/generate.js';
import { generateOdd } from '../src/puzzles/odd-one-out/generate.js';
import { puzzles } from '../src/puzzles/registry.js';
import type { Difficulty } from '../src/types.js';

const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];
let failures = 0;
const fail = (m: string) => {
  console.error('  FAIL: ' + m);
  failures++;
};

// ---- rule-maze ----
for (const d of difficulties) {
  for (let s = 0; s < 30; s++) {
    const m = generateMaze(s, d);
    const { n, grid, path, cycle } = m;
    // start/goal
    if (path[0][0] !== 0 || path[0][1] !== 0) fail(`maze ${d} seed${s}: path not start at 0,0`);
    if (path[path.length - 1][0] !== n - 1 || path[path.length - 1][1] !== n - 1)
      fail(`maze ${d} seed${s}: path not end at goal`);
    // connectivity + self-avoiding
    const seen = new Set<string>();
    for (let i = 0; i < path.length; i++) {
      const [x, y] = path[i];
      if (x < 0 || y < 0 || x >= n || y >= n) fail(`maze ${d} seed${s}: out of bounds`);
      const key = `${x},${y}`;
      if (seen.has(key)) fail(`maze ${d} seed${s}: revisits cell (not self-avoiding)`);
      seen.add(key);
      if (i > 0) {
        const [px, py] = path[i - 1];
        if (Math.abs(px - x) + Math.abs(py - y) !== 1) fail(`maze ${d} seed${s}: not adjacent step`);
      }
      // pattern follows cycle
      if (grid[y][x] !== cycle[i % cycle.length]) fail(`maze ${d} seed${s}: pattern mismatch at step ${i}`);
    }
  }
}

// ---- tiling ----
for (const d of difficulties) {
  for (let s = 0; s < 30; s++) {
    const t = generateTiling(s, d);
    const { cols, rows, region, regions } = t;
    // full cover exactly once
    const cover = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (const r of regions) {
      const block = BLOCK_BY_ID[r.typeId];
      if (r.cells.length !== block.size) fail(`tiling ${d} seed${s}: region ${r.id} size mismatch`);
      for (const [x, y] of r.cells) {
        cover[y][x]++;
        if (region[y][x] !== r.id) fail(`tiling ${d} seed${s}: region map mismatch`);
      }
    }
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++)
        if (cover[y][x] !== 1) fail(`tiling ${d} seed${s}: cell ${x},${y} covered ${cover[y][x]}x`);
  }
}

// ---- pattern-next ----
for (const d of difficulties) {
  for (let s = 0; s < 30; s++) {
    const p = generatePattern(s, d);
    for (const row of p.rows) {
      if (row.blanks < 1) fail(`pattern ${d} seed${s}: no blanks`);
      const visible = row.cells.length - row.blanks;
      if (visible < 2 * row.period) fail(`pattern ${d} seed${s}: fewer than 2 periods shown`);
      // 周期性: cells[i] は cells[i % period] と一致
      for (let i = 0; i < row.cells.length; i++) {
        if (row.cells[i] !== row.cells[i % row.period]) fail(`pattern ${d} seed${s}: not periodic`);
      }
      // 1周期に2種類以上
      const baseSet = new Set(row.cells.slice(0, row.period));
      if (baseSet.size < 2) fail(`pattern ${d} seed${s}: base not varied`);
    }
  }
}

// ---- odd-one-out ----
for (const d of difficulties) {
  for (let s = 0; s < 30; s++) {
    const o = generateOdd(s, d);
    if (o.oddIndex < 0 || o.oddIndex >= o.items.length) fail(`odd ${d} seed${s}: bad oddIndex`);
    const sig = (it: (typeof o.items)[number]) => `${it.iconId}|${it.scale}|${it.count ?? '-'}`;
    const oddSig = sig(o.items[o.oddIndex]);
    let differing = 0;
    o.items.forEach((it, i) => {
      if (i === o.oddIndex) return;
      if (sig(it) === oddSig) fail(`odd ${d} seed${s}: a normal item matches the odd one`);
    });
    // なかまはずれ以外はすべて同じ特徴
    const commonSig = sig(o.items[(o.oddIndex + 1) % o.items.length]);
    o.items.forEach((it, i) => {
      if (i === o.oddIndex) {
        if (sig(it) === commonSig) fail(`odd ${d} seed${s}: odd item not different`);
      } else {
        if (sig(it) !== commonSig) differing++;
      }
    });
    if (differing !== 0) fail(`odd ${d} seed${s}: more than one differs`);
  }
}

// ---- 再現性: 同じシードで同じ問題 ----
for (const p of puzzles) {
  const a = p.generate({ seed: 12345, difficulty: 'normal' });
  const b = p.generate({ seed: 12345, difficulty: 'normal' });
  if (a.svgProblem !== b.svgProblem || a.svgAnswer !== b.svgAnswer)
    fail(`${p.id}: not reproducible for same seed`);
  const c = p.generate({ seed: 12346, difficulty: 'normal' });
  if (a.svgProblem === c.svgProblem) fail(`${p.id}: different seed produced identical problem`);
}

if (failures === 0) console.log('ALL CHECKS PASSED');
else {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
