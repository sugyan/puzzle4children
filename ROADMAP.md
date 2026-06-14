# Status & Roadmap

A generator of "find-the-pattern" educational puzzles for young children
(~6 years old, 1st grade), printed on A4 and solved with a pencil.

## Current status (implemented)

Core infrastructure and two puzzle types are complete and verified.

### Infrastructure
- **Vite + TypeScript** static site, hand-written SVG only (no chart/icon libraries).
- `src/types.ts` — shared `PuzzleType` / `PuzzleParams` / `GeneratedPuzzle` interfaces.
- `src/rng.ts` — seeded RNG (mulberry32). All generation is reproducible from a seed.
- `src/svg.ts`, `src/layout.ts` — string-based SVG helpers and A4 page layout (mm units).
- `src/icons.ts` — custom SVG icon set (circle, square, triangle, star, heart, moon,
  diamond, flower). **Distinguishable by silhouette alone**, so they survive black & white printing.
- `src/puzzles/registry.ts` — plugin registry; add a puzzle with one line.
- `src/main.ts` + `index.html` + `src/style.css` — UI (type / difficulty / count / seed),
  on-screen output, and `@media print` (hide controls, A4 page breaks, problems then answers).

### Puzzle 1: きまりめいろ (Rule Maze) — done
- N×N grid (easy 5 / normal 6 / hard 7). A self-avoiding walk from top-left to bottom-right
  carries the cycle pattern `cycle[i % k]` (k = 2 / 3 / 4). Remaining cells filled with the same
  icon set. Branches allowed (no unique-solution requirement).
- Answer page highlights the path in color **plus step numbers and a thick line** (B&W-safe).

### Puzzle 2: しきつめ (Tiling) — done
- Frame (easy 4×4 / normal 4×5 / hard 5×5) fully tiled with polyominoes
  (domino, straight-tromino, L-tromino, 2×2 square) via randomized backtracking.
- Problem shows the empty frame + "blocks to use" inventory (shape + count).
- Answer colors each region and adds **thick region borders + region numbers** (B&W-safe).

### Verification
- `npm run build` — type-check + production build, clean.
- `npm test` (`scripts/smoke.ts`) — asserts maze path validity (self-avoiding, adjacent,
  start/goal, pattern follows cycle), full tiling coverage (every cell once, region shapes
  match block type), and reproducibility (same seed → same puzzle; different seed → different).
- Visually confirmed in-browser for both types across all difficulties.

### Known limitations / possible polish
- Maze path length is controlled by a `minLen` heuristic with a search budget; very long
  Hamiltonian-like paths are not guaranteed (acceptable — uniqueness is not required).
- Tiling block variety is fixed to four shapes; no control over the block mix per difficulty.
- Print sizing relies on the browser's "A4 / no margins" setting; not auto-forced.
- No automated visual/print regression tests (only logic-level smoke tests).

## Candidate puzzles (not yet implemented)

Each can be added by implementing `PuzzleType` and registering it in `registry.ts`.
Listed roughly easiest-to-build first. All must keep: pencil-only solving, self-verifiable,
hiragana, seeded/reproducible, B&W-printable.

### High priority — strong pattern-finding fit, easy to generate
1. **パターンのつづき (Continue the pattern)**
   A row/grid of icons following a periodic or simple-progression rule, with the last few
   cells blank for the child to fill. Self-check: the rule repeats. Trivial generator
   (reuse `icons.ts` + cycle logic from rule-maze).
2. **なかまはずれ (Odd one out)**
   A small set of items sharing an attribute (shape/count/color-as-hatching/orientation)
   with exactly one that differs; circle the odd one. Generator picks an attribute axis and
   one outlier. Self-check is immediate.
3. **てんつなぎ (Connect the dots, by number or pattern order)**
   Numbered (or pattern-ordered) dots that form a picture when connected in order.
   Reuses SVG line drawing; answer page shows the completed outline. Pattern-order variant
   (e.g. ●→■→▲→…) reinforces sequence skills like the maze.

### Medium priority — needs a bit more generation logic
4. **あみだくじ (Ghost-leg / Amidakuji)**
   Vertical lines with random horizontal rungs; follow a line top-to-bottom to reach a goal.
   Generate rungs, compute the resulting permutation for the answer key. Self-check by tracing.
5. **まちがいさがし (Spot the difference)**
   Generate one scene from icons on a grid, duplicate it, then mutate K cells (swap/remove/move).
   Answer marks the differences. Needs a compact, legibly-printable scene layout.
6. **かずのみち / すごろく型 (Number path)**
   Step through a grid following a numeric rule (+1, +2, skip-counting); trace the path whose
   numbers obey the rule. Blends the maze idea with early counting.

### Lower priority — heavier or closer to "logic" than "pattern"
7. **ぬりえパターン (Pattern coloring / pixel rule)**
   Fill cells per a key (e.g. "color every cell with a ★") to reveal a picture. Color-by-symbol
   keeps it B&W-friendly. Generator hides a bitmap behind a symbol grid.
8. **みちつくり (Pipe/path connection)**
   Connect matching pairs across a grid without crossing. More puzzle-like; generation and
   the no-crossing constraint are more involved, and self-verification is weaker.

## Extension notes
- Keep generators deterministic: take all randomness from `mulberry32(seed)` only.
- Reuse `icons.ts`, `layout.ts` (CONTENT box), and the page frame in `layout.ts::renderPage`.
- Always provide a B&W-readable answer cue (numbers / hatching / thick borders), not color alone.
- Add a smoke check in `scripts/smoke.ts` for any new generator (validity + reproducibility).
