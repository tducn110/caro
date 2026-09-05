import type { GameState } from "../core/GameState"
import type { AIRequest, AIResult, AIService, BotDifficulty } from "./contracts"
import { SEARCH_BUDGETS } from "./contracts"
import { SearchPositionBuilder } from "./SearchPositionBuilder"
import { GomokuEngine } from "../bot"

export class AIController implements AIService {
  private readonly builder = new SearchPositionBuilder(25)
  private readonly engine = new GomokuEngine()
  private nextRequestId = 0

  requestMove(state: GameState, roundId: number, difficulty: BotDifficulty): Promise<AIResult> {
    const request: AIRequest = { requestId: ++this.nextRequestId, roundId, position: this.builder.build(state), difficulty, budget: SEARCH_BUDGETS[difficulty] }
    return this.engine.search(request)
  }

  cancelPending(): void { this.engine.cancelPending() }
  destroy(): void { this.engine.destroy() }
}
