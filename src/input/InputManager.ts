import { Camera } from '../rendering/Camera';

export type EntityClickHandler = (worldX: number, worldY: number) => void;

export class InputManager {
  private camera: Camera;
  private canvas: HTMLCanvasElement | null = null;
  private isDragging = false;
  private lastPointerPos = { x: 0, y: 0 };
  private onEntityClick: EntityClickHandler | null = null;
  private pinchStartDist = 0;
  private pinchStartZoom = 1;

  constructor(camera: Camera) {
    this.camera = camera;
  }

  attach(canvas: HTMLCanvasElement, onEntityClick: EntityClickHandler): void {
    this.canvas = canvas;
    this.onEntityClick = onEntityClick;

    // Mouse events
    canvas.addEventListener('mousedown', this.onPointerDown);
    canvas.addEventListener('mousemove', this.onPointerMove);
    canvas.addEventListener('mouseup', this.onPointerUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });

    // Touch events
    canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.onTouchEnd);

    // Keyboard
    window.addEventListener('keydown', this.onKeyDown);
  }

  detach(): void {
    if (!this.canvas) return;
    this.canvas.removeEventListener('mousedown', this.onPointerDown);
    this.canvas.removeEventListener('mousemove', this.onPointerMove);
    this.canvas.removeEventListener('mouseup', this.onPointerUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private onPointerDown = (e: MouseEvent): void => {
    this.isDragging = true;
    this.lastPointerPos = { x: e.clientX, y: e.clientY };
  };

  private onPointerMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastPointerPos.x;
    const dy = e.clientY - this.lastPointerPos.y;
    this.camera.pan(-dx, -dy);
    this.lastPointerPos = { x: e.clientX, y: e.clientY };
  };

  private onPointerUp = (e: MouseEvent): void => {
    if (this.isDragging && Math.abs(e.clientX - this.lastPointerPos.x) < 5 && Math.abs(e.clientY - this.lastPointerPos.y) < 5) {
      const rect = this.canvas!.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = this.camera.screenToWorld(sx, sy);
      this.onEntityClick?.(world.x, world.y);
    }
    this.isDragging = false;
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const rect = this.canvas!.getBoundingClientRect();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    this.camera.zoomBy(factor, e.clientX - rect.left, e.clientY - rect.top);
  };

  private onTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.lastPointerPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      this.pinchStartDist = Math.sqrt(dx * dx + dy * dy);
      this.pinchStartZoom = this.camera.zoom;
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    if (e.touches.length === 1 && this.isDragging) {
      const dx = e.touches[0].clientX - this.lastPointerPos.x;
      const dy = e.touches[0].clientY - this.lastPointerPos.y;
      this.camera.pan(-dx, -dy);
      this.lastPointerPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (this.pinchStartDist > 0) {
        const factor = dist / this.pinchStartDist;
        this.camera.targetZoom = this.pinchStartZoom * factor;
      }
    }
  };

  private onTouchEnd = (e: TouchEvent): void => {
    if (e.touches.length === 0) {
      if (this.isDragging) {
        const rect = this.canvas!.getBoundingClientRect();
        const sx = this.lastPointerPos.x - rect.left;
        const sy = this.lastPointerPos.y - rect.top;
        const world = this.camera.screenToWorld(sx, sy);
        this.onEntityClick?.(world.x, world.y);
      }
      this.isDragging = false;
      this.pinchStartDist = 0;
    }
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    const panSpeed = 20;
    switch (e.key) {
      case 'ArrowLeft': this.camera.pan(panSpeed, 0); break;
      case 'ArrowRight': this.camera.pan(-panSpeed, 0); break;
      case 'ArrowUp': this.camera.pan(0, panSpeed); break;
      case 'ArrowDown': this.camera.pan(0, -panSpeed); break;
      case '+': case '=': this.camera.zoomBy(1.2); break;
      case '-': this.camera.zoomBy(0.8); break;
    }
  };
}
