export interface CameraState { x: number; y: number; zoom: number }

export class Camera {
  private value: CameraState = { x: 0, y: 0, zoom: 1 }
  private readonly listeners = new Set<(state: CameraState) => void>()
  snapshot(): CameraState { return { ...this.value } }
  subscribe(listener: (state: CameraState) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  panBy(dx: number, dy: number): void { this.update({ ...this.value, x: this.value.x + dx, y: this.value.y + dy }) }
  panTo(x: number, y: number): void { this.update({ ...this.value, x, y }) }
  setZoom(zoom: number): void { this.update({ ...this.value, zoom }) }
  private update(value: CameraState): void { this.value = value; this.listeners.forEach((listener) => listener(this.snapshot())) }
}
