import { ChemicalField } from '../chemistry/ChemicalField';
import { Camera } from './Camera';
import { withAlpha, RGB, lerpColor } from '../utils/Color';

export class ChemicalFieldRenderer {
  draw(ctx: CanvasRenderingContext2D, field: ChemicalField, camera: Camera, worldSize: number): void {
    if (camera.zoom < 0.3) return;

    const gridSize = 64;
    const cellWorldSize = worldSize / gridSize;
    const bounds = camera.getVisibleBounds();

    const startGx = Math.max(0, Math.floor(bounds.x / cellWorldSize));
    const endGx = Math.min(gridSize - 1, Math.ceil((bounds.x + bounds.w) / cellWorldSize));
    const startGy = Math.max(0, Math.floor(bounds.y / cellWorldSize));
    const endGy = Math.min(gridSize - 1, Math.ceil((bounds.y + bounds.h) / cellWorldSize));

    for (let gy = startGy; gy <= endGy; gy++) {
      for (let gx = startGx; gx <= endGx; gx++) {
        const worldX = gx * cellWorldSize + cellWorldSize / 2;
        const worldY = gy * cellWorldSize + cellWorldSize / 2;
        const concentration = field.getConcentration(worldX, worldY, 'organic');

        if (concentration < 0.01) continue;

        const screen = camera.worldToScreen(gx * cellWorldSize, gy * cellWorldSize);
        const screenSize = cellWorldSize * camera.zoom;

        const alpha = Math.min(0.4, concentration * 2);
        const color: RGB = lerpColor([20, 40, 80], [80, 200, 120], Math.min(1, concentration * 5));
        ctx.fillStyle = withAlpha(color, alpha);
        ctx.fillRect(screen.x, screen.y, screenSize + 1, screenSize + 1);
      }
    }
  }
}
