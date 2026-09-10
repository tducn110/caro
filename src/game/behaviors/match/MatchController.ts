import type { WinResult } from "../../core/types"
import type { BotDifficulty, GameMode, MatchPhase, MatchState } from "./MatchState"

export class MatchController {
  private state: MatchState = { phase: "ready", mode: "1v1", difficulty: "normal", winner: null, isDraw: false, roundId: 0 }

  snapshot(): MatchState { return { ...this.state } }

  chooseMode(mode: GameMode): boolean {
    if (this.state.phase === "playing") return false
    this.state.mode = mode
    this.state.phase = "ready"
    return true
  }

  chooseDifficulty(difficulty: BotDifficulty): boolean {
    if (this.state.phase === "playing") return false
    this.state.difficulty = difficulty
    this.state.phase = "ready"
    return true
  }

  startRound(): boolean {
    if (this.state.phase !== "setup" && this.state.phase !== "ready") return false
    this.state.roundId++
    this.state.phase = "playing"
    this.state.winner = null
    this.state.isDraw = false
    return true
  }

  replay(): boolean {
    if (this.state.phase !== "playing" && this.state.phase !== "game-over") return false
    this.state.roundId++
    this.state.phase = "playing"
    this.state.winner = null
    this.state.isDraw = false
    return true
  }

  finish(result: WinResult): boolean {
    if (this.state.phase !== "playing") return false
    this.state.winner = result
    this.state.phase = "game-over"
    return true
  }

  finishDraw(): boolean {
    if (this.state.phase !== "playing") return false
    this.state.winner = null
    this.state.isDraw = true
    this.state.phase = "game-over"
    return true
  }

  newGame(): boolean {
    this.state.roundId++
    this.state.phase = "setup"
    this.state.winner = null
    this.state.isDraw = false
    return true
  }
}
