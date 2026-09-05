import { Graphics } from "pixi.js"
import { CELL_SIZE } from "../spatial/CoordinateTransform"
import type { CellBounds } from "../spatial/VisibleBounds"

export class GridRenderer {
  readonly graphics = new Graphics()
  private lastBounds: CellBounds | null = null

  draw(bounds: CellBounds): void {
    if (this.lastBounds && sameBounds(this.lastBounds, bounds)) return
    this.lastBounds = bounds
    this.graphics.clear().lineStyle(1, 0x000000, 0.08)
    const startX = bounds.minCol * CELL_SIZE, endX = bounds.maxCol * CELL_SIZE
    const startY = bounds.minRow * CELL_SIZE, endY = bounds.maxRow * CELL_SIZE
    for (let col = bounds.minCol; col <= bounds.maxCol; col++) this.graphics.moveTo(col * CELL_SIZE, startY).lineTo(col * CELL_SIZE, endY)
    for (let row = bounds.minRow; row <= bounds.maxRow; row++) this.graphics.moveTo(startX, row * CELL_SIZE).lineTo(endX, row * CELL_SIZE)
  }
}

function sameBounds(a: CellBounds, b: CellBounds): boolean {
  return a.minRow === b.minRow && a.maxRow === b.maxRow && a.minCol === b.minCol && a.maxCol === b.maxCol
}
