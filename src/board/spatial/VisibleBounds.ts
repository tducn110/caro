import type { CameraState } from "./Camera"
import { CELL_SIZE } from "./CoordinateTransform"

export interface ViewportSize { width: number; height: number }
export interface CellBounds { minRow: number; maxRow: number; minCol: number; maxCol: number }

export function resolveVisibleBounds(camera: CameraState, viewport: ViewportSize, marginCells = 1): CellBounds {
  const minCol = Math.floor((0 - camera.x) / camera.zoom / CELL_SIZE) - marginCells
  const maxCol = Math.floor((viewport.width - camera.x) / camera.zoom / CELL_SIZE) + marginCells
  const minRow = Math.floor((0 - camera.y) / camera.zoom / CELL_SIZE) - marginCells
  const maxRow = Math.floor((viewport.height - camera.y) / camera.zoom / CELL_SIZE) + marginCells
  return { minRow, maxRow, minCol, maxCol }
}
