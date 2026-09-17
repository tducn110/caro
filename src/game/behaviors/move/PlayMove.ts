import { validateMove } from "../../core/MoveRules"
import type { GameState } from "../../core/GameState"
import type { WinRule } from "../../core/WinRules"
import type { CellCoord, Move, Player, WinResult } from "../../core/types"

export interface PlayMoveRequest { player: Player; cell: CellCoord }
export type PlayMoveRejection = "occupied" | "out-of-bounds" | "wrong-turn" | "match-ended" | "input-locked" | "paused"
export type PlayMoveResult =
  | { type: "accepted"; move: Move; win: WinResult | null }
  | { type: "rejected"; reason: PlayMoveRejection }

export function playMove(state: GameState, rule: WinRule, request: PlayMoveRequest): PlayMoveResult {
  const validation = validateMove(state, request.cell)
  if (!validation.valid) return { type: "rejected", reason: validation.reason ?? "occupied" }
  const move: Move = { ...request, index: state.moveCount + 1 }
  state.commitMove(move)
  return { type: "accepted", move, win: rule.evaluate(state, request.cell) }
}
