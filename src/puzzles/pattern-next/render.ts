/**
 * パターンのつづき の描画。各行の最後の数マスを空白にして出題し、
 * 答えページではその空白に正解アイコンを淡くハイライトして埋める。
 */
import type { PuzzleType, PuzzleParams, GeneratedPuzzle } from '../../types.js';
import { A4, CONTENT, renderPage } from '../../layout.js';
import { rect, text } from '../../svg.js';
import { renderIcon } from '../../icons.js';
import { generatePattern, type PatternData } from './generate.js';

const TOP = 56;
const BOTTOM = A4.h - A4.margin;
const HILITE = '#fff3c4';

function drawRows(data: PatternData, showAnswer: boolean): string {
  const n = data.rows.length;
  const bandH = (BOTTOM - TOP) / n;
  const maxLen = Math.max(...data.rows.map((r) => r.cells.length));
  const cell = Math.min(bandH * 0.62, CONTENT.w / maxLen);

  let out = '';
  data.rows.forEach((row, ri) => {
    const rowW = cell * row.cells.length;
    const ox = CONTENT.x + (CONTENT.w - rowW) / 2;
    const oy = TOP + ri * bandH + (bandH - cell) / 2;
    const firstBlank = row.cells.length - row.blanks;

    row.cells.forEach((id, ci) => {
      const x = ox + ci * cell;
      const isBlank = ci >= firstBlank;

      if (!isBlank) {
        out += rect({ x, y: oy, width: cell, height: cell, rx: 2, fill: '#fff', stroke: '#111', 'stroke-width': 0.6 });
        out += renderIcon(id, x + cell / 2, oy + cell / 2, cell * 0.62);
      } else if (showAnswer) {
        out += rect({ x, y: oy, width: cell, height: cell, rx: 2, fill: HILITE, stroke: '#e0a800', 'stroke-width': 1 });
        out += renderIcon(id, x + cell / 2, oy + cell / 2, cell * 0.62);
      } else {
        // 空白マス（点線＋うすい「？」）
        out += rect({ x, y: oy, width: cell, height: cell, rx: 2, fill: '#fff', stroke: '#999', 'stroke-width': 0.8, 'stroke-dasharray': '2 2' });
        out += text('?', { x: x + cell / 2, y: oy + cell * 0.66, 'font-size': cell * 0.5, 'text-anchor': 'middle', fill: '#ccc' });
      }
    });
  });
  return out;
}

const TITLE = 'パターンの つづき';
const HOWTO = 'おなじ きまりで ならんでいるよ。さいごの □ に はいる かたちを かこう。';

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
