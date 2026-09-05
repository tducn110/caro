import type { SearchPosition, BotDifficulty } from "../ai/contracts"

export type { BotDifficulty, SearchPosition }

export type PositionInput = SearchPosition


export interface SearchOptions {
  timeMs: number
  maxDepth: number
}

export interface SearchResult {
  move: number | null // index in 1D array
  score: number
  depth: number
  nodes: number
  elapsedMs: number
  reason: "completed" | "timeout" | "mate" | "no-move"
}

// 1 = X (Black), 2 = O (White)
export const EMPTY = 0
export const BLACK = 1
export const WHITE = 2
export const WALL = 3
