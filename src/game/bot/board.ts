import { EMPTY, WALL } from "./interface"

export { EMPTY, WALL }

// Zobrist Hashing (64-bit using two 32-bit ints)
const ZOBRIST_SEED = 12345
function mulberry32(a: number) {
  return function () {
    var t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return (t ^ (t >>> 14)) >>> 0
  }
}
const rand = mulberry32(ZOBRIST_SEED)

// Enough for boards up to 30×30 (stride=32, max idx=32*32-1=1023, *3+2=3071)
const ZOBRIST_TABLE_SIZE = 32 * 32 * 3
export const ZobristLo = new Int32Array(ZOBRIST_TABLE_SIZE)
export const ZobristHi = new Int32Array(ZOBRIST_TABLE_SIZE)
for (let i = 0; i < ZOBRIST_TABLE_SIZE; i++) {
  ZobristLo[i] = rand()
  ZobristHi[i] = rand()
}
export const ZobristSideLo = rand()
export const ZobristSideHi = rand()

import { evaluateLine } from "./eval"

export class BotBoard {
  size: number
  stride: number
  cells: Uint8Array
  sideToMove: 1 | 2
  lastMove: number | null
  hashLo: number = 0
  hashHi: number = 0

  // We maintain exact counts of tactical patterns for each player
  counts: number[][] // [player][pattern_type]
  stoneCount: number = 0

  constructor(size: number = 15) {
    this.size = size
    this.stride = size + 2
    this.cells = new Uint8Array(this.stride * this.stride).fill(WALL)
    for (let r = 1; r <= size; r++) {
      for (let c = 1; c <= size; c++) {
        this.cells[r * this.stride + c] = EMPTY
      }
    }
    this.sideToMove = 1
    this.lastMove = null
    this.counts = [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ]
  }

  load(cells: Uint8Array, sideToMove: 1 | 2, lastMove: number | null) {
    for (let r = 1; r <= this.size; r++) {
      for (let c = 1; c <= this.size; c++) {
        this.cells[r * this.stride + c] = cells[(r - 1) * this.size + (c - 1)]
      }
    }
    this.sideToMove = sideToMove
    this.lastMove =
      lastMove !== null
        ? (Math.floor(lastMove / this.size) + 1) * this.stride +
          ((lastMove % this.size) + 1)
        : null
    this.computeInitialState()
  }

  private getLineParams(index: number, dir: number): {
    start: number
    length: number
  } {
    let r = Math.floor(index / this.stride)
    let c = index % this.stride

    let dr = 0,
      dc = 0
    if (dir === 0) {
      dr = 0
      dc = 1
    } else if (dir === 1) {
      dr = 1
      dc = 0
    } else if (dir === 2) {
      dr = 1
      dc = 1
    } else if (dir === 3) {
      dr = -1
      dc = 1
    }

    let startR = r,
      startC = c
    while (this.cells[(startR - dr) * this.stride + (startC - dc)] !== WALL) {
      startR -= dr
      startC -= dc
    }
    let endR = r,
      endC = c
    while (this.cells[(endR + dr) * this.stride + (endC + dc)] !== WALL) {
      endR += dr
      endC += dc
    }

    const start = startR * this.stride + startC
    const length =
      Math.max(Math.abs(endR - startR), Math.abs(endC - startC)) + 1
    return { start, length }
  }

  private computeInitialState() {
    this.hashLo = 0
    this.hashHi = 0
    if (this.sideToMove === 2) {
      this.hashLo ^= ZobristSideLo
      this.hashHi ^= ZobristSideHi
    }

    this.counts = [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ]
    this.stoneCount = 0

    for (let r = 1; r <= this.size; r++) {
      for (let c = 1; c <= this.size; c++) {
        const idx = r * this.stride + c
        const p = this.cells[idx]
        if (p !== EMPTY) {
          this.stoneCount++
          const zIdx = idx * 3 + p
          this.hashLo ^= ZobristLo[zIdx]
          this.hashHi ^= ZobristHi[zIdx]
        }
      }
    }

    // Full board count init
    for (let p = 1; p <= 2; p++) {
      // Horizontal
      for (let r = 1; r <= this.size; r++) {
        const cP = evaluateLine(this, p, r * this.stride + 1, 1, this.size)
        for (let j = 1; j <= 5; j++) this.counts[p][j] += cP[j]
      }
      // Vertical
      for (let c = 1; c <= this.size; c++) {
        const cP = evaluateLine(
          this,
          p,
          1 * this.stride + c,
          this.stride,
          this.size,
        )
        for (let j = 1; j <= 5; j++) this.counts[p][j] += cP[j]
      }
      // Diagonals
      for (let r = 1; r <= this.size; r++) {
        for (let c = 1; c <= this.size; c++) {
          const idx = r * this.stride + c
          // top-left of diagonal \
          if (this.cells[idx - this.stride - 1] === WALL) {
            const { start, length } = this.getLineParams(idx, 2)
            const cP = evaluateLine(this, p, start, this.stride + 1, length)
            for (let j = 1; j <= 5; j++) this.counts[p][j] += cP[j]
          }
          // bottom-left of diagonal /
          if (this.cells[idx + this.stride - 1] === WALL) {
            const { start, length } = this.getLineParams(idx, 3)
            const cP = evaluateLine(this, p, start, -this.stride + 1, length)
            for (let j = 1; j <= 5; j++) this.counts[p][j] += cP[j]
          }
        }
      }
    }
  }

  private updateLines(index: number, multiplier: 1 | -1) {
    const dirs = [1, this.stride, this.stride + 1, -this.stride + 1]

    for (let p = 1; p <= 2; p++) {
      for (let i = 0; i < 4; i++) {
        const { start, length } = this.getLineParams(index, i)
        const step = dirs[i]
        const lineCounts = evaluateLine(this, p, start, step, length)
        for (let j = 1; j <= 5; j++) {
          this.counts[p][j] += lineCounts[j] * multiplier
        }
      }
    }
  }

  makeMove(index: number) {
    // Subtract OLD lines
    this.updateLines(index, -1)

    const p = this.sideToMove
    this.cells[index] = p

    // Add NEW lines
    this.updateLines(index, 1)

    this.stoneCount++
    const zIdx = index * 3 + p
    this.hashLo ^= ZobristLo[zIdx]
    this.hashHi ^= ZobristHi[zIdx]

    this.sideToMove = ((3 - p) as 1 | 2)
    this.hashLo ^= ZobristSideLo
    this.hashHi ^= ZobristSideHi
  }

  undoMove(index: number) {
    const p = (3 - this.sideToMove) as 1 | 2

    // Subtract NEW lines
    this.updateLines(index, -1)

    this.cells[index] = EMPTY

    // Add OLD lines
    this.updateLines(index, 1)

    this.stoneCount--
    const zIdx = index * 3 + p
    this.hashLo ^= ZobristLo[zIdx]
    this.hashHi ^= ZobristHi[zIdx]

    this.sideToMove = p
    this.hashLo ^= ZobristSideLo
    this.hashHi ^= ZobristSideHi
  }

}
