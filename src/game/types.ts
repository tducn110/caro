export type Player = "X" | "O"
export type GameMode = "1v1" | "ai"
export const WIN_LENGTH = 5

export interface Move {
  player: Player
  row: number
  col: number
  index: number
}

export interface WinResult {
  winner: Player
  cells: [number, number][]
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}
