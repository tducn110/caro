import { describe, expect, it } from "vitest"
import { MatchController } from "../../src/game/behaviors/match/MatchController"

describe("MatchController draw lifecycle", () => {
  it("ends a playing round as a draw without assigning a winner", () => {
    const match = new MatchController()
    match.startRound()

    expect(match.finishDraw()).toBe(true)
    expect(match.snapshot()).toMatchObject({ phase: "game-over", winner: null, isDraw: true })
  })
})
