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
    }
  };
});

import { CaroScene, CELL_SIZE } from "../../src/pixi/CaroScene";

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
    // Camera is initially at 400, 300 (center of 800x600)
    expect(scene.camera.x).toBe(400);
    expect(scene.camera.y).toBe(300);
    expect(scene.camera.zoom).toBe(1);

    // Clicking exactly at camera center (400, 300) should be row 0, col 0
    const centerCell = scene.screenToCell(400, 300);
    expect(centerCell).toEqual({ row: 0, col: 0 });

    // Clicking at 400 + CELL_SIZE + 1 (right) -> col 1
    const rightCell = scene.screenToCell(400 + CELL_SIZE + 1, 300);
    expect(rightCell.col).toBe(1);

    // Clicking at 400 - 1 (left) -> col -1 (math floor logic)
    const leftCell = scene.screenToCell(399, 300);
    expect(leftCell.col).toBe(-1);

    // Clicking far away
    const farCell = scene.screenToCell(400 - CELL_SIZE * 10 - 10, 300 - CELL_SIZE * 20 - 10);
    expect(farCell).toEqual({ col: -11, row: -21 });
  });

  it("gesture: drag updates camera without triggering click", () => {
    let clickFired = false;
    scene.onCellClick = () => { clickFired = true; };

    // Simulate pointerdown
    scene.app.stage.emit("pointerdown", { global: { x: 400, y: 300 } });
    
    // Simulate pointermove dragging 20px
    scene.app.stage.emit("pointermove", { global: { x: 420, y: 320 } });
    
    expect(scene.isDragging).toBe(true);
    expect(scene.camera.x).toBe(420); // 400 + 20
    expect(scene.camera.y).toBe(320);

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
    
    expect(scene.isDragging).toBe(false);
    expect(clickCount).toBe(1);
    expect(clickedCell).toEqual({ row: 0, col: 0 });
  });
});

