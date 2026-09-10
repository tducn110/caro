import { Container, Graphics } from "pixi.js"
import type { CellCoord, Player } from "../../game/core/types"
import type { CellBounds } from "../spatial/VisibleBounds"
import { CELL_SIZE } from "../spatial/CoordinateTransform"

export interface StoneRenderSource { forEachStoneInBounds(bounds: CellBounds, callback: (cell: CellCoord, player: Player) => void): void }

export class StoneRenderer {
  readonly container = new Container()
  private readonly visuals = new Map<string, Graphics>()

  sync(source: StoneRenderSource, bounds: CellBounds): void {
    const seen = new Set<string>()
    source.forEachStoneInBounds(bounds, (cell, player) => {
      const { row, col } = cell
      const key = `${row},${col}`; seen.add(key)
      if (this.visuals.has(key)) return
      const visual = new Graphics(); visual.name = `Stone#${key}`; visual.position.set(col * CELL_SIZE + CELL_SIZE / 2, row * CELL_SIZE + CELL_SIZE / 2)
      if (player === "X") {
        visual
          .lineStyle(5.5, 0x9f3f1f, 1)
          .moveTo(-16, -16).lineTo(16, 16)
          .moveTo(16, -16).lineTo(-16, 16)
      } else {
        visual
          .beginFill(0xfaf1dc, 0.96)
          .lineStyle(5, 0x234e69, 1)
          .drawCircle(0, 0, 17)
          .endFill()
      }
      this.container.addChild(visual); this.visuals.set(key, visual)
    })
    for (const [key, visual] of this.visuals) if (!seen.has(key)) { this.container.removeChild(visual); visual.destroy(); this.visuals.delete(key) }
  }
}
