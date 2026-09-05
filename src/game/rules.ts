/** @deprecated Import FreestyleGomokuWinRule from ./core/WinRules. */
import { FreestyleGomokuWinRule } from "./core/WinRules"
import type { GameState } from "./core/GameState"
import type { WinResult } from "./core/types"

const rule = new FreestyleGomokuWinRule()
export function checkWinner(state: GameState, row: number, col: number): WinResult | null {
  return rule.evaluate(state, { row, col })
}
