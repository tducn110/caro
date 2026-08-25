import { SearchOptions, SearchResult, PositionInput, BLACK, WHITE, EMPTY } from "./interface";
import { GameState } from "../state";

export class GomokuEngine {
  private worker: Worker;
  private currentRequestId = 0;
  private resolvePromise: ((res: SearchResult) => void) | null = null;
  private boardSize: number;

  constructor(boardSize: number = 20) { // arbitrary size, or could be dynamic
    this.boardSize = boardSize;
    // Create the worker
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    
    this.worker.onmessage = (e) => {
      const data = e.data;
      if (data.type === "result" && data.id === this.currentRequestId) {
        if (this.resolvePromise) {
          this.resolvePromise(data.result);
          this.resolvePromise = null;
        }
      }
    };
  }

  // Convert map-based GameState to 1D Uint8Array
  private preparePosition(state: GameState): PositionInput {
    const size = this.boardSize;
    const cells = new Uint8Array(size * size).fill(EMPTY);
    
    // Default offset to put the game in the middle of our bounded board
    // Caro has infinite board in UI, but AI needs bounds.
    // Let's find bounding box and map it to center
    const bounds = state.bounds;
    let offsetR = 0;
    let offsetC = 0;
    
    if (state.history.length > 0) {
      const centerR = Math.floor((bounds.minR + bounds.maxR) / 2);
      const centerC = Math.floor((bounds.minC + bounds.maxC) / 2);
      offsetR = Math.floor(size / 2) - centerR;
      offsetC = Math.floor(size / 2) - centerC;
    } else {
      // First move logic if needed
    }

    state.board.forEach((player, key) => {
      const [r, c] = key.split(",").map(Number);
      const mapR = r + offsetR;
      const mapC = c + offsetC;
      if (mapR >= 0 && mapR < size && mapC >= 0 && mapC < size) {
        cells[mapR * size + mapC] = player === "X" ? BLACK : WHITE;
      }
    });

    const sideToMove = (state.history.length % 2 === 0) ? BLACK : WHITE;
    let lastMove = null;
    if (state.history.length > 0) {
      const last = state.history[state.history.length - 1];
      const mapR = last.row + offsetR;
      const mapC = last.col + offsetC;
      if (mapR >= 0 && mapR < size && mapC >= 0 && mapC < size) {
        lastMove = mapR * size + mapC;
      }
    }

    // Attach offsets so we can translate the result back to global coordinates
    (cells as any).__offset = { r: offsetR, c: offsetC };

    return { size, cells, sideToMove, lastMove };
  }

  public async findBestMove(state: GameState, options: SearchOptions): Promise<{ row: number, col: number } | null> {
    const position = this.preparePosition(state);
    const offsetR = (position.cells as any).__offset.r;
    const offsetC = (position.cells as any).__offset.c;

    this.currentRequestId++;
    
    return new Promise((resolve) => {
      this.resolvePromise = (res: SearchResult) => {
        if (res.move !== null) {
          // Convert move index back to row/col
          const stride = position.size + 2;
          const mapR = Math.floor(res.move / stride) - 1;
          const mapC = (res.move % stride) - 1;
          
          const row = mapR - offsetR;
          const col = mapC - offsetC;
          resolve({ row, col });
        } else {
          resolve(null);
        }
      };
      
      this.worker.postMessage({
        type: "search",
        id: this.currentRequestId,
        position,
        options
      });
    });
  }

  public destroy() {
    this.worker.terminate();
  }
}
