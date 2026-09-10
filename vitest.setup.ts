if (typeof window === "undefined") {
  (globalThis as any).window = { devicePixelRatio: 1 }
}
class MockCanvas {
  width = 800
  height = 600
  style = {}
  parentElement = null
  getContext() {
    return {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: new Uint8Array(4) }),
      putImageData: () => {},
      createImageData: () => ({ data: new Uint8Array(4) }),
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      fill: () => {},
    }
  }
}
;(globalThis as any).HTMLCanvasElement = MockCanvas

if (typeof document === "undefined") {
  (globalThis as any).document = {
    createElement: () => new MockCanvas(),
    body: { appendChild: () => {}, removeChild: () => {} },
  }
}
