import { BOARD_SIZE } from "../core/BoardBounds"
import type { GameState } from "../core/GameState"
import type { CellCoord, Player } from "../core/types"

const DIRECTIONS: readonly CellCoord[] = [
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: -1 },
]

/**
 * Enforces the small set of tactical facts that must not depend on a bounded
 * heuristic search: take an immediate win, then block an immediate loss.
 * Strategic move selection stays in the Gomoku WASM engine.
 */
export function findForcedTacticalMove(
  state: GameState,
  player: Player,
): CellCoord | null {
  const emptyCells = listEmptyCells(state)
  const winningMove = emptyCells.find((cell) => winsIfPlaced(state, cell, player))
  if (winningMove) return winningMove

  const opponent = player === "X" ? "O" : "X"
  return emptyCells.find((cell) => winsIfPlaced(state, cell, opponent)) ?? null
}

function listEmptyCells(state: GameState): CellCoord[] {
  const cells: CellCoord[] = []
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = { row, col }
      if (!state.has(cell)) cells.push(cell)
    }
  }
  return cells
}

function winsIfPlaced(state: GameState, candidate: CellCoord, player: Player): boolean {
  return DIRECTIONS.some((direction) => {
    const count = 1
      + countDirection(state, candidate, direction, 1, player)
      + countDirection(state, candidate, direction, -1, player)
    return count >= 5
  })
}

function countDirection(
  state: GameState,
  origin: CellCoord,
  direction: CellCoord,
  sign: 1 | -1,
  player: Player,
): number {
  let count = 0
  for (let step = 1; step < 5; step++) {
    const cell = {
      row: origin.row + direction.row * step * sign,
      col: origin.col + direction.col * step * sign,
    }
    if (state.get(cell) !== player) break
    count++
  }
  return count
}
