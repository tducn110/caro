import type { WasmAIRequest, WasmAIResult } from "./contracts"

interface PendingRequest {
  resolve: (result: WasmAIResult) => void
  reject: (error: unknown) => void
}

type WorkerMessage =
  | { type: "result"; id: number; result: WasmAIResult }
  | { type: "error"; id: number; message: string }

/**
 * Owns the WASM worker lifecycle. GameController remains responsible for
 * deciding whether a completed result is still allowed to commit.
 */
export class GomokuWasmEngine {
  private worker: Worker | null = null
  private nextWorkerRequestId = 0
  private readonly pending = new Map<number, PendingRequest>()

  constructor() {
    this.createWorker()
  }

  search(request: WasmAIRequest): Promise<WasmAIResult> {
    const id = ++this.nextWorkerRequestId
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error("Gomoku WASM engine is destroyed"))
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
    this.rejectPending(new Error("Gomoku WASM search cancelled"))
    this.worker?.terminate()
    this.createWorker()
  }

  destroy(): void {
    this.rejectPending(new Error("Gomoku WASM engine destroyed"))
    this.worker?.terminate()
    this.worker = null
  }

  private createWorker(): void {
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })
    this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data
      const pending = this.pending.get(message.id)
      if (!pending) return
      this.pending.delete(message.id)
      if (message.type === "result") pending.resolve(message.result)
      else pending.reject(new Error(message.message))
    }
    this.worker.onerror = (event) => {
      this.rejectPending(event.error ?? new Error(event.message))
    }
  }

  private rejectPending(error: Error): void {
    for (const pending of this.pending.values()) pending.reject(error)
    this.pending.clear()
  }
}
