/**
 * きまりめいろの描画。問題ページ（盤面＋ルール図示）と答えページ（正解パス）を作る。
 * 答えのハイライトは色だけに頼らず、太線＋手順番号で白黒印刷でも辿れるようにする。
 */
import type { PuzzleType, PuzzleParams, GeneratedPuzzle } from '../../types.js';
import { A4, CONTENT, renderPage } from '../../layout.js';
import { el, rect, text, line, polygon } from '../../svg.js';
import { renderIcon } from '../../icons.js';
import { generateMaze, type MazeData } from './generate.js';

const LEGEND_Y = 56;
const GRID_TOP = 92;
const GRID_BOTTOM = A4.h - A4.margin - 4;
const PATH_COLOR = '#e74c3c';

interface GridGeom {
  cell: number;
  ox: number;
  oy: number;
}

function gridGeom(n: number): GridGeom {
  const gridH = GRID_BOTTOM - GRID_TOP;
  const side = Math.min(CONTENT.w, gridH);
  const cell = side / n;
  const ox = CONTENT.x + (CONTENT.w - side) / 2;
  return { cell, ox, oy: GRID_TOP };
}

function center(geom: GridGeom, x: number, y: number): [number, number] {
  return [geom.ox + (x + 0.5) * geom.cell, geom.oy + (y + 0.5) * geom.cell];
}

/** ルール（周期パターン）を上部に図示 */
function drawLegend(cycle: string[]): string {
  let out = text('この じゅんばんで すすもう', {
    x: A4.margin,
    y: LEGEND_Y - 6,
    'font-size': 6,
    'font-weight': 'bold',
    fill: '#111',
  });

  const box = 15;
  const gap = 9;
  let x = A4.margin + 2;
  const y = LEGEND_Y;
  cycle.forEach((id, i) => {
    out += rect({
      x,
      y,
      width: box,
      height: box,
      rx: 3,
      fill: '#fff',
      stroke: '#111',
      'stroke-width': 0.6,
    });
    out += renderIcon(id, x + box / 2, y + box / 2, box * 0.78);
    x += box;
    if (i < cycle.length - 1) {
      out += text('→', { x: x + gap / 2, y: y + box * 0.72, 'font-size': 8, 'text-anchor': 'middle', fill: '#111' });
      x += gap;
    }
  });
  // 繰り返しを示す
  out += text('→ …（くりかえし）', {
    x: x + 3,
    y: y + box * 0.72,
    'font-size': 6,
    fill: '#333',
  });
  return out;
}

/** 盤面（マス＋アイコン）。スタート/ゴールも明示。 */
function drawBoard(data: MazeData): string {
  const { n, grid } = data;
  const geom = gridGeom(n);
  const { cell, ox, oy } = geom;
  let out = '';

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const cx = ox + x * cell;
      const cy = oy + y * cell;
      out += rect({ x: cx, y: cy, width: cell, height: cell, fill: '#fff', stroke: '#111', 'stroke-width': 0.5 });
      out += renderIcon(grid[y][x], cx + cell / 2, cy + cell / 2, cell * 0.62);
    }
  }

  // スタート・ゴールの強調枠
  out += rect({ x: ox, y: oy, width: cell, height: cell, fill: 'none', stroke: '#2e7d32', 'stroke-width': 2 });
  out += rect({ x: ox + (n - 1) * cell, y: oy + (n - 1) * cell, width: cell, height: cell, fill: 'none', stroke: '#1565c0', 'stroke-width': 2 });
  out += text('スタート', { x: ox + 1, y: oy - 2, 'font-size': 5, 'font-weight': 'bold', fill: '#2e7d32' });
  out += text('ゴール', { x: ox + n * cell - 1, y: oy + n * cell + 6, 'font-size': 5, 'font-weight': 'bold', 'text-anchor': 'end', fill: '#1565c0' });

  return out;
}

/** 正解パスのハイライト（太線＋手順番号）。 */
function drawSolution(data: MazeData): string {
  const geom = gridGeom(data.n);
  const pts = data.path.map(([x, y]) => center(geom, x, y));

  // つなぎ線
  let pathLine = '';
  for (let i = 0; i < pts.length - 1; i++) {
    pathLine += line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], {
      stroke: PATH_COLOR,
      'stroke-width': geom.cell * 0.16,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      opacity: 0.85,
    });
  }

  // 進む向きの矢印（最後のセグメント）
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  pathLine += arrowHead(a, b, geom.cell * 0.32, PATH_COLOR);

  // 手順番号（小さく、白縁で読みやすく）
  let nums = '';
  pts.forEach(([cx, cy], i) => {
    const label = String(i + 1);
    const ny = cy - geom.cell * 0.28;
    nums += text(label, {
      x: cx,
      y: ny,
      'font-size': geom.cell * 0.22,
      'font-weight': 'bold',
      'text-anchor': 'middle',
      fill: '#fff',
      stroke: PATH_COLOR,
      'stroke-width': geom.cell * 0.05,
      'paint-order': 'stroke',
    });
  });

  return el('g', {}, pathLine + nums);
}

function arrowHead([ax, ay]: number[], [bx, by]: number[], size: number, color: string): string {
  const ang = Math.atan2(by - ay, bx - ax);
  const left = ang + Math.PI - 0.5;
  const right = ang + Math.PI + 0.5;
  const p1 = `${bx},${by}`;
  const p2 = `${bx + size * Math.cos(left)},${by + size * Math.sin(left)}`;
  const p3 = `${bx + size * Math.cos(right)},${by + size * Math.sin(right)}`;
  return polygon(`${p1} ${p2} ${p3}`, { fill: color });
}

const TITLE = 'きまりめいろ';
const HOWTO =
  'すたーとから ごーるまで、きまりの じゅんばんに なるよう みちを なぞろう。';

function renderProblem(data: MazeData, seed: number): string {
  const body = drawLegend(data.cycle) + drawBoard(data);
  return renderPage({ title: TITLE, howto: HOWTO, seed, body });
}

function renderAnswer(data: MazeData, seed: number): string {
  const body = drawLegend(data.cycle) + drawBoard(data) + drawSolution(data);
  return renderPage({ title: TITLE, howto: 'こたえの みちだよ。ばんごうの じゅんに すすむよ。', seed, badge: 'こたえ', body });
}

export const ruleMaze: PuzzleType = {
  id: 'rule-maze',
  name: 'きまりめいろ',
  generate(params: PuzzleParams): GeneratedPuzzle {
    const data = generateMaze(params.seed, params.difficulty);
    return {
      svgProblem: renderProblem(data, params.seed),
      svgAnswer: renderAnswer(data, params.seed),
      title: TITLE,
      howto: HOWTO,
    };
  },
};
