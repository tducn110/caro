import type { CellCoord, Move, Player } from "./types"

export interface OccupiedBounds {
  minRow: number
  maxRow: number
  minCol: number
  maxCol: number
}

export class GameState {
  #board = new Map<string, Player>()
  #history: Move[] = []
  #occupiedBounds: OccupiedBounds = emptyBounds()

  static key(cell: CellCoord): string {
    return `${cell.row},${cell.col}`
  }

  get occupiedBounds(): OccupiedBounds {
    return { ...this.#occupiedBounds }
  }

  get moveCount(): number { return this.#history.length }
  get lastMove(): Move | null { return this.#history[this.#history.length - 1] ?? null }
  getHistory(): readonly Move[] { return this.#history }

  forEachStone(callback: (cell: CellCoord, player: Player) => void): void {
    for (const [key, player] of this.#board) {
      const [row, col] = key.split(",").map(Number)
      callback({ row, col }, player)
    }
  }

  get(cell: CellCoord): Player | null {
    return this.#board.get(GameState.key(cell)) ?? null
  }

  has(cell: CellCoord): boolean {
    return this.#board.has(GameState.key(cell))
  }

  commitMove(move: Move): void {
    if (this.has(move.cell)) throw new Error("Cannot commit an occupied cell")
    this.#board.set(GameState.key(move.cell), move.player)
    this.#history.push(move)
    const { row, col } = move.cell
    this.#occupiedBounds = {
      minRow: Math.min(this.#occupiedBounds.minRow, row),
      maxRow: Math.max(this.#occupiedBounds.maxRow, row),
      minCol: Math.min(this.#occupiedBounds.minCol, col),
      maxCol: Math.max(this.#occupiedBounds.maxCol, col),
    }
  }

  reset(): void {
    this.#board.clear()
    this.#history.length = 0
    this.#occupiedBounds = emptyBounds()
  }
}

function emptyBounds(): OccupiedBounds {
  return { minRow: Infinity, maxRow: -Infinity, minCol: Infinity, maxCol: -Infinity }
}
