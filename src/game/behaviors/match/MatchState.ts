import type { WinResult } from "../../core/types"
import type { BotDifficulty } from "../../ai/contracts"
export type { BotDifficulty } from "../../ai/contracts"

export type GameMode = "1v1" | "ai"

export type MatchPhase = "setup" | "ready" | "playing" | "game-over"

export interface MatchState {
  phase: MatchPhase
  mode: GameMode
  difficulty: BotDifficulty
  winner: WinResult | null
  isDraw: boolean
  roundId: number
}
