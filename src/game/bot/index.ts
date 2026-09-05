import type { AIRequest, AIResult } from "../ai/contracts"
import type { SearchResult } from "./interface"

interface PendingRequest {
  resolve: (result: AIResult) => void
  reject: (error: unknown) => void
}

export class GomokuEngine {
  private worker: Worker | null = null
  private nextWorkerRequestId = 0
  private readonly pending = new Map<number, PendingRequest>()

  constructor() { this.createWorker() }

  private createWorker(): void {
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })
    this.worker.onmessage = (event) => {
      const data = event.data as { type: "result"; id: number; request: AIRequest; result: SearchResult }
      if (data.type !== "result") return
      const pending = this.pending.get(data.id)
      if (!pending) return
      this.pending.delete(data.id)
      const rawMove = data.result.move
      const stride = data.request.position.size + 2
      const move = rawMove === null
        ? null
        : {
            row: Math.floor(rawMove / stride) - 1 - data.request.position.offset.row,
            col: (rawMove % stride) - 1 - data.request.position.offset.col,
          }
      pending.resolve({
        requestId: data.request.requestId,
        roundId: data.request.roundId,
        move,
        stats: {
          depth: data.result.depth,
          nodes: data.result.nodes,
          elapsedMs: data.result.elapsedMs,
          reason: data.result.reason,
        },
      })
    }
    this.worker.onerror = (error) => {
      for (const pending of this.pending.values()) pending.reject(error)
      this.pending.clear()
    }
  }

  search(request: AIRequest): Promise<AIResult> {
    const id = ++this.nextWorkerRequestId
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error("AI engine is destroyed"))
        return
      }
      this.pending.set(id, { resolve, reject })
      try {
        this.worker.postMessage({ type: "search", id, request })
      } catch (error) {
        this.pending.delete(id)
        reject(error)
      }
    })
  }

  cancelPending(): void {
    const cancellation = new Error("AI search cancelled")
    for (const pending of this.pending.values()) pending.reject(cancellation)
    this.pending.clear()
    this.worker?.terminate()
    this.createWorker()
  }

  destroy(): void {
    const cancellation = new Error("AI engine destroyed")
    for (const pending of this.pending.values()) pending.reject(cancellation)
    this.pending.clear()
    this.worker?.terminate()
    this.worker = null
  }
}
