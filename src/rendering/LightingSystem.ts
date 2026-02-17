import { EnergySource } from '../chemistry/EnergySource';
import { Organism } from '../organisms/Organism';
import { withAlpha, RGB } from '../utils/Color';

export class LightingSystem {
  drawEnergySourceGlow(
    ctx: CanvasRenderingContext2D,
    source: EnergySource,
    screenX: number,
    screenY: number,
    screenRadius: number,
    tick: number
  ): void {
    const pulse = 0.7 + 0.3 * Math.sin(tick * 0.05);
    const colors: Record<string, RGB> = {
      thermal_vent: [255, 80, 30],
      uv_radiation: [100, 150, 255],
      lightning: [255, 255, 200],
      chemical_gradient: [80, 255, 150],
    };
    const color = colors[source.type] ?? [255, 255, 255];

    const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, screenRadius * pulse);
    gradient.addColorStop(0, withAlpha(color, 0.6 * pulse));
    gradient.addColorStop(0.5, withAlpha(color, 0.2 * pulse));
    gradient.addColorStop(1, withAlpha(color, 0));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, screenRadius * pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  drawOrganismGlow(
    ctx: CanvasRenderingContext2D,
    organism: Organism,
    screenX: number,
    screenY: number,
    screenRadius: number
  ): void {
    const energyFraction = organism.energy / organism.phenotype.energyCapacity;
    const color = organism.phenotype.bodyColor;

    const gradient = ctx.createRadialGradient(screenX, screenY, screenRadius * 0.5, screenX, screenY, screenRadius * 2);
    gradient.addColorStop(0, withAlpha(color, energyFraction * 0.4));
    gradient.addColorStop(1, withAlpha(color, 0));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, screenRadius * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
