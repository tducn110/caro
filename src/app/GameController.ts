import { GameState } from "../game/core/GameState"
import { FreestyleGomokuWinRule } from "../game/core/WinRules"
import type { CellCoord, Move, Player, WinResult } from "../game/core/types"
import { MatchController } from "../game/behaviors/match/MatchController"
import type { GameMode } from "../game/behaviors/match/MatchState"
import { playMove, type PlayMoveResult } from "../game/behaviors/move/PlayMove"
import { AIController } from "../game/ai/AIController"
import type { AIService, BotDifficulty } from "../game/ai/contracts"

export interface BoardStone { readonly cell: CellCoord; readonly player: Player }

export interface GameSnapshot {
  readonly match: ReturnType<MatchController["snapshot"]>
  readonly currentPlayer: Player
  readonly aiThinking: boolean
  readonly board: readonly BoardStone[]
  readonly history: readonly Move[]
  readonly lastMove: Move | null
}

export class GameController {
  private readonly state = new GameState()
  private readonly match = new MatchController()
  private readonly winRule = new FreestyleGomokuWinRule()
  private readonly ai: AIService
  private currentPlayer: Player = "X"
  private aiThinking = false
  private turnToken = 0
  private listeners = new Set<() => void>()
  private cachedSnapshot: GameSnapshot

  constructor(ai: AIService = new AIController()) {
    this.ai = ai
    this.cachedSnapshot = this.makeSnapshot()
  }

  private makeSnapshot(): GameSnapshot {
    const history = this.state.getHistory().map((move) => ({ ...move, cell: { ...move.cell } }))
    const board: BoardStone[] = []
    this.state.forEachStone((cell, player) => board.push({ cell: { ...cell }, player }))
    const lastMove = history[history.length - 1] ?? null
    return { match: this.match.snapshot(), currentPlayer: this.currentPlayer, aiThinking: this.aiThinking, board, history, lastMove }
  }

  snapshot(): GameSnapshot { return this.cachedSnapshot }
  subscribe(listener: () => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  private notify(): void { this.cachedSnapshot = this.makeSnapshot(); this.listeners.forEach((listener) => listener()) }

  playCell(cell: CellCoord): PlayMoveResult {
    const current = this.match.snapshot()
    if (current.phase === "setup" || current.phase === "ready") this.match.startRound()
    const playing = this.match.snapshot()
    if (playing.phase === "game-over") return { type: "rejected", reason: "match-ended" }
    if (this.aiThinking) return { type: "rejected", reason: "input-locked" }
    if (playing.mode === "ai" && this.currentPlayer !== "X") return { type: "rejected", reason: "wrong-turn" }

    const result = playMove(this.state, this.winRule, { player: this.currentPlayer, cell })
    if (result.type !== "accepted") return result
    this.finishMove(result.win)
    this.notify()
    if (!result.win && this.match.snapshot().mode === "ai" && this.currentPlayer === "O") this.startAiTurn()
    return result
  }

  private finishMove(win: WinResult | null): void {
    if (win) this.match.finish(win)
    else this.currentPlayer = this.currentPlayer === "X" ? "O" : "X"
  }

  replay(): void {
    this.invalidateAiTurn()
    this.state.reset()
    this.currentPlayer = "X"
    this.match.replay()
    this.notify()
  }

  newGame(): void {
    this.invalidateAiTurn()
    this.state.reset()
    this.currentPlayer = "X"
    this.match.newGame()
    this.notify()
  }

  setMode(mode: GameMode): void {
    this.invalidateAiTurn()
    this.state.reset()
    this.currentPlayer = "X"
    this.match.newGame()
    this.match.chooseMode(mode)
    this.notify()
  }

  setDifficulty(difficulty: BotDifficulty): void {
    this.invalidateAiTurn()
    this.state.reset()
    this.currentPlayer = "X"
    this.match.newGame()
    this.match.chooseDifficulty(difficulty)
    this.notify()
  }

  destroy(): void { this.invalidateAiTurn(); this.ai.destroy() }

  private invalidateAiTurn(): void {
    this.turnToken++
    this.aiThinking = false
    this.ai.cancelPending()
  }

  private startAiTurn(): void {
    const token = ++this.turnToken
    const roundId = this.match.snapshot().roundId
    const difficulty = this.match.snapshot().difficulty
    this.aiThinking = true
    this.notify()
    void this.ai.requestMove(this.state, roundId, difficulty).then((result) => {
      const current = this.match.snapshot()
      if (token !== this.turnToken || result.roundId !== current.roundId || current.phase !== "playing" || current.mode !== "ai" || this.currentPlayer !== "O") return
      this.aiThinking = false
      if (result.move) {
        const moveResult = playMove(this.state, this.winRule, { player: "O", cell: result.move })
        if (moveResult.type === "accepted") this.finishMove(moveResult.win)
      }
      this.notify()
    }).catch(() => {
      if (token === this.turnToken) { this.aiThinking = false; this.notify() }
    })
  }
}
