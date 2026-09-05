import { BotBoard } from "./board"
import { findBestMove } from "./search"
import type { AIRequest } from "../ai/contracts"

self.onmessage = (e) => {
  const data = e.data

  if (data.type === "search") {
    const { id, request } = data as {
      id: number
      request: AIRequest
    }

    const board = new BotBoard(request.position.size)
    board.load(request.position.cells, request.position.sideToMove, request.position.lastMove)

    const result = findBestMove(board, request.budget)

    self.postMessage({
      type: "result",
      id,
      request,
      result,
    })
  }
}
