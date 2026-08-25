import { Application, Container, Graphics, FederatedPointerEvent } from "pixi.js"
import { GameState } from "../game/state"
import { CameraState, Player } from "../game/types"

export const CELL_SIZE = 56;
const DRAG_THRESHOLD = 6;

export class CaroScene {
  app: Application;
  world: Container;
  gridLayer: Graphics;
  stoneLayer: Container;
  fxLayer: Graphics;
  
  camera: CameraState = { x: 0, y: 0, zoom: 1 };
  
  isDragging = false;
  pointerDownPos = { x: 0, y: 0 };
  pointerDownCamera = { x: 0, y: 0 };
  isPointerDown = false;
  
  onCellClick?: (row: number, col: number) => void;
  
  stoneSprites: Map<string, Graphics> = new Map();
  lastDrawnBounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  
  constructor(canvas: HTMLCanvasElement) {
    this.app = new Application({
      view: canvas,
      resizeTo: canvas.parentElement || window,
      backgroundColor: 0xfcfbf9,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });
    
    this.world = new Container();
    this.world.name = "GameRoot";
    this.app.stage.addChild(this.world);
    
    this.gridLayer = new Graphics();
    this.gridLayer.name = "GridLayer";
    this.stoneLayer = new Container();
    this.stoneLayer.name = "StoneLayer";
    this.fxLayer = new Graphics();
    this.fxLayer.name = "FxLayer";
    
    this.world.addChild(this.gridLayer);
    this.world.addChild(this.fxLayer);
    this.world.addChild(this.stoneLayer);
    
    this.setupInteraction();
    
    this.camera.x = this.app.screen.width / 2;
    this.camera.y = this.app.screen.height / 2;
    this.updateTransform();
    
    this.app.ticker.add(() => {
      this.drawGrid();
    });
  }

  setupInteraction() {
    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = {
      contains: () => true
    } as any;
    
    this.app.stage.on("pointerdown", (e: FederatedPointerEvent) => {
      this.isPointerDown = true;
      this.isDragging = false;
      this.pointerDownPos = { x: e.global.x, y: e.global.y };
      this.pointerDownCamera = { x: this.camera.x, y: this.camera.y };
    });
    
    this.app.stage.on("pointermove", (e: FederatedPointerEvent) => {
      if (!this.isPointerDown) return;
      
      const dx = e.global.x - this.pointerDownPos.x;
      const dy = e.global.y - this.pointerDownPos.y;
      
      if (!this.isDragging && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
        this.isDragging = true;
      }
      
      if (this.isDragging) {
        this.camera.x = this.pointerDownCamera.x + dx;
        this.camera.y = this.pointerDownCamera.y + dy;
        this.updateTransform();
      }
    });
    
    const upHandler = (e: FederatedPointerEvent) => {
      if (!this.isPointerDown) return;
      this.isPointerDown = false;
      
      if (!this.isDragging && this.onCellClick) {
        const cell = this.screenToCell(e.global.x, e.global.y);
        this.onCellClick(cell.row, cell.col);
      }
      this.isDragging = false;
    };

    this.app.stage.on("pointerup", upHandler);
    this.app.stage.on("pointerupoutside", upHandler);
  }
  
  screenToCell(screenX: number, screenY: number) {
    const worldX = (screenX - this.camera.x) / this.camera.zoom;
    const worldY = (screenY - this.camera.y) / this.camera.zoom;
    
    return {
      col: Math.floor(worldX / CELL_SIZE),
      row: Math.floor(worldY / CELL_SIZE),
    };
  }
  
  updateTransform() {
    this.world.position.set(this.camera.x, this.camera.y);
    this.world.scale.set(this.camera.zoom);
  }
  
  drawGrid() {
    const minWorldX = (0 - this.camera.x) / this.camera.zoom;
    const maxWorldX = (this.app.screen.width - this.camera.x) / this.camera.zoom;
    const minWorldY = (0 - this.camera.y) / this.camera.zoom;
    const maxWorldY = (this.app.screen.height - this.camera.y) / this.camera.zoom;
    
    const minCol = Math.floor(minWorldX / CELL_SIZE) - 1;
    const maxCol = Math.floor(maxWorldX / CELL_SIZE) + 1;
    const minRow = Math.floor(minWorldY / CELL_SIZE) - 1;
    const maxRow = Math.floor(maxWorldY / CELL_SIZE) + 1;
    
    const newBounds = { minX: minCol, maxX: maxCol, minY: minRow, maxY: maxRow };
    
    if (this.lastDrawnBounds.minX === newBounds.minX && 
        this.lastDrawnBounds.maxX === newBounds.maxX &&
        this.lastDrawnBounds.minY === newBounds.minY &&
        this.lastDrawnBounds.maxY === newBounds.maxY) {
      return;
    }
    
    this.lastDrawnBounds = newBounds;
    this.gridLayer.clear();
    
    this.gridLayer.lineStyle(1, 0x000000, 0.08);
    
    const startX = minCol * CELL_SIZE;
    const endX = maxCol * CELL_SIZE;
    const startY = minRow * CELL_SIZE;
    const endY = maxRow * CELL_SIZE;
    
    for (let c = minCol; c <= maxCol; c++) {
      const x = c * CELL_SIZE;
      this.gridLayer.moveTo(x, startY);
      this.gridLayer.lineTo(x, endY);
    }
    
    for (let r = minRow; r <= maxRow; r++) {
      const y = r * CELL_SIZE;
      this.gridLayer.moveTo(startX, y);
      this.gridLayer.lineTo(endX, y);
    }
  }
  
  syncState(state: GameState, lastMove: [number, number] | null, winCellSet: Set<string>) {
    const currentKeys = new Set(this.stoneSprites.keys());
    
    state.board.forEach((player, key) => {
      if (!this.stoneSprites.has(key)) {
        const [r, c] = key.split(",").map(Number);
        
        const g = new Graphics();
        g.name = `Stone#${key}`;
        const cx = c * CELL_SIZE + CELL_SIZE / 2;
        const cy = r * CELL_SIZE + CELL_SIZE / 2;
        
        g.position.set(cx, cy);
        
        if (player === "X") {
          g.lineStyle(4, 0xa84b2a, 1);
          const s = 12;
          g.moveTo(-s, -s);
          g.lineTo(s, s);
          g.moveTo(s, -s);
          g.lineTo(-s, s);
        } else {
          g.lineStyle(4, 0x315a72, 1);
          g.drawCircle(0, 0, 14);
        }
        
        this.stoneLayer.addChild(g);
        this.stoneSprites.set(key, g);
      }
      currentKeys.delete(key);
    });
    
    currentKeys.forEach(key => {
      const sprite = this.stoneSprites.get(key);
      if (sprite) {
        this.stoneLayer.removeChild(sprite);
        sprite.destroy();
        this.stoneSprites.delete(key);
      }
    });
    
    this.fxLayer.clear();
    
    if (lastMove) {
      const [r, c] = lastMove;
      this.fxLayer.beginFill(0x000000, 0.05);
      this.fxLayer.drawRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      this.fxLayer.endFill();
    }
    
    winCellSet.forEach(key => {
      const [r, c] = key.split(",").map(Number);
      this.fxLayer.beginFill(0x8bc34a, 0.3);
      this.fxLayer.drawRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      this.fxLayer.endFill();
    });
  }
  
  destroy() {
    this.app.destroy(true, { children: true });
  }
}
