import { Organism, MOVE_SPEED } from '../organisms/Organism';
import { Camera } from './Camera';
import { withAlpha, RGB } from '../utils/Color';
import { getBodySegments } from '../organisms/Morphology';

export class OrganismRenderer {
  draw(ctx: CanvasRenderingContext2D, organisms: Organism[], camera: Camera, tick: number): void {
    for (const organism of organisms) {
      if (!organism.alive) continue;
      if (!camera.isVisible(organism.position.x, organism.position.y, 30)) continue;

      const screen = camera.worldToScreen(organism.position.x, organism.position.y);
      const screenSize = organism.phenotype.bodyRadius * camera.zoom;

      if (screenSize < 1) {
        this.drawDot(ctx, organism, screen.x, screen.y);
        continue;
      }

      const color = organism.phenotype.bodyColor;

      // Body
      this.drawBody(ctx, organism, screen.x, screen.y, screenSize, color);

      // Membrane glow
      this.drawMembraneGlow(ctx, screen.x, screen.y, screenSize, color, organism.energy / organism.phenotype.energyCapacity);

      if (screenSize >= 3) {
        // Sensors
        this.drawSensors(ctx, organism, screen.x, screen.y, screenSize);

        // Movement trail
        if ((organism.actuatorOutputs[MOVE_SPEED] ?? 0) > 0.1) {
          this.drawTrail(ctx, organism, screen.x, screen.y, screenSize);
        }
      }

      // Neural pulse at high zoom
      if (camera.zoom > 2) {
        this.drawNeuralPulse(ctx, screen.x, screen.y, screenSize, tick);
      }
    }
  }

  private drawDot(ctx: CanvasRenderingContext2D, org: Organism, sx: number, sy: number): void {
    ctx.fillStyle = withAlpha(org.phenotype.bodyColor, 0.8);
    ctx.fillRect(sx - 0.5, sy - 0.5, 1, 1);
  }

  private drawBody(ctx: CanvasRenderingContext2D, org: Organism, sx: number, sy: number, size: number, color: RGB): void {
    const segments = getBodySegments(org.phenotype);

    for (const seg of segments) {
      const x = sx + seg.relativePosition.x * size;
      const y = sy + seg.relativePosition.y * size;
      const r = seg.radius * size / org.phenotype.bodyRadius;

      ctx.fillStyle = withAlpha(color, 0.7);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1, r), 0, Math.PI * 2);
      ctx.fill();

      // Shell
      if (org.phenotype.shellThickness > 0) {
        ctx.strokeStyle = withAlpha([200, 200, 200], org.phenotype.shellThickness);
        ctx.lineWidth = Math.max(0.5, size * 0.15 * org.phenotype.shellThickness);
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, r), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private drawMembraneGlow(ctx: CanvasRenderingContext2D, sx: number, sy: number, size: number, color: RGB, energyFraction: number): void {
    const gradient = ctx.createRadialGradient(sx, sy, size * 0.8, sx, sy, size * 2);
    gradient.addColorStop(0, withAlpha(color, energyFraction * 0.3));
    gradient.addColorStop(1, withAlpha(color, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(sx, sy, size * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawSensors(ctx: CanvasRenderingContext2D, org: Organism, sx: number, sy: number, size: number): void {
    for (const sensor of org.phenotype.sensors) {
      const angle = sensor.angle + org.orientation;
      const x = sx + Math.cos(angle) * size;
      const y = sy + Math.sin(angle) * size;

      const sensorColors: Record<string, RGB> = {
        chemical: [100, 255, 100],
        light: [255, 255, 100],
        touch: [255, 150, 100],
        proximity: [100, 100, 255],
        internal: [255, 200, 200],
      };

      ctx.fillStyle = withAlpha(sensorColors[sensor.type] ?? [200, 200, 200], 0.6);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1, size * 0.15), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawTrail(ctx: CanvasRenderingContext2D, org: Organism, sx: number, sy: number, size: number): void {
    const tailAngle = org.orientation + Math.PI;
    const tailX = sx + Math.cos(tailAngle) * size * 1.5;
    const tailY = sy + Math.sin(tailAngle) * size * 1.5;

    ctx.strokeStyle = withAlpha(org.phenotype.bodyColor, 0.3);
    ctx.lineWidth = Math.max(0.5, size * 0.3);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();
  }

  private drawNeuralPulse(ctx: CanvasRenderingContext2D, sx: number, sy: number, size: number, tick: number): void {
    const pulse = 0.5 + 0.5 * Math.sin(tick * 0.1);
    ctx.strokeStyle = withAlpha([200, 220, 255], pulse * 0.15);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(sx, sy, size * (1.2 + pulse * 0.3), 0, Math.PI * 2);
    ctx.stroke();
  }
}
