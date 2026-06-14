/**
 * 文字列ベースの最小 SVG 組み立てヘルパ。
 * 外部ライブラリは使わず、属性オブジェクト＋子文字列から SVG 要素文字列を作る。
 */

export type Attrs = Record<string, string | number | undefined>;

function attrsToString(attrs: Attrs): string {
  return Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}="${escapeAttr(String(v))}"`)
    .join(' ');
}

export function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** 任意のSVG要素。子要素文字列を内側に入れる。 */
export function el(tag: string, attrs: Attrs, children = ''): string {
  const a = attrsToString(attrs);
  const open = a ? `<${tag} ${a}>` : `<${tag}>`;
  return children ? `${open}${children}</${tag}>` : `<${tag} ${a}/>`;
}

export function g(attrs: Attrs, children: string): string {
  return el('g', attrs, children);
}

export function rect(attrs: Attrs): string {
  return el('rect', attrs);
}

export function line(x1: number, y1: number, x2: number, y2: number, attrs: Attrs = {}): string {
  return el('line', { x1, y1, x2, y2, ...attrs });
}

export function circle(cx: number, cy: number, r: number, attrs: Attrs = {}): string {
  return el('circle', { cx, cy, r, ...attrs });
}

export function path(d: string, attrs: Attrs = {}): string {
  return el('path', { d, ...attrs });
}

export function polygon(points: string, attrs: Attrs = {}): string {
  return el('polygon', { points, ...attrs });
}

export function text(content: string, attrs: Attrs): string {
  return el('text', attrs, escapeText(content));
}

/** ルートの <svg> 要素。viewBox は "0 0 w h"。 */
export function svgRoot(width: number, height: number, children: string, attrs: Attrs = {}): string {
  return el(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: `0 0 ${width} ${height}`,
      width: '100%',
      height: '100%',
      ...attrs,
    },
    children,
  );
}
