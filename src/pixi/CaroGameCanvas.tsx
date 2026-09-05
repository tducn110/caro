import { useEffect, useRef } from "react"
import { CaroScene } from "./CaroScene"
import type { CellCoord } from "../game/core/types"
import type { BoardRenderStone } from "./CaroScene"

interface CaroGameCanvasProps {
  board: readonly BoardRenderStone[]
  lastMove: CellCoord | null
  winCellSet: ReadonlySet<string>
  onCellClick: (r: number, c: number) => void
}

export function CaroGameCanvas({
  board,
  lastMove,
  winCellSet,
  onCellClick,
}: CaroGameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<CaroScene | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const canvas = document.createElement("canvas")
    canvas.style.display = "block"
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    containerRef.current.appendChild(canvas)

    const scene = new CaroScene(canvas)
    scene.onCellClick = onCellClick
    sceneRef.current = scene

    // Initial sync
    scene.syncState(board, lastMove, winCellSet)

    if (import.meta.env.DEV) {
      void (async () => {
        const { attachPixiDevtools } = await import("./devtools")
        await attachPixiDevtools(scene.app)
      })()
    }

    return () => {
      scene.destroy()
      if (containerRef.current?.contains(canvas)) {
        containerRef.current.removeChild(canvas)
      }
    }
  }, [])

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.syncState(board, lastMove, winCellSet)
    }
  }, [board, lastMove, winCellSet])

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.onCellClick = onCellClick
    }
  }, [onCellClick])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "400px",
        overflow: "hidden",
        position: "relative",
        borderRadius: 4,
        borderTop: "3px solid var(--paper-deep)",
        borderLeft: "1px solid var(--grid-line)",
        touchAction: "none",
      }}
    />
  )
}
