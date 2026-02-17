import { Camera } from './Camera';
import { EnvironmentMap } from '../ecology/EnvironmentZone';
import { withAlpha } from '../utils/Color';

export class FluidRenderer {
  draw(ctx: CanvasRenderingContext2D, envMap: EnvironmentMap, camera: Camera, worldSize: number, tick: number): void {
    if (camera.zoom < 0.5) return;

    const gridSize = envMap.getGridSize();
    const grid = envMap.getGrid();
    const cellWorldSize = worldSize / gridSize;
    const bounds = camera.getVisibleBounds();

    const step = Math.max(1, Math.floor(4 / camera.zoom));

    ctx.strokeStyle = withAlpha([100, 150, 200], 0.15);
    ctx.lineWidth = 0.5;

    const startGx = Math.max(0, Math.floor(bounds.x / cellWorldSize));
    const endGx = Math.min(gridSize - 1, Math.ceil((bounds.x + bounds.w) / cellWorldSize));
    const startGy = Math.max(0, Math.floor(bounds.y / cellWorldSize));
    const endGy = Math.min(gridSize - 1, Math.ceil((bounds.y + bounds.h) / cellWorldSize));

    for (let gy = startGy; gy <= endGy; gy += step) {
      for (let gx = startGx; gx <= endGx; gx += step) {
        const zone = grid[gy]?.[gx];
        if (!zone || zone.flowSpeed < 0.01) continue;

        const worldX = gx * cellWorldSize + cellWorldSize / 2;
        const worldY = gy * cellWorldSize + cellWorldSize / 2;
        const screen = camera.worldToScreen(worldX, worldY);

        const flowLen = zone.flowSpeed * 20 * camera.zoom;

        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y);
        ctx.lineTo(
          screen.x + zone.flowDirection.x * flowLen,
          screen.y + zone.flowDirection.y * flowLen
        );
        ctx.stroke();
      }
    }
  }
}
