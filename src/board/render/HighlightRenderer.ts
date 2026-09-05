import { Graphics } from "pixi.js"
import type { CellCoord } from "../../game/core/types"
import { CELL_SIZE } from "../spatial/CoordinateTransform"

export class HighlightRenderer {
  readonly graphics = new Graphics()
  draw(lastMove: CellCoord | null, winningCells: ReadonlySet<string>): void {
    this.graphics.clear()
    if (lastMove) this.graphics.beginFill(0x000000, 0.05).drawRect(lastMove.col * CELL_SIZE, lastMove.row * CELL_SIZE, CELL_SIZE, CELL_SIZE).endFill()
    for (const key of winningCells) { const [row, col] = key.split(",").map(Number); this.graphics.beginFill(0x8bc34a, 0.3).drawRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE).endFill() }
  }
}
