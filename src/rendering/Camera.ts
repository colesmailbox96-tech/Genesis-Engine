import { Vector2 } from '../utils/Vector2';
import { clamp, lerp } from '../utils/Math';

export class Camera {
  position: Vector2 = new Vector2(256, 256);
  targetPosition: Vector2 = new Vector2(256, 256);
  zoom: number = 1;
  targetZoom: number = 1;
  private smoothing: number = 0.1;
  width: number = 800;
  height: number = 600;

  update(): void {
    this.position = this.position.lerp(this.targetPosition, this.smoothing);
    this.zoom = lerp(this.zoom, this.targetZoom, this.smoothing);
  }

  setTarget(x: number, y: number): void {
    this.targetPosition.set(x, y);
  }

  pan(dx: number, dy: number): void {
    this.targetPosition.x -= dx / this.zoom;
    this.targetPosition.y -= dy / this.zoom;
  }

  zoomBy(factor: number, centerX?: number, centerY?: number): void {
    const oldZoom = this.targetZoom;
    this.targetZoom = clamp(this.targetZoom * factor, 0.02, 10);

    // Zoom toward point
    if (centerX !== undefined && centerY !== undefined) {
      const worldBefore = this.screenToWorld(centerX, centerY);
      this.zoom = this.targetZoom;
      const worldAfter = this.screenToWorld(centerX, centerY);
      this.targetPosition.x += worldBefore.x - worldAfter.x;
      this.targetPosition.y += worldBefore.y - worldAfter.y;
      this.zoom = oldZoom; // let smoothing handle it
    }
  }

  worldToScreen(wx: number, wy: number): Vector2 {
    const sx = (wx - this.position.x) * this.zoom + this.width / 2;
    const sy = (wy - this.position.y) * this.zoom + this.height / 2;
    return new Vector2(sx, sy);
  }

  screenToWorld(sx: number, sy: number): Vector2 {
    const wx = (sx - this.width / 2) / this.zoom + this.position.x;
    const wy = (sy - this.height / 2) / this.zoom + this.position.y;
    return new Vector2(wx, wy);
  }

  isVisible(wx: number, wy: number, margin: number = 0): boolean {
    const screen = this.worldToScreen(wx, wy);
    return screen.x >= -margin && screen.x <= this.width + margin &&
           screen.y >= -margin && screen.y <= this.height + margin;
  }

  getVisibleBounds(): { x: number; y: number; w: number; h: number } {
    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(this.width, this.height);
    return {
      x: topLeft.x,
      y: topLeft.y,
      w: bottomRight.x - topLeft.x,
      h: bottomRight.y - topLeft.y,
    };
  }

  getZoomLevel(): string {
    if (this.zoom >= 6) return 'molecular';
    if (this.zoom >= 3) return 'chemical';
    if (this.zoom >= 1) return 'cellular';
    if (this.zoom >= 0.5) return 'local';
    if (this.zoom >= 0.1) return 'ecosystem';
    return 'world';
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}
