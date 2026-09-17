import type { GameState } from "../core/GameState"
import type { AIResult, AIService, BotDifficulty } from "./contracts"
import { GomokuWasmEngine } from "../wasm/GomokuWasmEngine"
import { findForcedTacticalMove } from "./TacticalMoveResolver"

export class AIController implements AIService {
  private readonly engine = new GomokuWasmEngine()
  private nextRequestId = 0

  requestMove(state: GameState, roundId: number, difficulty: BotDifficulty): Promise<AIResult> {
    const requestId = ++this.nextRequestId
    const tacticalMove = findForcedTacticalMove(state, "O")
    if (tacticalMove) {
      return Promise.resolve({
        requestId,
        roundId,
        move: tacticalMove,
        stats: { depth: 0, nodes: 0, elapsedMs: 0, reason: "completed" },
      })
    }

    const request = {
      requestId,
      roundId,
      difficulty,
      history: state.getHistory().map((move) => ({ ...move, cell: { ...move.cell } })),
    }
    return this.engine.search(request)
  }

  cancelPending(): void { this.engine.cancelPending() }
  destroy(): void { this.engine.destroy() }
}
