import type { GameState } from "../core/GameState"
import type { AIResult, AIService, BotDifficulty } from "./contracts"
import { GomokuWasmEngine } from "../wasm/GomokuWasmEngine"

export class AIController implements AIService {
  private readonly engine = new GomokuWasmEngine()
  private nextRequestId = 0

  requestMove(state: GameState, roundId: number, difficulty: BotDifficulty): Promise<AIResult> {
    const request = {
      requestId: ++this.nextRequestId,
      roundId,
      difficulty,
      history: state.getHistory().map((move) => ({ ...move, cell: { ...move.cell } })),
    }
    return this.engine.search(request)
  }

  cancelPending(): void { this.engine.cancelPending() }
  destroy(): void { this.engine.destroy() }
}
