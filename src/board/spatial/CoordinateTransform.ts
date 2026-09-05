import type { CellCoord } from "../../game/core/types"
import type { CameraState } from "./Camera"

export const CELL_SIZE = 56

export interface CoordinateTransform {
  screenToCell(screenX: number, screenY: number, camera: CameraState): CellCoord
  cellToWorld(cell: CellCoord): { x: number; y: number }
}

export class BoardCoordinateTransform implements CoordinateTransform {
  screenToCell(screenX: number, screenY: number, camera: CameraState): CellCoord {
    return { col: Math.floor((screenX - camera.x) / camera.zoom / CELL_SIZE), row: Math.floor((screenY - camera.y) / camera.zoom / CELL_SIZE) }
  }
  cellToWorld(cell: CellCoord) { return { x: cell.col * CELL_SIZE, y: cell.row * CELL_SIZE } }
}
