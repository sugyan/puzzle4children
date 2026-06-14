/**
 * A4 プリント1枚分のレイアウト。座標系は mm（210 x 297）。
 * 問題ページ・答えページ共通で、タイトル帯・説明・本体領域・隅のシード印字を組む。
 */
import { svgRoot, text, rect } from './svg.js';

export const A4 = {
  w: 210,
  h: 297,
  margin: 14,
} as const;

/** 本体（パズルを描く領域）の矩形。renderer はこの中に収めて描く。 */
export const CONTENT = {
  x: A4.margin,
  y: 50,
  get w() {
    return A4.w - A4.margin * 2;
  },
  get h() {
    return A4.h - 50 - A4.margin;
  },
} as const;

export interface PageOptions {
  title: string;
  howto: string;
  seed: number;
  /** 右上に出す小さなラベル（例: 「こたえ」） */
  badge?: string;
  /** 本体SVG（mm座標で CONTENT 内に描いたもの） */
  body: string;
}

export function renderPage(opts: PageOptions): string {
  const { title, howto, seed, badge, body } = opts;

  const header =
    text(title, {
      x: A4.margin,
      y: 26,
      'font-size': 11,
      'font-weight': 'bold',
      fill: '#111',
    }) +
    text(howto, {
      x: A4.margin,
      y: 38,
      'font-size': 4.8,
      fill: '#333',
    });

  const badgeEl = badge
    ? text(badge, {
        x: A4.w - A4.margin,
        y: 26,
        'font-size': 9,
        'font-weight': 'bold',
        'text-anchor': 'end',
        fill: '#c0392b',
      })
    : '';

  const seedLabel = text(`seed: ${seed}`, {
    x: A4.w - A4.margin,
    y: A4.h - 6,
    'font-size': 3.4,
    'text-anchor': 'end',
    fill: '#999',
  });

  // ページ枠（印刷の目安。薄い線）
  const border = rect({
    x: 2,
    y: 2,
    width: A4.w - 4,
    height: A4.h - 4,
    fill: 'none',
    stroke: '#ddd',
    'stroke-width': 0.3,
  });

  return svgRoot(A4.w, A4.h, border + header + badgeEl + body + seedLabel, {
    'font-family': "'Hiragino Maru Gothic ProN', 'Hiragino Kaku Gothic ProN', sans-serif",
    class: 'a4-svg',
  });
}
