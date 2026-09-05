import type { CellCoord } from "../core/types"

export type BotDifficulty = "easy" | "normal" | "hard" | "expert"

export interface SearchPosition {
  size: number
  cells: Uint8Array
  sideToMove: 1 | 2
  lastMove: number | null
  offset: CellCoord
}

export interface AIRequest {
  requestId: number
  roundId: number
  position: SearchPosition
  difficulty: BotDifficulty
  budget: SearchBudget
}

export interface AIResult {
  requestId: number
  roundId: number
  move: CellCoord | null
  stats: { depth: number; nodes: number; elapsedMs: number; reason: "completed" | "timeout" | "mate" | "no-move" }
}

export interface SearchBudget { timeMs: number; maxDepth: number }
export const SEARCH_BUDGETS: Record<BotDifficulty, SearchBudget> = {
  easy: { timeMs: 50, maxDepth: 2 },
  normal: { timeMs: 150, maxDepth: 4 },
  hard: { timeMs: 500, maxDepth: 8 },
  expert: { timeMs: 1200, maxDepth: 64 },
}

export interface AIService {
  requestMove(state: import("../core/GameState").GameState, roundId: number, difficulty: BotDifficulty): Promise<AIResult>
  cancelPending(): void
  destroy(): void
}
