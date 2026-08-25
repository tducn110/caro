import { BotBoard } from "./board";
import { EMPTY, WALL } from "./interface";

const SCORE_WIN = 100000000;
const SCORE_OPEN_FOUR = 10000000;
const SCORE_FOUR = 1000000;
const SCORE_OPEN_THREE = 100000;
const SCORE_THREE = 10000;
const SCORE_OPEN_TWO = 1000;
const SCORE_TWO = 100;

function evaluateLine(board: BotBoard, index: number, step: number, player: number): number {
  let count = 1;
  let block1 = 1;
  let block2 = 1;
  let emptyCount = 0;

  // Forward
  let p = index + step;
  while (board.cells[p] === player) {
    count++;
    p += step;
  }
  if (board.cells[p] === EMPTY) {
    block1 = 0;
    emptyCount++;
  } else if (board.cells[p] === WALL || board.cells[p] === (3 - player)) {
    block1 = 1;
  }

  // Backward
  p = index - step;
  while (board.cells[p] === player) {
    count++;
    p -= step;
  }
  if (board.cells[p] === EMPTY) {
    block2 = 0;
    emptyCount++;
  } else if (board.cells[p] === WALL || board.cells[p] === (3 - player)) {
    block2 = 1;
  }

  const blocks = block1 + block2;

  if (count >= 5) return SCORE_WIN;
  if (count === 4) {
    if (blocks === 0) return SCORE_OPEN_FOUR;
    if (blocks === 1) return SCORE_FOUR;
  }
  if (count === 3) {
    if (blocks === 0) return SCORE_OPEN_THREE;
    if (blocks === 1) return SCORE_THREE;
  }
  if (count === 2) {
    if (blocks === 0) return SCORE_OPEN_TWO;
    if (blocks === 1) return SCORE_TWO;
  }
  return 0;
}

export function evaluatePosition(board: BotBoard, sideToMove: number): number {
  let score = 0;
  const dirs = [1, board.stride, board.stride + 1, board.stride - 1];

  // A very basic evaluation that checks all stones. 
  // In a real optimized engine, we update eval incrementally.
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

  if (!hasStones) return 0;

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const idx = r * board.stride + c;
      const player = board.cells[idx];
      if (player === EMPTY || player === WALL) continue;

      let cellScore = 0;
      for (const step of dirs) {
        // Only evaluate from the "start" of a line to avoid double counting
        if (board.cells[idx - step] !== player) {
          cellScore += evaluateLine(board, idx, step, player);
        }
      }

      if (player === sideToMove) {
        score += cellScore;
      } else {
        score -= cellScore; // Opponent has this score, so it's bad for us
      }
    }
  }

  // Add small random noise to prevent identical scores and add variety
  score += Math.random() * 10 - 5; 

  return score;
}
