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

### Puzzle 2: パターンのつづき (Continue the Pattern) — done
- Several rows, each a periodic pattern of period k (easy 2 / normal 2–3 / hard 3–4).
  At least two full periods are shown, then the last cells are blanked (dashed box + faint "?")
  for the child to draw. Icons restricted to simple, easy-to-draw shapes.
- Answer fills each blank with the correct icon on a highlighted (yellow) cell. Self-checking:
  the rule repeats.

### Puzzle 3: なかまはずれ (Odd One Out) — done
- A grid of items (easy 3×2 / normal & hard 3×3). Exactly one differs along a single axis:
  **shape**, **size**, or **count** (dots). Difficulty selects the axis and how subtle the
  difference is (e.g. hard count uses 4–6 dots differing by one). Child circles the odd one.
- Answer rings the odd cell with a thick red ellipse (B&W-safe). Self-checking: only one differs.

### Puzzle 4: しきつめ (Tiling) — done, but de-emphasized
- Frame (easy 4×4 / normal 4×5 / hard 5×5) fully tiled with polyominoes
  (domino, straight-tromino, L-tromino, 2×2 square) via randomized backtracking.
- Problem shows the empty frame + "blocks to use" inventory (shape + count).
- Answer colors each region and adds **thick region borders + region numbers** (B&W-safe).
- **Note:** in practice this is hard for 1st graders on paper — without physically moving
  pieces, reverse-engineering the partition is demanding. Kept available but listed last in
  the registry. Future ideas: pre-fill some block boundaries as hints, or shrink to a fixed
  small block set per sheet.

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

### Medium priority — needs a bit more generation logic
1. **あみだくじ (Ghost-leg / Amidakuji) — needs a twist**
   Plain "trace a line to the goal" is not very interesting on its own. Twist ideas to make it
   a pattern/reasoning task: (a) **collect-and-check** — place icons along the legs; the child
   traces and writes down the sequence they collect, then checks it against a target pattern;
   (b) **reverse** — given a goal, find which start reaches it; (c) **rule rungs** — only cross
   a rung if it matches a rule. Generator builds rungs and computes the permutation for the key.
2. **まちがいさがし (Spot the difference)**
   Generate one scene from icons on a grid, duplicate it, then mutate K cells (swap/remove/move).
   Answer marks the differences. Needs a compact, legibly-printable scene layout.
3. **かずのみち / すごろく型 (Number path)**
   Step through a grid following a numeric rule (+1, +2, skip-counting); trace the path whose
   numbers obey the rule. Blends the maze idea with early counting.

### Lower priority — heavier or closer to "logic" than "pattern"
4. **ぬりえパターン (Pattern coloring / pixel rule)**
   Fill cells per a key (e.g. "color every cell with a ★") to reveal a picture. Color-by-symbol
   keeps it B&W-friendly. Generator hides a bitmap behind a symbol grid.
5. **みちつくり (Pipe/path connection)**
   Connect matching pairs across a grid without crossing. More puzzle-like; generation and
   the no-crossing constraint are more involved, and self-verification is weaker.

### Considered but dropped
- **てんつなぎ (Connect the dots)** — making a *recognizable* picture from dots requires
  authored artwork; auto-generating something a child recognizes is hard. Revisit only with a
  curated shape library.

## Extension notes
- Keep generators deterministic: take all randomness from `mulberry32(seed)` only.
- Reuse `icons.ts`, `layout.ts` (CONTENT box), and the page frame in `layout.ts::renderPage`.
- Always provide a B&W-readable answer cue (numbers / hatching / thick borders), not color alone.
- Add a smoke check in `scripts/smoke.ts` for any new generator (validity + reproducibility).
