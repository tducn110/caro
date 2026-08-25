import { BotBoard } from "./board";
import { evaluatePosition } from "./eval";
import { SearchOptions, SearchResult, EMPTY, WALL } from "./interface";

const MATE_SCORE = 500000000;
const SEARCH_ABORT = Symbol("SEARCH_ABORT");

interface SearchContext {
  deadline: number;
  nodes: number;
  timeCheckMask: number;
}

function checkAbort(ctx: SearchContext) {
  ctx.nodes++;
  if ((ctx.nodes & ctx.timeCheckMask) !== 0) return;
  if (performance.now() >= ctx.deadline) {
    throw SEARCH_ABORT;
  }
}

function generateCandidates(board: BotBoard, radius: number = 2): number[] {
  const candidates: number[] = [];
  
  let minR = board.size, maxR = 1, minC = board.size, maxC = 1;
  let hasStones = false;
  for (let r = 1; r <= board.size; r++) {
    for (let c = 1; c <= board.size; c++) {
      if (board.cells[r * board.stride + c] !== EMPTY && board.cells[r * board.stride + c] !== WALL) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
        hasStones = true;
      }
    }
  }

  if (!hasStones) {
    const center = Math.floor(board.size / 2) + 1;
    return [center * board.stride + center];
  }

  minR = Math.max(1, minR - radius);
  maxR = Math.min(board.size, maxR + radius);
  minC = Math.max(1, minC - radius);
  maxC = Math.min(board.size, maxC + radius);

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const idx = r * board.stride + c;
      if (board.cells[idx] !== EMPTY) continue;
      
      let nearStone = false;
      for (let dr = -radius; dr <= radius && !nearStone; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          if (dr === 0 && dc === 0) continue;
          
          const nidx = (r + dr) * board.stride + (c + dc);
          const cell = board.cells[nidx];
          if (cell !== undefined && cell !== EMPTY && cell !== WALL) {
            nearStone = true;
            break;
          }
        }
      }
      
      if (nearStone) candidates.push(idx);
    }
  }
  
  return candidates;
}

function alphaBeta(board: BotBoard, depth: number, alpha: number, beta: number, ctx: SearchContext): number {
  checkAbort(ctx);

  if (board.checkWinAfterLastMove()) {
    // The previous player won. Since it's our turn, we lost.
    return -MATE_SCORE + (ctx.nodes * 0.01); // prefer faster wins
  }

  if (depth <= 0) {
    return evaluatePosition(board, board.sideToMove);
  }

  const moves = generateCandidates(board, 2);
  if (moves.length === 0) {
    return 0; // Draw
  }

  let best = -Infinity;

  for (const move of moves) {
    board.makeMove(move);
    let score;
    try {
      score = -alphaBeta(board, depth - 1, -beta, -alpha, ctx);
    } finally {
      board.undoMove(move);
    }

    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break; // Cutoff
  }

  return best;
}

function rootSearch(board: BotBoard, depth: number, ctx: SearchContext) {
  const moves = generateCandidates(board, 2);
  let bestMove = null;
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  // Evaluate candidate moves heuristically for ordering
  // (In a real engine, order by PV, TT, killer moves, history heuristic)
  // Simple ordering: just evaluate after 1 move
  const scoredMoves = moves.map(move => {
    board.makeMove(move);
    let score = 0;
    if (board.checkWinAfterLastMove()) {
      score = MATE_SCORE;
    } else {
      score = evaluatePosition(board, board.sideToMove);
    }
    board.undoMove(move);
    return { move, score: -score }; // negate because it's opponent's turn in evaluate
  });
  
  scoredMoves.sort((a, b) => b.score - a.score);

  for (const { move } of scoredMoves) {
    checkAbort(ctx);

    board.makeMove(move);
    let score;
    try {
      if (board.checkWinAfterLastMove()) {
        score = MATE_SCORE;
      } else {
        score = -alphaBeta(board, depth - 1, -beta, -alpha, ctx);
      }
    } finally {
      board.undoMove(move);
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }

    alpha = Math.max(alpha, score);
  }

  return { move: bestMove, score: bestScore };
}

export function findBestMove(board: BotBoard, options: SearchOptions): SearchResult {
  const start = performance.now();
  const maxDepth = options.maxDepth || 64;
  
  let timeMs = options.timeMs;
  if (options.difficulty === "easy") timeMs = 20;
  else if (options.difficulty === "normal") timeMs = 100;
  else if (options.difficulty === "hard") timeMs = 400;
  else if (options.difficulty === "expert") timeMs = 1200;

  const ctx: SearchContext = {
    deadline: start + timeMs,
    nodes: 0,
    timeCheckMask: 0x7f,
  };

  const fallbackMoves = generateCandidates(board, 2);
  let completed: { move: number | null, score: number, depth: number } = {
    move: fallbackMoves[0] ?? null,
    score: 0,
    depth: 0,
  };

  for (let depth = 1; depth <= maxDepth; depth++) {
    try {
      const result = rootSearch(board, depth, ctx);
      completed = { ...result, depth };
    } catch (err) {
      if (err !== SEARCH_ABORT) throw err;
      break;
    }

    if (Math.abs(completed.score) >= MATE_SCORE - 1000) {
      break;
    }
    if (performance.now() >= ctx.deadline) {
      break;
    }
  }

  return {
    ...completed,
    nodes: ctx.nodes,
    elapsedMs: performance.now() - start,
    reason: "completed"
  };
}
