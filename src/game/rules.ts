import { GameState } from "./state"
import { WinResult, WIN_LENGTH, Player } from "./types"

const DIRS = [[0,1], [1,0], [1,1], [1,-1]]

export function checkWinner(state: GameState, row: number, col: number): WinResult | null {
  const player = state.get(row, col)
  if (!player) return null
  
  for (const [dr, dc] of DIRS) {
    const cells: [number, number][] = [[row, col]]

    for (let i = 1; i < WIN_LENGTH; i++) {
      const r = row + dr * i
      const c = col + dc * i
      if (state.get(r, c) !== player) break
      cells.push([r, c])
    }
    for (let i = 1; i < WIN_LENGTH; i++) {
      const r = row - dr * i
      const c = col - dc * i
      if (state.get(r, c) !== player) break
      cells.push([r, c])
    }

    if (cells.length >= WIN_LENGTH) {
      return { winner: player, cells }
    }
  }
  return null
}
