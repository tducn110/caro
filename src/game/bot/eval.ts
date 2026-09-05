import { BotBoard } from "./board"

export const SCORE_WIN = 100000000

export const PATTERN_FIVE = 5
export const PATTERN_OPEN_FOUR = 4
export const PATTERN_FOUR = 3
export const PATTERN_OPEN_THREE = 2
export const PATTERN_BROKEN_THREE = 1
export const PATTERN_NONE = 0

const MAX_LEN = 15
const patternTable = new Uint8Array((MAX_LEN + 1) * 32768)

function initPatternTable() {
  function hasFive(mask: number, len: number) {
    for (let i = 0; i <= len - 5; i++) {
      if (((mask >> i) & 0b11111) === 0b11111) return true
    }
    return false
  }

  function countWinCells(mask: number, len: number) {
    let wins = 0
    for (let i = 0; i < len; i++) {
      if ((mask & (1 << i)) === 0) {
        if (hasFive(mask | (1 << i), len)) wins++
      }
    }
    return wins
  }

  for (let len = 5; len <= MAX_LEN; len++) {
    for (let mask = 0; mask < 1 << len; mask++) {
      let val = PATTERN_NONE
      if (hasFive(mask, len)) {
        val = PATTERN_FIVE
      } else {
        const wins = countWinCells(mask, len)
        if (wins >= 2) val = PATTERN_OPEN_FOUR
        else if (wins === 1) val = PATTERN_FOUR
        else {
          let openThreeThreats = 0
          for (let i = 0; i < len; i++) {
            if ((mask & (1 << i)) === 0) {
              if (countWinCells(mask | (1 << i), len) >= 2) openThreeThreats++
            }
          }
          if (openThreeThreats >= 2) val = PATTERN_OPEN_THREE
          else if (openThreeThreats === 1) val = PATTERN_BROKEN_THREE
        }
      }
      patternTable[(len << 15) | mask] = val
    }
  }
}
initPatternTable()

export function evaluateLine(
  board: BotBoard,
  p: number,
  start: number,
  step: number,
  length: number,
): number[] {
  let mask = 0
  let len = 0
  const counts = [0, 0, 0, 0, 0, 0]

  for (let i = 0; i < length; i++) {
    const c = board.cells[start + i * step]
    if (c === p || c === 0) {
      if (c === p) mask |= 1 << len
      len++
    } else {
      if (len >= 5) {
        const pat = patternTable[(len << 15) | mask]
        if (pat > 0) counts[pat]++
      }
      len = 0
      mask = 0
    }
  }
  if (len >= 5) {
    const pat = patternTable[(len << 15) | mask]
    if (pat > 0) counts[pat]++
  }
  return counts
}

export function evaluatePosition(board: BotBoard, sideToMove: number): number {
  const p = sideToMove
  const opp = 3 - sideToMove

  const pCounts = [0, 0, 0, 0, 0, 0]
  const oppCounts = [0, 0, 0, 0, 0, 0]

  // Evaluate all lines
  const size = board.size
  const stride = board.stride

  for (let i = 1; i <= size; i++) {
    // Horizontal
    let start = i * stride + 1
    let cP = evaluateLine(board, p, start, 1, size)
    let cO = evaluateLine(board, opp, start, 1, size)
    for (let j = 1; j <= 5; j++) {
      pCounts[j] += cP[j]
      oppCounts[j] += cO[j]
    }

    // Vertical
    start = 1 * stride + i
    cP = evaluateLine(board, p, start, stride, size)
    cO = evaluateLine(board, opp, start, stride, size)
    for (let j = 1; j <= 5; j++) {
      pCounts[j] += cP[j]
      oppCounts[j] += cO[j]
    }
  }

  // Diagonals \
  for (let r = 1; r <= size - 4; r++) {
    const length = size - r + 1
    let start = r * stride + 1
    let cP = evaluateLine(board, p, start, stride + 1, length)
    let cO = evaluateLine(board, opp, start, stride + 1, length)
    for (let j = 1; j <= 5; j++) {
      pCounts[j] += cP[j]
      oppCounts[j] += cO[j]
    }

    if (r > 1) {
      start = 1 * stride + r
      cP = evaluateLine(board, p, start, stride + 1, length)
      cO = evaluateLine(board, opp, start, stride + 1, length)
      for (let j = 1; j <= 5; j++) {
        pCounts[j] += cP[j]
        oppCounts[j] += cO[j]
      }
    }
  }

  // Diagonals /
  for (let r = 1; r <= size - 4; r++) {
    const length = size - r + 1
    let start = r * stride + size
    let cP = evaluateLine(board, p, start, stride - 1, length)
    let cO = evaluateLine(board, opp, start, stride - 1, length)
    for (let j = 1; j <= 5; j++) {
      pCounts[j] += cP[j]
      oppCounts[j] += cO[j]
    }

    if (r > 1) {
      start = 1 * stride + (size - r + 1)
      cP = evaluateLine(board, p, start, stride - 1, length)
      cO = evaluateLine(board, opp, start, stride - 1, length)
      for (let j = 1; j <= 5; j++) {
        pCounts[j] += cP[j]
        oppCounts[j] += cO[j]
      }
    }
  }

  if (pCounts[PATTERN_FIVE] > 0) return SCORE_WIN
  if (oppCounts[PATTERN_FIVE] > 0) return -SCORE_WIN

  let score = 0
  score += pCounts[PATTERN_OPEN_FOUR] * 1000000
  score -= oppCounts[PATTERN_OPEN_FOUR] * 1000000

  score += pCounts[PATTERN_FOUR] * 10000
  score -= oppCounts[PATTERN_FOUR] * 10000

  score += pCounts[PATTERN_OPEN_THREE] * 5000
  score -= oppCounts[PATTERN_OPEN_THREE] * 5000

  score += pCounts[PATTERN_BROKEN_THREE] * 100
  score -= oppCounts[PATTERN_BROKEN_THREE] * 100

  return score
}
