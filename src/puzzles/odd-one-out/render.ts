/**
 * なかまはずれ の描画。アイテムを格子に並べ、答えページでは
 * なかまはずれを太い赤の輪で囲む（白黒でも輪の太さで分かる）。
 */
import type { PuzzleType, PuzzleParams, GeneratedPuzzle } from '../../types.js';
import { A4, CONTENT, renderPage } from '../../layout.js';
import { rect, text, circle, el } from '../../svg.js';
import { renderIcon } from '../../icons.js';
import { generateOdd, type OddData, type OddItem } from './generate.js';

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
  const cell = Math.min(CONTENT.w / data.cols, gridH / data.rows) * 0.92;
  const ox = CONTENT.x + (CONTENT.w - cell * data.cols) / 2;
  const oy = TOP + (gridH - cell * data.rows) / 2;
  return { cell, ox, oy };
}

function cellCenter(g: Geom, i: number, data: OddData): [number, number] {
  const cx = g.ox + (i % data.cols) * g.cell + g.cell / 2;
  const cy = g.oy + Math.floor(i / data.cols) * g.cell + g.cell / 2;
  return [cx, cy];
}

/** count軸: 個数ぶんの小さな丸を並べて見せる */
function drawDots(count: number, cx: number, cy: number, cell: number): string {
  const perRow = count <= 3 ? count : Math.ceil(count / 2);
  const rowsN = Math.ceil(count / perRow);
  const r = cell * 0.07;
  const gap = cell * 0.22;
  let out = '';
  let drawn = 0;
  for (let row = 0; row < rowsN; row++) {
    const inRow = Math.min(perRow, count - drawn);
    const startX = cx - ((inRow - 1) * gap) / 2;
    const y = cy - ((rowsN - 1) * gap) / 2 + row * gap;
    for (let c = 0; c < inRow; c++) {
      out += circle(startX + c * gap, y, r, { fill: '#444', stroke: '#111', 'stroke-width': 0.5 });
      drawn++;
    }
  }
  return out;
}

function drawItem(item: OddItem, cx: number, cy: number, cell: number): string {
  if (item.count !== undefined) {
    return drawDots(item.count, cx, cy, cell);
  }
  return renderIcon(item.iconId, cx, cy, cell * 0.5 * item.scale);
}

function drawGrid(data: OddData, showAnswer: boolean): string {
  const g = geomOf(data);
  let out = '';
  data.items.forEach((item, i) => {
    const x = g.ox + (i % data.cols) * g.cell;
    const y = g.oy + Math.floor(i / data.cols) * g.cell;
    out += rect({ x: x + 1, y: y + 1, width: g.cell - 2, height: g.cell - 2, rx: 3, fill: '#fff', stroke: '#bbb', 'stroke-width': 0.6 });
    const [cx, cy] = cellCenter(g, i, data);
    out += drawItem(item, cx, cy, g.cell);
  });

  if (showAnswer) {
    const [cx, cy] = cellCenter(g, data.oddIndex, data);
    out += el('ellipse', {
      cx,
      cy,
      rx: g.cell * 0.42,
      ry: g.cell * 0.42,
      fill: 'none',
      stroke: RING,
      'stroke-width': g.cell * 0.05,
    });
    out += text('ここ', { x: cx, y: cy + g.cell * 0.42 + 6, 'font-size': 5, 'font-weight': 'bold', 'text-anchor': 'middle', fill: RING });
  }
  return out;
}

const TITLE = 'なかまはずれ';
const HOWTO = '1つだけ ちがう なかまが あるよ。みつけて ○で かこもう。';

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
