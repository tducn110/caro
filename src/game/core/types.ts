export type Player = "X" | "O"

export interface CellCoord {
  row: number
  col: number
}

export interface Move {
  player: Player
  cell: CellCoord
  index: number
}

export interface WinResult {
  winner: Player
  cells: CellCoord[]
}
