import type { GameState } from "../core/GameState"
import type { CellCoord } from "../core/types"
import { BLACK, EMPTY, WHITE } from "../bot/interface"
import type { SearchPosition } from "./contracts"

export class SearchPositionBuilder {
  constructor(private readonly size = 25) {}

  build(state: GameState, lastMove: CellCoord | null = state.lastMove?.cell ?? null): SearchPosition {
    const cells = new Uint8Array(this.size * this.size).fill(EMPTY)
    let offset = { row: 0, col: 0 }
    if (state.moveCount > 0) {
      const bounds = state.occupiedBounds
      offset = {
        row: Math.floor(this.size / 2) - Math.floor((bounds.minRow + bounds.maxRow) / 2),
        col: Math.floor(this.size / 2) - Math.floor((bounds.minCol + bounds.maxCol) / 2),
      }
    }
    state.forEachStone((cell, player) => {
      const row = cell.row + offset.row, col = cell.col + offset.col
      if (row >= 0 && row < this.size && col >= 0 && col < this.size) cells[row * this.size + col] = player === "X" ? BLACK : WHITE
    })
    let mappedLastMove: number | null = null
    if (lastMove) {
      const row = lastMove.row + offset.row, col = lastMove.col + offset.col
      if (row >= 0 && row < this.size && col >= 0 && col < this.size) mappedLastMove = row * this.size + col
    }
    return { size: this.size, cells, sideToMove: state.moveCount % 2 === 0 ? BLACK : WHITE, lastMove: mappedLastMove, offset }
  }
}
