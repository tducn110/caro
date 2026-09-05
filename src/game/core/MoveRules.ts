import type { GameState } from "./GameState"
import type { CellCoord } from "./types"

export type MoveValidationReason = "occupied"

export interface MoveValidation {
  valid: boolean
  reason?: MoveValidationReason
}

export function validateMove(state: GameState, cell: CellCoord): MoveValidation {
  return state.has(cell) ? { valid: false, reason: "occupied" } : { valid: true }
}
