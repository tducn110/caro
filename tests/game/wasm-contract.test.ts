import { describe, expect, it } from "vitest"
import { WASM_DIFFICULTIES, WASM_SEARCH_DEPTHS } from "../../src/game/wasm/contracts"

describe("Gomoku WASM difficulty contract", () => {
  it("maps every UI difficulty to the supported Rust engine difficulty", () => {
    expect(WASM_DIFFICULTIES).toEqual({ easy: 0, normal: 1, hard: 2, expert: 3, master: 4 })
    expect(WASM_SEARCH_DEPTHS).toEqual({ easy: 1, normal: 2, hard: 4, expert: 6, master: 8 })
  })
})
