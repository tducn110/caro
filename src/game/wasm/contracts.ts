import type { Move } from "../core/types"
import type { AIResult, BotDifficulty } from "../ai/contracts"

export interface WasmAIRequest {
  requestId: number
  roundId: number
  difficulty: BotDifficulty
  history: readonly Move[]
}

export const WASM_DIFFICULTIES: Record<BotDifficulty, number> = {
  easy: 0,
  normal: 1,
  hard: 2,
  expert: 3,
  master: 4,
}

export const WASM_SEARCH_DEPTHS: Record<BotDifficulty, number> = {
  easy: 1,
  normal: 2,
  hard: 4,
  expert: 6,
  master: 8,
}

export type WasmAIResult = AIResult
