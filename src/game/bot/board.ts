import { EMPTY, WALL, BLACK, WHITE } from "./interface";

export class BotBoard {
  size: number;
  stride: number;
  cells: Uint8Array;
  sideToMove: 1 | 2;
  lastMove: number | null;
  history: number[] = [];

  constructor(size: number) {
    this.size = size;
    // Add padding (WALL) around the actual board to avoid out-of-bounds checks.
    this.stride = size + 2; 
    this.cells = new Uint8Array(this.stride * this.stride).fill(WALL);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        this.cells[(r + 1) * this.stride + (c + 1)] = EMPTY;
      }
    }
    this.sideToMove = BLACK;
    this.lastMove = null;
  }

  load(cells: Uint8Array, sideToMove: 1 | 2, lastMove: number | null) {
    // Assuming 'cells' is a raw 2D N x N array flattened
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        this.cells[(r + 1) * this.stride + (c + 1)] = cells[r * this.size + c];
      }
    }
    this.sideToMove = sideToMove;
    
    if (lastMove !== null) {
      const r = Math.floor(lastMove / this.size);
      const c = lastMove % this.size;
      this.lastMove = (r + 1) * this.stride + (c + 1);
    } else {
      this.lastMove = null;
    }
    this.history = [];
  }

  makeMove(index: number) {
    this.cells[index] = this.sideToMove;
    this.history.push(this.lastMove ?? -1);
    this.lastMove = index;
    this.sideToMove = (3 - this.sideToMove) as 1 | 2;
  }

  undoMove(index: number) {
    this.sideToMove = (3 - this.sideToMove) as 1 | 2;
    this.cells[index] = EMPTY;
    const prev = this.history.pop();
    this.lastMove = prev === undefined || prev === -1 ? null : prev;
  }

  countDirection(index: number, step: number, player: number): number {
    let n = 0;
    for (let p = index + step; this.cells[p] === player; p += step) {
      n++;
    }
    return n;
  }

  checkWinAfterLastMove(): boolean {
    if (this.lastMove === null) return false;
    const player = this.cells[this.lastMove];
    const dirs = [1, this.stride, this.stride + 1, this.stride - 1];
    
    for (const step of dirs) {
      const run = 1 +
        this.countDirection(this.lastMove, step, player) +
        this.countDirection(this.lastMove, -step, player);
      
      if (run >= 5) return true;
    }
    return false;
  }

  getEmptyCells(): number[] {
    const empty: number[] = [];
    for (let r = 1; r <= this.size; r++) {
      for (let c = 1; c <= this.size; c++) {
        const idx = r * this.stride + c;
        if (this.cells[idx] === EMPTY) empty.push(idx);
      }
    }
    return empty;
  }
}
