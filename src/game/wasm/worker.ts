/// <reference lib="webworker" />

import init, { Game } from "./engine/gomoku_engine"
import type { WasmAIRequest, WasmAIResult } from "./contracts"
import { WASM_DIFFICULTIES, WASM_SEARCH_DEPTHS } from "./contracts"

let engineInitialization: Promise<void> | null = null

function initializeEngine(): Promise<void> {
  engineInitialization ??= init().then(() => undefined)
  return engineInitialization
}

function hydrateGame(history: WasmAIRequest["history"]): Game {
  const game = new Game()
  for (const move of history) {
    if (!game.play_move(move.cell.col, move.cell.row)) {
      game.free()
      throw new Error(`Unable to hydrate Gomoku engine at move ${move.index}`)
    }
  }
  return game
}

self.onmessage = async (event: MessageEvent<{ type: "search"; id: number; request: WasmAIRequest }>) => {
  const { id, request } = event.data
  if (event.data.type !== "search") return

  try {
    await initializeEngine()
    const startedAt = performance.now()
    const game = hydrateGame(request.history)
    const rawMove = game.ai_move(WASM_DIFFICULTIES[request.difficulty]) as { x: number; y: number } | null
    game.free()

    const result: WasmAIResult = {
      requestId: request.requestId,
      roundId: request.roundId,
      move: rawMove ? { row: rawMove.y, col: rawMove.x } : null,
      stats: {
        depth: WASM_SEARCH_DEPTHS[request.difficulty],
        nodes: 0,
        elapsedMs: performance.now() - startedAt,
        reason: rawMove ? "completed" : "no-move",
      },
    }
    self.postMessage({ type: "result", id, result })
  } catch (error) {
    self.postMessage({
      type: "error",
      id,
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
