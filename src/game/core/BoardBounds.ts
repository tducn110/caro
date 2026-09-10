import type { CellCoord } from "./types"

/** The Rust/WASM engine and the UI share this finite Gomoku board contract. */
export const BOARD_SIZE = 15
export const BOARD_MIN_INDEX = 0
export const BOARD_MAX_INDEX = BOARD_SIZE - 1

export function isBoardCell(cell: CellCoord): boolean {
  return cell.row >= BOARD_MIN_INDEX
    && cell.row <= BOARD_MAX_INDEX
    && cell.col >= BOARD_MIN_INDEX
    && cell.col <= BOARD_MAX_INDEX
}
