import { EnvironmentMap, ZoneType } from '../ecology/EnvironmentZone';
import { Camera } from './Camera';
import { withAlpha, RGB } from '../utils/Color';

const ZONE_COLORS: Record<ZoneType, RGB> = {
  deep_ocean: [10, 15, 40],
  hydrothermal_vent: [60, 20, 10],
  shallow_pool: [15, 30, 50],
  tidal_zone: [20, 35, 45],
  volcanic_shore: [40, 20, 15],
  ice_region: [30, 35, 50],
};

export class EnvironmentRenderer {
  draw(ctx: CanvasRenderingContext2D, envMap: EnvironmentMap, camera: Camera): void {
    const gridSize = envMap.getGridSize();
    const grid = envMap.getGrid();
    const worldSize = 512;
    const cellWorldSize = worldSize / gridSize;

    const bounds = camera.getVisibleBounds();

    const startGx = Math.max(0, Math.floor(bounds.x / cellWorldSize));
    const endGx = Math.min(gridSize - 1, Math.ceil((bounds.x + bounds.w) / cellWorldSize));
    const startGy = Math.max(0, Math.floor(bounds.y / cellWorldSize));
    const endGy = Math.min(gridSize - 1, Math.ceil((bounds.y + bounds.h) / cellWorldSize));

    for (let gy = startGy; gy <= endGy; gy++) {
      for (let gx = startGx; gx <= endGx; gx++) {
        const zone = grid[gy]?.[gx];
        if (!zone) continue;

        const worldX = gx * cellWorldSize;
        const worldY = gy * cellWorldSize;
        const screen = camera.worldToScreen(worldX, worldY);
        const screenSize = cellWorldSize * camera.zoom;

        const color = ZONE_COLORS[zone.type];
        ctx.fillStyle = withAlpha(color, 0.8);
        ctx.fillRect(screen.x, screen.y, screenSize + 1, screenSize + 1);
      }
    }
  }
}
