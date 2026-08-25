export type BotDifficulty = "easy" | "normal" | "hard" | "expert";

export interface PositionInput {
  size: number;
  cells: Uint8Array;
  sideToMove: 1 | 2;
  lastMove: number | null;
}

export interface RuleConfig {
  winCondition: "atLeastFive" | "exactFive";
  forbiddenMoves: "none" | "renju";
  blockedBothEndsDoesNotWin?: boolean;
}

export interface SearchOptions {
  timeMs: number;
  maxDepth?: number;
  difficulty?: BotDifficulty;
}

export interface SearchResult {
  move: number | null; // index in 1D array
  score: number;
  depth: number;
  nodes: number;
  elapsedMs: number;
  reason: "completed" | "timeout" | "mate" | "no-move";
}

// 1 = X (Black), 2 = O (White)
export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;
export const WALL = 3;
