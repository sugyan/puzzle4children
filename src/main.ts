/**
 * UI 配線: 種類選択 → 生成 → 画面出力 → 印刷。
 * 問題ページ群を先に並べ、最後に答えページ群を出す。各ページ A4・改ページ。
 */
import './style.css';
import type { Difficulty } from './types.js';
import { puzzles } from './puzzles/registry.js';

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
};

const typeSel = $<HTMLSelectElement>('type');
const difficultySel = $<HTMLSelectElement>('difficulty');
const countInput = $<HTMLInputElement>('count');
const seedInput = $<HTMLInputElement>('seed');
const randomSeedBtn = $<HTMLButtonElement>('random-seed');
const generateBtn = $<HTMLButtonElement>('generate');
const printBtn = $<HTMLButtonElement>('print');
const output = $<HTMLElement>('output');

// パズル種類セレクトを registry から組み立て
for (const p of puzzles) {
  const opt = document.createElement('option');
  opt.value = p.id;
  opt.textContent = p.name;
  typeSel.appendChild(opt);
}

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000);
}

randomSeedBtn.addEventListener('click', () => {
  seedInput.value = String(randomSeed());
});

function pageEl(svg: string, kind: 'problem' | 'answer'): HTMLElement {
  const page = document.createElement('div');
  page.className = `page page-${kind}`;
  page.innerHTML = svg;
  return page;
}

function generate(): void {
  const puzzle = puzzles.find((p) => p.id === typeSel.value);
  if (!puzzle) return;

  const difficulty = difficultySel.value as Difficulty;
  const count = Math.max(1, Math.min(20, Number(countInput.value) || 1));
  const baseSeed = seedInput.value.trim() === '' ? randomSeed() : Number(seedInput.value);
  // 固定シードを使ったことが分かるよう入力欄にも反映
  seedInput.value = String(baseSeed);

  output.innerHTML = '';

  const problems: HTMLElement[] = [];
  const answers: HTMLElement[] = [];
  for (let i = 0; i < count; i++) {
    const seed = (baseSeed + i * 101) >>> 0; // ページごとに別シードを派生
    const g = puzzle.generate({ seed, difficulty });
    problems.push(pageEl(g.svgProblem, 'problem'));
    answers.push(pageEl(g.svgAnswer, 'answer'));
  }
  // 問題ページ群 →（最後に）答えページ群
  for (const el of problems) output.appendChild(el);
  for (const el of answers) output.appendChild(el);

  printBtn.disabled = false;
}

generateBtn.addEventListener('click', generate);
printBtn.addEventListener('click', () => window.print());

// 初期表示
seedInput.value = String(randomSeed());
printBtn.disabled = true;
generate();
