/**
 * なかまはずれ の描画。各マスに複数図形のカードを並べ、答えページでは
 * なかまはずれを太い赤の輪で囲む（白黒でも輪の太さで分かる）。
 */
import type { PuzzleType, PuzzleParams, GeneratedPuzzle } from '../../types.js';
import { A4, CONTENT, renderPage } from '../../layout.js';
import { rect, text, el } from '../../svg.js';
import { renderIcon } from '../../icons.js';
import { generateOdd, type OddData, type Card } from './generate.js';

const TOP = 60;
const BOTTOM = A4.h - A4.margin - 6;
const RING = '#e74c3c';

interface Geom {
  cell: number;
  ox: number;
  oy: number;
}

function geomOf(data: OddData): Geom {
  const gridH = BOTTOM - TOP;
  const cell = Math.min(CONTENT.w / data.cols, gridH / data.rows) * 0.94;
  const ox = CONTENT.x + (CONTENT.w - cell * data.cols) / 2;
  const oy = TOP + (gridH - cell * data.rows) / 2;
  return { cell, ox, oy };
}

function cellPos(g: Geom, i: number, data: OddData): { x: number; y: number; cx: number; cy: number } {
  const x = g.ox + (i % data.cols) * g.cell;
  const y = g.oy + Math.floor(i / data.cols) * g.cell;
  return { x, y, cx: x + g.cell / 2, cy: y + g.cell / 2 };
}

/** カード（複数図形を横に並べる） */
function drawCard(card: Card, x: number, y: number, cell: number): string {
  const m = card.shapes.length;
  const innerW = cell * 0.88;
  const slot = innerW / m;
  const mini = Math.min(slot * 0.82, cell * 0.46);
  const cy = y + cell / 2;
  let out = '';
  card.shapes.forEach((id, k) => {
    const cx = x + (cell - innerW) / 2 + slot * (k + 0.5);
    out += renderIcon(id, cx, cy, mini);
  });
  return out;
}

function drawGrid(data: OddData, showAnswer: boolean): string {
  const g = geomOf(data);
  let out = '';
  data.cards.forEach((card, i) => {
    const { x, y } = cellPos(g, i, data);
    out += rect({ x: x + 1, y: y + 1, width: g.cell - 2, height: g.cell - 2, rx: 3, fill: '#fff', stroke: '#bbb', 'stroke-width': 0.6 });
    out += drawCard(card, x, y, g.cell);
  });

  if (showAnswer) {
    const { cx, cy } = cellPos(g, data.oddIndex, data);
    out += el('ellipse', {
      cx,
      cy,
      rx: g.cell * 0.5,
      ry: g.cell * 0.42,
      fill: 'none',
      stroke: RING,
      'stroke-width': g.cell * 0.05,
    });
    out += text('ここ', { x: cx, y: y2(g, data) , 'font-size': 5, 'font-weight': 'bold', 'text-anchor': 'middle', fill: RING });
  }
  return out;
}

function y2(g: Geom, data: OddData): number {
  const { cy } = cellPos(g, data.oddIndex, data);
  return cy + g.cell * 0.42 + 5;
}

const TITLE = 'なかまはずれ';
const HOWTO = 'ほかと ちがう カードが 1まい あるよ。よく みて ○で かこもう。';

export const oddOneOut: PuzzleType = {
  id: 'odd-one-out',
  name: 'なかまはずれ',
  generate(params: PuzzleParams): GeneratedPuzzle {
    const data = generateOdd(params.seed, params.difficulty);
    return {
      svgProblem: renderPage({ title: TITLE, howto: HOWTO, seed: params.seed, body: drawGrid(data, false) }),
      svgAnswer: renderPage({
        title: TITLE,
        howto: 'あかい ○が なかまはずれだよ。',
        seed: params.seed,
        badge: 'こたえ',
        body: drawGrid(data, true),
      }),
      title: TITLE,
      howto: HOWTO,
    };
  },
};
