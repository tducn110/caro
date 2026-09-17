import { Application, Container, FederatedPointerEvent, Graphics } from "pixi.js"
import type { CellCoord, Player } from "../game/core/types"
import { BoardInputController } from "../board/input/BoardInputController"
import { Camera } from "../board/spatial/Camera"
import { BoardCoordinateTransform } from "../board/spatial/CoordinateTransform"
import { resolveVisibleBounds, type ViewportSize } from "../board/spatial/VisibleBounds"
import { GridRenderer } from "../board/render/GridRenderer"
import { HighlightRenderer } from "../board/render/HighlightRenderer"
import { StoneRenderer } from "../board/render/StoneRenderer"
import { BOARD_SIZE } from "../game/core/BoardBounds"
import { CELL_SIZE } from "../board/spatial/CoordinateTransform"

export interface BoardRenderStone { readonly cell: CellCoord; readonly player: Player }

const BOARD_PADDING = 24

export class CaroScene {
  readonly app: Application
  readonly world: Container
  readonly gridLayer: Graphics
  readonly stoneLayer: Container
  readonly fxLayer: Graphics
  readonly camera = new Camera()
  readonly coordinateTransform = new BoardCoordinateTransform()
  readonly inputController = new BoardInputController(this.coordinateTransform)
  readonly gridRenderer = new GridRenderer()
  readonly stoneRenderer = new StoneRenderer()
  readonly highlightRenderer = new HighlightRenderer()
  onCellClick?: (row: number, col: number) => void

  private board: readonly BoardRenderStone[] = []
  private lastMove: CellCoord | null = null
  private winCellSet: ReadonlySet<string> = new Set()
  private lastViewport: ViewportSize = { width: 0, height: 0 }
  private paused = false
  private readonly unsubscribeCamera: () => void

  constructor(canvas: HTMLCanvasElement) {
    this.app = new Application({
      view: canvas,
      resizeTo: canvas.parentElement || window,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    })
    this.world = new Container()
    this.world.name = "GameRoot"
    this.app.stage.addChild(this.world)
    this.gridLayer = this.gridRenderer.graphics
    this.gridLayer.name = "GridLayer"
    this.stoneLayer = this.stoneRenderer.container
    this.stoneLayer.name = "StoneLayer"
    this.fxLayer = this.highlightRenderer.graphics
    this.fxLayer.name = "FxLayer"
    this.world.addChild(this.gridLayer, this.fxLayer, this.stoneLayer)

    this.fitBoardToViewport({ width: this.app.screen.width, height: this.app.screen.height })
    this.unsubscribeCamera = this.camera.subscribe(() => {
      this.applyCameraTransform()
      this.refreshVisibleBoard()
    })
    this.applyCameraTransform()
    this.setupInteraction()
    this.app.ticker.add(() => this.refreshViewportIfChanged())
  }

  private setupInteraction(): void {
    this.app.stage.eventMode = "static"
    this.app.stage.hitArea = { contains: () => true } as any
    this.app.stage.on("pointerdown", (event: FederatedPointerEvent) => {
      if (this.paused) return
      this.inputController.pointerDown(event.global.x, event.global.y)
    })
    this.app.stage.on("pointermove", (event: FederatedPointerEvent) => {
      if (this.paused) return
      const gesture = this.inputController.pointerMove(event.global.x, event.global.y)
      if (gesture?.type === "PAN") this.camera.panBy(gesture.dx, gesture.dy)
    })
    const handlePointerUp = (event: FederatedPointerEvent) => {
      if (this.paused) return
      const gesture = this.inputController.pointerUp(event.global.x, event.global.y, this.camera.snapshot())
      if (gesture?.type === "CELL_TAP") this.onCellClick?.(gesture.cell.row, gesture.cell.col)
    }
    this.app.stage.on("pointerup", handlePointerUp)
    this.app.stage.on("pointerupoutside", handlePointerUp)
  }

  screenToCell(screenX: number, screenY: number): CellCoord {
    return this.coordinateTransform.screenToCell(screenX, screenY, this.camera.snapshot())
  }

  private applyCameraTransform(): void {
    const state = this.camera.snapshot()
    this.world.position.set(state.x, state.y)
    this.world.scale.set(state.zoom)
  }

  syncState(board: readonly BoardRenderStone[], lastMove: CellCoord | null, winCellSet: ReadonlySet<string>): void {
    this.board = board
    this.lastMove = lastMove
    this.winCellSet = winCellSet
    this.refreshVisibleBoard()
  }

  /** The host can pause a live round without destroying its Pixi scene. */
  setPaused(paused: boolean): void {
    if (this.paused === paused) return
    this.paused = paused
    if (paused) this.app.stop()
    else {
      this.app.start()
      this.refreshVisibleBoard()
    }
  }

  private refreshViewportIfChanged(): void {
    const viewport = { width: this.app.screen.width, height: this.app.screen.height }
    if (viewport.width === this.lastViewport.width && viewport.height === this.lastViewport.height) return
    this.fitBoardToViewport(viewport)
  }

  /** Keeps every playable cell visible after first render and viewport rotations. */
  private fitBoardToViewport(viewport: ViewportSize): void {
    const boardPixels = BOARD_SIZE * CELL_SIZE
    const padding = viewport.width < 500 ? 10 : BOARD_PADDING
    const availableWidth = Math.max(1, viewport.width - padding * 2)
    const availableHeight = Math.max(1, viewport.height - padding * 2)
    const zoom = Math.min(availableWidth / boardPixels, availableHeight / boardPixels)
    this.camera.setZoom(zoom)
    this.camera.panTo(
      (viewport.width - boardPixels * zoom) / 2,
      (viewport.height - boardPixels * zoom) / 2,
    )
  }

  /** CAMERA_CHANGED, VIEWPORT_CHANGED and GAME_STATE_CHANGED converge here. */
  refreshVisibleBoard(): void {
    const viewport = { width: this.app.screen.width, height: this.app.screen.height }
    this.lastViewport = viewport
    const bounds = resolveVisibleBounds(this.camera.snapshot(), viewport)
    this.gridRenderer.draw()
    this.stoneRenderer.sync({
      forEachStoneInBounds: (visibleBounds, callback) => {
        for (const stone of this.board) {
          const { row, col } = stone.cell
          if (row >= visibleBounds.minRow && row <= visibleBounds.maxRow && col >= visibleBounds.minCol && col <= visibleBounds.maxCol) callback(stone.cell, stone.player)
        }
      },
    }, bounds)
    this.highlightRenderer.draw(this.lastMove, this.winCellSet)
  }

  destroy(): void {
    this.unsubscribeCamera()
    this.app.destroy(true, { children: true })
  }
}
