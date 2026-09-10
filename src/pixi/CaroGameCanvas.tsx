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

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        if (sceneRef.current) {
          sceneRef.current.app.resize()
          sceneRef.current.refreshVisibleBoard()
        }
      })
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      resizeObserver?.disconnect()
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
        minHeight: 0,
        overflow: "hidden",
        position: "relative",
        touchAction: "none",
      }}
    />
  )
}
