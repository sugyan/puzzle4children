# CLAUDE.md

Project context for Claude Code. Covers the concept, conventions, current status,
and candidate puzzles. (User-facing usage docs live in [README.md](README.md).)

## Concept

A web tool that **auto-generates "find-the-pattern" educational puzzles** for young
children (~6 years old, 1st grade), printed on A4 and solved with a pencil.

Design principles (these are requirements, not preferences):

- **Print-first.** A static site generates puzzles on screen; the browser's print
  (`window.print()`, `@media print`) outputs A4 (or PDF). Solved on paper with a pencil
  only — no cutting, no manipulatives.
- **Self-verifiable over unique.** Solutions need not be unique. What matters is that a
  child can produce an answer and **check for themselves** that it satisfies the rule.
- **Mechanical & reproducible.** Everything is generated from a seed; the same seed
  reproduces the same puzzle. All randomness comes from `mulberry32(seed)` only.
- **Hiragana, no kanji.** All on-sheet text is hiragana. Symbols are inline SVG icons
  (not emoji), chosen so they are **distinguishable by silhouette alone** and survive
  **black & white printing**.
- **Low cognitive load.** Pattern/rule spotting, not heavy calculation or logic.

## Tech stack & architecture

Vite + TypeScript, vanilla (no framework). Drawing is hand-written SVG strings — no
chart or icon libraries. Dependencies kept minimal.

```
src/
├─ main.ts              # UI wiring: type select → generate → on-screen output → print
├─ types.ts             # shared interfaces
├─ rng.ts               # seeded RNG (mulberry32) — the ONLY source of randomness
├─ svg.ts               # string-based SVG helpers
├─ icons.ts             # custom B&W-friendly SVG icon set
├─ layout.ts            # A4 page layout (mm units); renderPage() + CONTENT box
├─ style.css            # screen + @media print
└─ puzzles/
   ├─ registry.ts       # PuzzleType[] — add a puzzle with one line
   └─ <puzzle>/{generate.ts, render.ts}
scripts/smoke.ts        # logic-level correctness + reproducibility checks (npm test)
```

Plugin model — every puzzle implements `PuzzleType`:

```ts
type Difficulty = 'easy' | 'normal' | 'hard';
interface PuzzleParams { seed: number; difficulty: Difficulty; }
interface GeneratedPuzzle { svgProblem: string; svgAnswer: string; title: string; howto: string; }
interface PuzzleType {
  id: string;            // e.g. 'rule-maze'
  name: string;          // e.g. 'きまりめいろ'
  generate(params: PuzzleParams): GeneratedPuzzle;
}
```

`generate(seed, difficulty)` lives in `generate.ts` (pure data); `render.ts` turns that
data into problem/answer SVG and exports the `PuzzleType`. The UI emits all problem pages
first, then all answer pages; each page is A4 with the seed printed small in a corner.

## Conventions for adding a puzzle

1. Implement `generate.ts` + `render.ts`, then add one line to `registry.ts`.
2. **Determinism:** take all randomness from `mulberry32(seed)`. No `Math.random`.
3. **Reuse:** `icons.ts` (and `pickIconSet`), `layout.ts` `CONTENT` box + `renderPage`,
   `svg.ts` helpers.
4. **B&W-safe answers:** never rely on color alone. Add a redundant cue — step numbers,
   thick borders/lines, hatching, or a ring.
5. **Self-verifiable:** the child must be able to confirm their own answer against the rule.
6. **Hiragana** for all on-sheet text; no kanji.
7. Add a smoke check in `scripts/smoke.ts` (structural validity + reproducibility) for any
   new generator.

## Implemented puzzles

Registry order is intentional (most child-friendly first; tiling last).

### きまりめいろ (Rule Maze)
N×N grid (easy 5 / normal 6 / hard 7). A self-avoiding walk start→goal carries the cycle
pattern `cycle[i % k]` (k = 2 / 3 / 4); other cells filled from the same icon set. Branches
allowed. Answer highlights the path with color **+ step numbers + a thick line**.

### パターンのつづき (Continue the Pattern)
Several rows, **each a different rule kind** so it isn't monotonous, modeled as a `CellSpec`
union (icon/count/rot/size):
- `repeat` — periodic icon cycle (period 2–4)
- `rotate` — an arrow turning ±90° per step (one full turn shown)
- `grow` — increasing dot count (+1 or +2), e.g. 1, 3, 5, …
- `size` — a shape cycling small/big (small/med/big on hard)

Last cells blanked (dashed box + faint "?") for the child to draw; answer fills them on a
yellow background.

### なかまはずれ (Odd One Out)
Each cell is a **card = a row of several shapes** (easy 2 / normal 3 / hard 4). All cards are
identical except one, differing by `replace` (one shape changed) or, on hard, `swap` (two
positions exchanged — same shapes, subtler). Grid grows with difficulty (3×2 / 3×3 / 4×3 =
12), making it a careful side-by-side comparison. Answer rings the odd card in red.

### しきつめ (Tiling) — de-emphasized
Frame (easy 4×4 / normal 4×5 / hard 5×5) fully tiled with polyominoes (domino,
straight-tromino, L-tromino, 2×2 square) by randomized backtracking; problem shows the empty
frame + "blocks to use" inventory; answer colors regions with **thick borders + numbers**.
**Note:** hard for 1st graders on paper (reverse-engineering a partition without moving
pieces). Kept but listed last. Future: pre-fill some boundaries as hints, or a fixed small
block set per sheet.

## Candidate puzzles (not yet implemented)

Add by implementing `PuzzleType`. All must stay pencil-only, self-verifiable, hiragana,
seeded, B&W-printable.

**Medium priority**
- **あみだくじ (Amidakuji) — needs a twist.** Plain "trace to the goal" is dull. Twists:
  (a) *collect-and-check* — icons along the legs; the child writes the collected sequence and
  checks it against a target pattern; (b) *reverse* — given a goal, find the start; (c) *rule
  rungs* — only cross a rung if it matches a rule. Generator computes the permutation for the key.
- **まちがいさがし (Spot the difference).** One icon-grid scene duplicated, then K cells mutated
  (swap/remove/move). Answer marks the differences. Needs a compact, legible scene layout.
- **かずのみち (Number path).** Step through a grid following a numeric rule (+1, +2, skip-count);
  trace the path whose numbers obey the rule. Blends the maze with early counting.

**Lower priority** (heavier, or closer to "logic" than "pattern")
- **ぬりえパターン (Pattern coloring).** Fill cells per a key (e.g. "color every ★") to reveal a
  picture; color-by-symbol stays B&W-friendly.
- **みちつくり (Pipe/path connection).** Connect matching pairs without crossing. More puzzle-like;
  harder to generate, weaker self-verification.

**Dropped**
- **てんつなぎ (Connect the dots).** A recognizable picture needs authored artwork; hard to
  auto-generate. Revisit only with a curated shape library.

## Commands

```bash
npm run dev      # dev server (root '/')
npm run build    # tsc + vite build → dist/  (BASE_PATH env sets the base path)
npm test         # scripts/smoke.ts: structural validity + reproducibility
```

Deploy: push to `main` → GitHub Actions builds and publishes to GitHub Pages.
`BASE_PATH=/<repo>/` is passed from the repo name, so a fork works unchanged.

## Known limitations

- Maze path length uses a `minLen` heuristic with a search budget; very long paths aren't
  guaranteed (fine — uniqueness isn't required).
- Tiling block variety is fixed (four shapes); no per-difficulty block-mix control.
- Print sizing relies on the browser's "A4 / no margins" setting; not auto-forced.
- Only logic-level smoke tests; no automated visual/print regression tests.
