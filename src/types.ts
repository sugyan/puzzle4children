export type Difficulty = 'easy' | 'normal' | 'hard';

export interface PuzzleParams {
  seed: number;
  difficulty: Difficulty;
}

export interface GeneratedPuzzle {
  /** 問題ページの中身（SVG文字列） */
  svgProblem: string;
  /** 答えページの中身（SVG文字列） */
  svgAnswer: string;
  /** ページ上部に出すタイトル（ひらがな） */
  title: string;
  /** 解き方の説明（ひらがな） */
  howto: string;
}

export interface PuzzleType {
  /** 例: 'rule-maze' */
  id: string;
  /** 例: 'きまりめいろ' */
  name: string;
  generate(params: PuzzleParams): GeneratedPuzzle;
}
