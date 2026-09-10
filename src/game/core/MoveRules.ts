import type { GameState } from "./GameState"
import type { CellCoord } from "./types"
import { isBoardCell } from "./BoardBounds"

export type MoveValidationReason = "occupied" | "out-of-bounds"

export interface MoveValidation {
  valid: boolean
  reason?: MoveValidationReason
}

export function validateMove(state: GameState, cell: CellCoord): MoveValidation {
  if (!isBoardCell(cell)) return { valid: false, reason: "out-of-bounds" }
  return state.has(cell) ? { valid: false, reason: "occupied" } : { valid: true }
}
