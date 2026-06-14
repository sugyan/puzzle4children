import { generateMaze } from '../src/puzzles/rule-maze/generate.js';
import { generateTiling, BLOCK_BY_ID } from '../src/puzzles/tiling/generate.js';
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
