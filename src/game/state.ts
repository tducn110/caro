import { Player, Move } from "./types"

export class GameState {
  board: Map<string, Player> = new Map()
  history: Move[] = []
  
  key(r: number, c: number) { return `${r},${c}` }
  get(r: number, c: number) { return this.board.get(this.key(r, c)) || null }
  set(r: number, c: number, p: Player) { this.board.set(this.key(r, c), p) }
  has(r: number, c: number) { return this.board.has(this.key(r, c)) }

  bounds = {
    minR: Infinity, maxR: -Infinity,
    minC: Infinity, maxC: -Infinity
  }

  makeMove(row: number, col: number, player: Player) {
    if (this.has(row, col)) return false
    this.set(row, col, player)
    this.history.push({ player, row, col, index: this.history.length + 1 })
    
    if (row < this.bounds.minR) this.bounds.minR = row
    if (row > this.bounds.maxR) this.bounds.maxR = row
    if (col < this.bounds.minC) this.bounds.minC = col
    if (col > this.bounds.maxC) this.bounds.maxC = col

    return true
  }

  reset() {
    this.board.clear()
    this.history = []
    this.bounds = {
      minR: Infinity, maxR: -Infinity,
      minC: Infinity, maxC: -Infinity
    }
  }
}
