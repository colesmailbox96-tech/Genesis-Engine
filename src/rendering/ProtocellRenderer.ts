import { Protocell } from '../proto/Protocell';
import { Camera } from './Camera';
import { withAlpha } from '../utils/Color';

export class ProtocellRenderer {
  draw(ctx: CanvasRenderingContext2D, protocells: Protocell[], camera: Camera): void {
    for (const cell of protocells) {
      if (!camera.isVisible(cell.position.x, cell.position.y, 30)) continue;

      const screen = camera.worldToScreen(cell.position.x, cell.position.y);
      const screenSize = Math.max(2, cell.size * camera.zoom);

      // Membrane
      const membraneColor = withAlpha([100, 200, 255], cell.integrity * 0.5);
      ctx.strokeStyle = membraneColor;
      ctx.lineWidth = Math.max(0.5, camera.zoom * 0.3);
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, screenSize, 0, Math.PI * 2);
      ctx.stroke();

      // Interior glow
      const gradient = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, screenSize);
      gradient.addColorStop(0, withAlpha([150, 220, 255], 0.2));
      gradient.addColorStop(1, withAlpha([150, 220, 255], 0));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, screenSize, 0, Math.PI * 2);
      ctx.fill();

      // Replicator indicator
      if (cell.replicators.length > 0 && camera.zoom >= 2) {
        ctx.fillStyle = withAlpha([255, 200, 50], 0.6);
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, screenSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
