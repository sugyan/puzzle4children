/**
 * しきつめの描画。問題ページ（空の枠＋つかうブロック一覧）と
 * 答えページ（分割を色分け＋太い境界線＋番号）を作る。
 * 色だけでなく境界の太線と領域番号で、白黒印刷でも分割が読めるようにする。
 */
import type { PuzzleType, PuzzleParams, GeneratedPuzzle } from '../../types.js';
import { A4, CONTENT, renderPage } from '../../layout.js';
import { rect, text, line } from '../../svg.js';
import { generateTiling, BLOCK_BY_ID, type TilingData, type BlockType } from './generate.js';

const GRID_TOP = 72;
const GRID_MAX_BOTTOM = 210;
const LEGEND_TOP = 224;

// 白黒でも番号・境界が読める淡色パレット
const PALETTE = ['#ffd9d9', '#d9e8ff', '#d9ffe0', '#fff3c4', '#ead9ff', '#d9f7ff', '#ffe0c4', '#e8ffd9'];

interface Geom {
  cell: number;
  ox: number;
  oy: number;
}

function geomOf(data: TilingData): Geom {
  const gridH = GRID_MAX_BOTTOM - GRID_TOP;
  const cell = Math.min(CONTENT.w / data.cols, gridH / data.rows);
  const ox = CONTENT.x + (CONTENT.w - cell * data.cols) / 2;
  return { cell, ox, oy: GRID_TOP };
}

function cellRect(g: Geom, x: number, y: number) {
  return { x: g.ox + x * g.cell, y: g.oy + y * g.cell, w: g.cell };
}

/** 空の枠（細いグリッド＋外周の太枠） */
function drawFrame(data: TilingData, g: Geom): string {
  let out = '';
  for (let y = 0; y < data.rows; y++) {
    for (let x = 0; x < data.cols; x++) {
      const r = cellRect(g, x, y);
      out += rect({ x: r.x, y: r.y, width: r.w, height: r.w, fill: '#fff', stroke: '#bbb', 'stroke-width': 0.5 });
    }
  }
  out += rect({
    x: g.ox,
    y: g.oy,
    width: g.cell * data.cols,
    height: g.cell * data.rows,
    fill: 'none',
    stroke: '#111',
    'stroke-width': 2,
  });
  return out;
}

/** 分割（領域ごとの塗り＋境界の太線＋番号） */
function drawDivision(data: TilingData, g: Geom): string {
  let fills = '';
  for (const region of data.regions) {
    const color = PALETTE[region.id % PALETTE.length];
    for (const [x, y] of region.cells) {
      const r = cellRect(g, x, y);
      fills += rect({ x: r.x, y: r.y, width: r.w, height: r.w, fill: color, stroke: 'none' });
    }
  }

  // 領域の境界（隣が別領域 or 枠外）に太線
  let borders = '';
  const regionAt = (x: number, y: number): number =>
    x < 0 || y < 0 || x >= data.cols || y >= data.rows ? -1 : data.region[y][x];
  for (let y = 0; y < data.rows; y++) {
    for (let x = 0; x < data.cols; x++) {
      const here = data.region[y][x];
      const r = cellRect(g, x, y);
      const lw = 1.6;
      if (regionAt(x + 1, y) !== here) borders += line(r.x + g.cell, r.y, r.x + g.cell, r.y + g.cell, { stroke: '#111', 'stroke-width': lw, 'stroke-linecap': 'square' });
      if (regionAt(x, y + 1) !== here) borders += line(r.x, r.y + g.cell, r.x + g.cell, r.y + g.cell, { stroke: '#111', 'stroke-width': lw, 'stroke-linecap': 'square' });
      if (regionAt(x - 1, y) !== here) borders += line(r.x, r.y, r.x, r.y + g.cell, { stroke: '#111', 'stroke-width': lw, 'stroke-linecap': 'square' });
      if (regionAt(x, y - 1) !== here) borders += line(r.x, r.y, r.x + g.cell, r.y, { stroke: '#111', 'stroke-width': lw, 'stroke-linecap': 'square' });
    }
  }

  // 各領域の番号（最初のセルに）
  let nums = '';
  for (const region of data.regions) {
    const [fx, fy] = region.cells[0];
    const r = cellRect(g, fx, fy);
    nums += text(String(region.id + 1), {
      x: r.x + g.cell / 2,
      y: r.y + g.cell * 0.62,
      'font-size': g.cell * 0.34,
      'font-weight': 'bold',
      'text-anchor': 'middle',
      fill: '#111',
    });
  }

  return fills + borders + nums;
}

/** つかうブロック一覧（形＋個数） */
function drawInventory(data: TilingData): string {
  let out = text('つかう ブロック', {
    x: A4.margin,
    y: LEGEND_TOP,
    'font-size': 6,
    'font-weight': 'bold',
    fill: '#111',
  });

  const miniCell = 7;
  let x = A4.margin + 2;
  const baseY = LEGEND_TOP + 8;
  for (const item of data.inventory) {
    const block = BLOCK_BY_ID[item.typeId];
    out += drawBlockShape(block, x, baseY, miniCell);
    const shapeW = (maxCoord(block, 0) + 1) * miniCell;
    out += text(`× ${item.count}`, {
      x: x + shapeW + 4,
      y: baseY + miniCell * 1.6,
      'font-size': 6.5,
      'font-weight': 'bold',
      fill: '#111',
    });
    out += text(block.label, {
      x,
      y: baseY + (maxCoord(block, 1) + 1) * miniCell + 6,
      'font-size': 4.6,
      fill: '#555',
    });
    x += shapeW + 26;
  }
  return out;
}

function drawBlockShape(block: BlockType, ox: number, oy: number, cell: number): string {
  return block.shape
    .map(([cx, cy]) =>
      rect({ x: ox + cx * cell, y: oy + cy * cell, width: cell, height: cell, fill: '#e0e0e0', stroke: '#111', 'stroke-width': 0.6 }),
    )
    .join('');
}

function maxCoord(block: BlockType, axis: 0 | 1): number {
  return Math.max(...block.shape.map((c) => c[axis]));
}

const TITLE = 'しきつめ';
const HOWTO = 'わくを せんで くぎって、したの ブロックの かたち・かずに わけよう。';

function renderProblem(data: TilingData, seed: number): string {
  const g = geomOf(data);
  const body = drawFrame(data, g) + drawInventory(data);
  return renderPage({ title: TITLE, howto: HOWTO, seed, body });
}

function renderAnswer(data: TilingData, seed: number): string {
  const g = geomOf(data);
  const body = drawDivision(data, g) + drawInventory(data);
  return renderPage({ title: TITLE, howto: 'こたえの わけかただよ。いろと ばんごうで ブロックが わかるよ。', seed, badge: 'こたえ', body });
}

export const tiling: PuzzleType = {
  id: 'tiling',
  name: 'しきつめ',
  generate(params: PuzzleParams): GeneratedPuzzle {
    const data = generateTiling(params.seed, params.difficulty);
    return {
      svgProblem: renderProblem(data, params.seed),
      svgAnswer: renderAnswer(data, params.seed),
      title: TITLE,
      howto: HOWTO,
    };
  },
};
