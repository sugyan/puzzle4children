/**
 * 利用可能なパズルジェネレータ一覧。
 * 新しいパズルは PuzzleType を実装し、ここに1行追加するだけで増やせる。
 */
import type { PuzzleType } from '../types.js';
import { ruleMaze } from './rule-maze/render.js';
import { patternNext } from './pattern-next/render.js';
import { oddOneOut } from './odd-one-out/render.js';
import { tiling } from './tiling/render.js';

export const puzzles: PuzzleType[] = [ruleMaze, patternNext, oddOneOut, tiling];
