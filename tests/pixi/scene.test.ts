import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("pixi.js", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    Application: class MockApplication {
      stage = new actual.Container();
      screen = { width: 800, height: 600 };
      ticker = { add: vi.fn() };
      destroy = vi.fn();
      resize = vi.fn();
    }
  };
});

import { CaroScene } from "../../src/pixi/CaroScene";
import { CELL_SIZE } from "../../src/board/spatial/CoordinateTransform";

describe("CaroScene: Coordinate and Input Layer", () => {
  let scene: CaroScene;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);
    
    scene = new CaroScene(canvas);
  });

  afterEach(() => {
    scene.destroy();
    document.body.removeChild(canvas);
  });

  it("screenToCell: converts screen coords to board correctly", () => {
    // Camera centers the finite 15 by 15 board in the 800 by 600 viewport.
    const cameraState = scene.camera.snapshot();
    expect(cameraState.x).toBe(124);
    expect(cameraState.y).toBe(24);
    expect(cameraState.zoom).toBeCloseTo(552 / 840);

    // The board centre lands in its centre cell.
    const centerCell = scene.screenToCell(400, 300);
    expect(centerCell).toEqual({ row: 7, col: 7 });

    // Clicking one cell right of the board centre -> col 8
    const rightCell = scene.screenToCell(400 + CELL_SIZE * cameraState.zoom + 1, 300);
    expect(rightCell.col).toBe(8);

    // Coordinate conversion is still available for input to reject outside cells.
    expect(scene.screenToCell(-100, -100)).toEqual({ col: -7, row: -4 });
  });

  it("gesture: drag updates camera without triggering click", () => {
    let clickFired = false;
    scene.onCellClick = () => { clickFired = true; };

    // Simulate pointerdown
    scene.app.stage.emit("pointerdown", { global: { x: 400, y: 300 } });
    
    // Simulate pointermove dragging 20px
    scene.app.stage.emit("pointermove", { global: { x: 420, y: 320 } });
    
    const cam = scene.camera.snapshot();
    expect(cam.x).toBe(144); // 124 + 20
    expect(cam.y).toBe(44); // 24 + 20

    // Simulate pointerup
    scene.app.stage.emit("pointerup", { global: { x: 420, y: 320 } });
    
    expect(clickFired).toBe(false); // Should not click if dragged
  });

  it("gesture: tap triggers cell click", () => {
    let clickedCell = { row: 0, col: 0 };
    let clickCount = 0;
    scene.onCellClick = (r, c) => {
      clickedCell = { row: r, col: c };
      clickCount++;
    };

    // Simulate pointerdown
    scene.app.stage.emit("pointerdown", { global: { x: 400, y: 300 } });
    
    // Simulate pointerup (without move)
    scene.app.stage.emit("pointerup", { global: { x: 400, y: 300 } });
    
    expect(clickCount).toBe(1);
    expect(clickedCell).toEqual({ row: 7, col: 7 });
  });

  it("gesture: tap outside the finite board does not trigger a cell click", () => {
    const onCellClick = vi.fn();
    scene.onCellClick = onCellClick;

    scene.app.stage.emit("pointerdown", { global: { x: -100, y: -100 } });
    scene.app.stage.emit("pointerup", { global: { x: -100, y: -100 } });

    expect(onCellClick).not.toHaveBeenCalled();
  });
});
