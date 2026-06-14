/**
 * パターンのつづき の描画。行ごとに違うルール（繰り返し・回転・数の増加・大小）を描く。
 * 答えページでは空白に正解を淡くハイライトして埋める。
 */
import type { PuzzleType, PuzzleParams, GeneratedPuzzle } from '../../types.js';
import { A4, CONTENT, renderPage } from '../../layout.js';
import { rect, text, line, polygon, circle, el } from '../../svg.js';
import { renderIcon } from '../../icons.js';
import { generatePattern, type PatternData, type CellSpec } from './generate.js';

const TOP = 56;
const BOTTOM = A4.h - A4.margin;
const HILITE = '#fff3c4';

function drawArrow(cx: number, cy: number, size: number, deg: number): string {
  const half = size / 2;
  const shaft = line(cx, cy + half * 0.75, cx, cy - half * 0.05, {
    stroke: '#111',
    'stroke-width': size * 0.13,
    'stroke-linecap': 'round',
  });
  const head = polygon(
    `${cx},${cy - half} ${cx - size * 0.3},${cy - half * 0.18} ${cx + size * 0.3},${cy - half * 0.18}`,
    { fill: '#111' },
  );
  return el('g', { transform: `rotate(${deg} ${cx} ${cy})` }, shaft + head);
}

function drawDots(n: number, cx: number, cy: number, cell: number): string {
  const perRow = n <= 3 ? n : Math.ceil(n / 2);
  const rowsN = Math.ceil(n / perRow);
  const r = cell * 0.075;
  const gap = cell * 0.21;
  let out = '';
  let drawn = 0;
  for (let row = 0; row < rowsN; row++) {
    const inRow = Math.min(perRow, n - drawn);
    const startX = cx - ((inRow - 1) * gap) / 2;
    const y = cy - ((rowsN - 1) * gap) / 2 + row * gap;
    for (let c = 0; c < inRow; c++) {
      out += circle(startX + c * gap, y, r, { fill: '#444', stroke: '#111', 'stroke-width': 0.5 });
      drawn++;
    }
  }
  return out;
}

function drawSpec(spec: CellSpec, cx: number, cy: number, cell: number): string {
  switch (spec.t) {
    case 'icon':
      return renderIcon(spec.id, cx, cy, cell * 0.62);
    case 'size':
      return renderIcon(spec.id, cx, cy, cell * 0.62 * spec.scale);
    case 'count':
      return drawDots(spec.n, cx, cy, cell);
    case 'rot':
      return drawArrow(cx, cy, cell * 0.6, spec.deg);
  }
}

function drawRows(data: PatternData, showAnswer: boolean): string {
  const n = data.rows.length;
  const bandH = (BOTTOM - TOP) / n;
  const maxLen = Math.max(...data.rows.map((r) => r.specs.length));
  const cell = Math.min(bandH * 0.62, CONTENT.w / maxLen);

  let out = '';
  data.rows.forEach((row, ri) => {
    const rowW = cell * row.specs.length;
    const ox = CONTENT.x + (CONTENT.w - rowW) / 2;
    const oy = TOP + ri * bandH + (bandH - cell) / 2;
    const firstBlank = row.specs.length - row.blanks;

    row.specs.forEach((spec, ci) => {
      const x = ox + ci * cell;
      const cx = x + cell / 2;
      const cy = oy + cell / 2;
      const isBlank = ci >= firstBlank;

      if (!isBlank) {
        out += rect({ x, y: oy, width: cell, height: cell, rx: 2, fill: '#fff', stroke: '#111', 'stroke-width': 0.6 });
        out += drawSpec(spec, cx, cy, cell);
      } else if (showAnswer) {
        out += rect({ x, y: oy, width: cell, height: cell, rx: 2, fill: HILITE, stroke: '#e0a800', 'stroke-width': 1 });
        out += drawSpec(spec, cx, cy, cell);
      } else {
        out += rect({ x, y: oy, width: cell, height: cell, rx: 2, fill: '#fff', stroke: '#999', 'stroke-width': 0.8, 'stroke-dasharray': '2 2' });
        out += text('?', { x: cx, y: oy + cell * 0.66, 'font-size': cell * 0.5, 'text-anchor': 'middle', fill: '#ccc' });
      }
    });
  });
  return out;
}

const TITLE = 'パターンの つづき';
const HOWTO = 'それぞれの きまりを みつけて、さいごの □ に つづきを かこう。';

export const patternNext: PuzzleType = {
  id: 'pattern-next',
  name: 'パターンの つづき',
  generate(params: PuzzleParams): GeneratedPuzzle {
    const data = generatePattern(params.seed, params.difficulty);
    return {
      svgProblem: renderPage({ title: TITLE, howto: HOWTO, seed: params.seed, body: drawRows(data, false) }),
      svgAnswer: renderPage({
        title: TITLE,
        howto: 'きいろの マスが こたえだよ。',
        seed: params.seed,
        badge: 'こたえ',
        body: drawRows(data, true),
      }),
      title: TITLE,
      howto: HOWTO,
    };
  },
};
