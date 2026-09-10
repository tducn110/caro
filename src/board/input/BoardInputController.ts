import type { CellCoord } from "../../game/core/types"
import type { CameraState } from "../spatial/Camera"
import type { CoordinateTransform } from "../spatial/CoordinateTransform"
import { isBoardCell } from "../../game/core/BoardBounds"

export type BoardGesture = { type: "PAN"; dx: number; dy: number } | { type: "CELL_TAP"; cell: CellCoord }
export type PointerGestureState = "idle" | "pressed" | "dragging"

export class BoardInputController {
  state: PointerGestureState = "idle"
  private lastPointer = { x: 0, y: 0 }
  constructor(private readonly transform: CoordinateTransform, private readonly dragThreshold = 6) {}
  pointerDown(x: number, y: number): void { this.state = "pressed"; this.lastPointer = { x, y } }
  pointerMove(x: number, y: number): BoardGesture | null {
    const dx = x - this.lastPointer.x, dy = y - this.lastPointer.y
    if (this.state === "pressed" && Math.hypot(dx, dy) > this.dragThreshold) this.state = "dragging"
    this.lastPointer = { x, y }
    return this.state === "dragging" ? { type: "PAN", dx, dy } : null
  }
  pointerUp(x: number, y: number, camera: CameraState): BoardGesture | null {
    const cell = this.transform.screenToCell(x, y, camera)
    const gesture = this.state === "pressed" && isBoardCell(cell) ? { type: "CELL_TAP" as const, cell } : null
    this.state = "idle"
    return gesture
  }
}
