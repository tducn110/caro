import type { GameState } from "./GameState"
import type { CellCoord, WinResult } from "./types"

export interface WinRule {
  evaluate(state: GameState, lastMove: CellCoord): WinResult | null
}

const DIRECTIONS: readonly CellCoord[] = [
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: -1 },
]

export class FreestyleGomokuWinRule implements WinRule {
  constructor(private readonly winLength = 5) {}

  evaluate(state: GameState, lastMove: CellCoord): WinResult | null {
    const player = state.get(lastMove)
    if (!player) return null
    for (const direction of DIRECTIONS) {
      const cells = [lastMove, ...this.collect(state, lastMove, direction, 1), ...this.collect(state, lastMove, direction, -1)]
      if (cells.length >= this.winLength) return { winner: player, cells }
    }
    return null
  }

  private collect(state: GameState, origin: CellCoord, direction: CellCoord, sign: 1 | -1): CellCoord[] {
    const cells: CellCoord[] = []
    for (let step = 1; step < this.winLength; step++) {
      const cell = { row: origin.row + direction.row * step * sign, col: origin.col + direction.col * step * sign }
      if (state.get(cell) !== state.get(origin)) break
      cells.push(cell)
    }
    return cells
  }
}
