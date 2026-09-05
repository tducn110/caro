import { BotBoard, EMPTY, WALL, ZobristSideLo, ZobristSideHi } from "./board"
import {
  evaluatePosition,
  SCORE_WIN,
  PATTERN_FIVE,
  PATTERN_OPEN_FOUR,
  PATTERN_FOUR,
} from "./eval"
import { SearchOptions, SearchResult } from "./interface"

const MATE_SCORE = SCORE_WIN
const SEARCH_ABORT = Symbol("SEARCH_ABORT")

// Transposition Table
const TT_SIZE = 1000003
const ttHashLo = new Int32Array(TT_SIZE)
const ttHashHi = new Int32Array(TT_SIZE)
const ttDepth = new Uint8Array(TT_SIZE) // BUG 9 fix: Uint8 (max 255) not Int8 (max 127)
const ttScore = new Int32Array(TT_SIZE)
const ttFlag = new Uint8Array(TT_SIZE)
const ttMove = new Int32Array(TT_SIZE)

const FLAG_EXACT = 0
const FLAG_LOWER = 1
const FLAG_UPPER = 2

let searchNodes = 0
let betaCutoffs = 0
let searchDeadline = 0
// BUG 10 fix: check every 32 nodes (0x1f) instead of 256 (0xff)
// Each node is expensive (~450 make/unmake in generateCandidates),
// so 256-node batches could overshoot deadline by 100ms+.
const timeCheckMask = 0x1f

function checkAbort() {
  if (searchNodes === 1 || (searchNodes & timeCheckMask) === 0) {
    if (performance.now() >= searchDeadline) {
      throw SEARCH_ABORT
    }
  }
}

function probeTT(
  board: BotBoard,
  depth: number,
  alpha: number,
  beta: number,
): { hit: boolean; score?: number; move?: number } {
  const index = (board.hashLo >>> 0) % TT_SIZE
  if (ttHashLo[index] === board.hashLo && ttHashHi[index] === board.hashHi) {
    const cachedMove = ttMove[index]
    if (ttDepth[index] >= depth) {
      const flag = ttFlag[index]
      const score = ttScore[index]
      if (flag === FLAG_EXACT) return { hit: true, score, move: cachedMove }
      if (flag === FLAG_LOWER && score >= beta)
        return { hit: true, score, move: cachedMove }
      if (flag === FLAG_UPPER && score <= alpha)
        return { hit: true, score, move: cachedMove }
    }
    return { hit: false, move: cachedMove }
  }
  return { hit: false }
}

function storeTT(
  board: BotBoard,
  depth: number,
  score: number,
  flag: number,
  bestMove: number,
) {
  const index = (board.hashLo >>> 0) % TT_SIZE
  ttHashLo[index] = board.hashLo
  ttHashHi[index] = board.hashHi
  ttDepth[index] = depth
  ttScore[index] = score
  ttFlag[index] = flag
  ttMove[index] = bestMove
}

function generateCandidates(
  board: BotBoard,
  onlyForcing: boolean = false,
): number[] {
  const emptyCells = []
  let minR = board.size,
    maxR = 1,
    minC = board.size,
    maxC = 1

  for (let r = 1; r <= board.size; r++) {
    for (let c = 1; c <= board.size; c++) {
      const idx = r * board.stride + c
      const cell = board.cells[idx]
      if (cell !== EMPTY && cell !== WALL) {
        if (r < minR) minR = r
        if (r > maxR) maxR = r
        if (c < minC) minC = c
        if (c > maxC) maxC = c
      } else if (cell === EMPTY) {
        emptyCells.push(idx)
      }
    }
  }

  if (emptyCells.length === board.size * board.size) {
    const center = Math.floor(board.size / 2) + 1
    return [center * board.stride + center]
  }

  minR = Math.max(1, minR - 2)
  maxR = Math.min(board.size, maxR + 2)
  minC = Math.max(1, minC - 2)
  maxC = Math.min(board.size, maxC + 2)

  const candidates: number[] = []
  const p = board.sideToMove
  const opp = (3 - p) as 1 | 2

  for (const idx of emptyCells) {
    const r = Math.floor(idx / board.stride)
    const c = idx % board.stride
    const inProximity =
      r >= minR && r <= maxR && c >= minC && c <= maxC

    // --- Check what WE get by playing here ---
    board.makeMove(idx)
    const pWin = board.counts[p][PATTERN_FIVE] > 0
    const pOpenFour = board.counts[p][PATTERN_OPEN_FOUR] > 0
    const pFour = board.counts[p][PATTERN_FOUR] > 0
    board.undoMove(idx)

    let isForcing = false
    if (pWin || pOpenFour || pFour) isForcing = true

    // --- Check what OPP gets by playing here (BUG 3 fix: safe state restore) ---
    // We mutate sideToMove then call make/undo. Save hash + side so that even
    // if an exception is thrown mid-sequence the board is fully restored.
    if (!isForcing) {
      const savedHashLo = board.hashLo
      const savedHashHi = board.hashHi
      const savedSide = board.sideToMove

      let oppWouldWin = false
      let oppWouldOpenFour = false
      let oppWouldFour = false // BUG 11 fix: also track FOUR (not just OPEN_FOUR)

      board.sideToMove = opp
      board.makeMove(idx)
      try {
        oppWouldWin = board.counts[opp][PATTERN_FIVE] > 0
        oppWouldOpenFour = board.counts[opp][PATTERN_OPEN_FOUR] > 0
        oppWouldFour = board.counts[opp][PATTERN_FOUR] > 0 // BUG 2 fix
      } finally {
        board.undoMove(idx)
        // Restore hash + side explicitly — undoMove restores sideToMove to opp
        // but our original sideToMove was p, and the hash represents p-to-move.
        board.hashLo = savedHashLo
        board.hashHi = savedHashHi
        board.sideToMove = savedSide
      }

      // BUG 2 & 11 fix: block opp FOUR (closed four), not just OPEN_FOUR
      if (oppWouldWin || oppWouldOpenFour || oppWouldFour) isForcing = true
    }

    if (isForcing || (!onlyForcing && inProximity)) {
      let nearStone = false
      if (!isForcing) {
        for (let dr = -2; dr <= 2 && !nearStone; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            if (dr === 0 && dc === 0) continue
            const cell = board.cells[(r + dr) * board.stride + (c + dc)]
            if (cell !== undefined && cell !== EMPTY && cell !== WALL) {
              nearStone = true
              break
            }
          }
        }
      }

      if (isForcing || nearStone) {
        candidates.push(idx)
      }
    }
  }

  return candidates
}

// BUG 12 fix: restore hash-move priority so TT move ordering actually works.
// Without `if (move === hashMove) return BIG`, every move gets scored via
// evaluatePosition() and the TT's recommended move loses its ordering advantage,
// breaking the whole point of storing a best move in the TT.
function scoreMove(board: BotBoard, move: number, hashMove: number): number {
  if (move === hashMove) return 2_000_000_000

  board.makeMove(move)
  let score = 0
  try {
    const mover = board.sideToMove === 1 ? 2 : 1
    const opp = board.sideToMove
    if (board.counts[mover][PATTERN_FIVE] > 0) score = 1_000_000_000
    else score = -evaluatePosition(board, opp)
  } finally {
    board.undoMove(move)
  }
  return score
}

function quiescence(
  board: BotBoard,
  alpha: number,
  beta: number,
  ply: number,
  qDepth: number,
): number {
  searchNodes++
  checkAbort()

  const prev = 3 - board.sideToMove
  if (board.counts[prev][PATTERN_FIVE] > 0) return -MATE_SCORE + ply
  if (board.counts[board.sideToMove][PATTERN_FIVE] > 0) return MATE_SCORE - ply

  const standPat = evaluatePosition(board, board.sideToMove)
  if (standPat >= beta) return beta
  if (alpha < standPat) alpha = standPat

  if (qDepth >= 5) return alpha

  const moves = generateCandidates(board, true)
  if (moves.length === 0) return alpha

  const scoredMoves = moves.map((m) => ({ move: m, score: scoreMove(board, m, -1) }))
  scoredMoves.sort((a, b) => b.score - a.score)

  for (const { move } of scoredMoves) {
    board.makeMove(move)
    let score = 0
    try {
      score = -quiescence(board, -beta, -alpha, ply + 1, qDepth + 1)
    } finally {
      board.undoMove(move)
    }

    if (score >= beta) return beta
    if (score > alpha) alpha = score
  }

  return alpha
}

function alphaBeta(
  board: BotBoard,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
): number {
  searchNodes++
  checkAbort()

  const prev = 3 - board.sideToMove
  if (board.counts[prev][PATTERN_FIVE] > 0) {
    return -MATE_SCORE + ply
  }

  if (depth <= 0) {
    return quiescence(board, alpha, beta, ply, 0)
  }

  const tt = probeTT(board, depth, alpha, beta)
  if (tt.hit) {
    return tt.score!
  }

  const moves = generateCandidates(board, false)
  if (moves.length === 0) return 0

  const hashMove = tt.move ?? -1
  const scoredMoves = moves.map((m) => ({
    move: m,
    score: scoreMove(board, m, hashMove),
  }))
  scoredMoves.sort((a, b) => b.score - a.score)

  let best = -Infinity
  let bestHeuristic = -Infinity
  let bestMove = -1
  const originalAlpha = alpha

  for (let i = 0; i < scoredMoves.length; i++) {
    const { move, score: hScore } = scoredMoves[i]
    betaCutoffs // referenced to keep var alive
    board.makeMove(move)
    let score = 0
    try {
      score = -alphaBeta(board, depth - 1, -beta, -alpha, ply + 1)
    } finally {
      board.undoMove(move)
    }

    if (score > best || (score === best && hScore > bestHeuristic)) {
      best = score
      bestMove = move
      bestHeuristic = hScore
    }
    if (score > alpha) alpha = score
    if (alpha >= beta) {
      betaCutoffs++
      break
    }
  }

  let flag = FLAG_EXACT
  if (best <= originalAlpha) flag = FLAG_UPPER
  else if (best >= beta) flag = FLAG_LOWER

  storeTT(board, depth, best, flag, bestMove)

  return best
}

export function findBestMove(
  board: BotBoard,
  options: SearchOptions,
): SearchResult {
  const start = performance.now()
  searchNodes = 0
  betaCutoffs = 0

  const timeMs = options.timeMs

  searchDeadline = start + timeMs - 5

  const moves = generateCandidates(board, false)
  let bestGlobalMove: number | null = moves[0] ?? null
  let bestGlobalScore = 0
  let completedDepth = 0

  const maxDepth = Math.max(1, options.maxDepth)
  let timedOut = false
  for (let depth = 1; depth <= maxDepth; depth++) {
    const beta = Infinity
    let alpha = -Infinity
    let best = -Infinity
    let bestHeuristic = -Infinity
    let bestMove = -1
    let aborted = false

    try {
      const hashMove = bestGlobalMove ?? -1
      const scoredMoves = moves.map((m) => ({
        move: m,
        score: scoreMove(board, m, hashMove),
      }))
      scoredMoves.sort((a, b) => b.score - a.score)

      for (let i = 0; i < scoredMoves.length; i++) {
        const { move, score: hScore } = scoredMoves[i]
        board.makeMove(move)
        let score = 0
        try {
          score = -alphaBeta(board, depth - 1, -beta, -alpha, 1)
        } finally {
          board.undoMove(move)
        }

        if (score > best || (score === best && hScore > bestHeuristic)) {
          best = score
          bestMove = move
          bestHeuristic = hScore
        }
        if (score > alpha) alpha = score
      }
    } catch (err) {
      if (err !== SEARCH_ABORT) throw err
      aborted = true
      timedOut = true
    }

    if (!aborted) {
      bestGlobalMove = bestMove
      bestGlobalScore = best
      completedDepth = depth
    } else {
      break
    }

    if (Math.abs(bestGlobalScore) >= MATE_SCORE - 1000) break
    if (performance.now() >= searchDeadline) break
  }

  return {
    move: bestGlobalMove,
    score: bestGlobalScore,
    depth: completedDepth,
    nodes: searchNodes,
    elapsedMs: performance.now() - start,
    reason: bestGlobalMove === null ? "no-move" : timedOut ? "timeout" : Math.abs(bestGlobalScore) >= MATE_SCORE - 1000 ? "mate" : "completed",
  }
}
