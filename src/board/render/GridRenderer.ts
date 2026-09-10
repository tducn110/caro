import { Graphics } from "pixi.js"
import { CELL_SIZE } from "../spatial/CoordinateTransform"
import { BOARD_MAX_INDEX, BOARD_MIN_INDEX } from "../../game/core/BoardBounds"

export class GridRenderer {
  readonly graphics = new Graphics()

  draw(): void {
    this.graphics.clear()
    const firstLine = BOARD_MIN_INDEX * CELL_SIZE
    const lastLine = (BOARD_MAX_INDEX + 1) * CELL_SIZE
    const boardDimension = lastLine - firstLine

    // Vintage paper board surface
    this.graphics.lineStyle(2.5, 0x8a6039, 0.65)
    this.graphics.beginFill(0xfaf1dc, 0.94)
    this.graphics.drawRoundedRect(firstLine, firstLine, boardDimension, boardDimension, 8)
    this.graphics.endFill()

    // Inner grid lines
    this.graphics.lineStyle(1.2, 0x6f5134, 0.3)
    for (let col = BOARD_MIN_INDEX; col <= BOARD_MAX_INDEX + 1; col++) {
      this.graphics.moveTo(col * CELL_SIZE, firstLine).lineTo(col * CELL_SIZE, lastLine)
    }
    for (let row = BOARD_MIN_INDEX; row <= BOARD_MAX_INDEX + 1; row++) {
      this.graphics.moveTo(firstLine, row * CELL_SIZE).lineTo(lastLine, row * CELL_SIZE)
    }
  }
}
