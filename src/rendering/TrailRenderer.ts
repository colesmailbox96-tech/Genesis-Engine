import { Organism } from '../organisms/Organism';
import { Camera } from './Camera';
import { withAlpha } from '../utils/Color';
import { Vector2 } from '../utils/Vector2';

interface TrailPoint {
  position: Vector2;
  age: number;
}

export class TrailRenderer {
  private trails: Map<string, TrailPoint[]> = new Map();
  private maxTrailLength = 20;

  update(organisms: Organism[]): void {
    for (const org of organisms) {
      if (!org.alive) {
        this.trails.delete(org.id);
        continue;
      }

      let trail = this.trails.get(org.id);
      if (!trail) {
        trail = [];
        this.trails.set(org.id, trail);
      }

      if (org.velocity.length() > 0.01) {
        trail.push({ position: org.position.clone(), age: 0 });
        if (trail.length > this.maxTrailLength) trail.shift();
      }

      for (const p of trail) p.age++;
    }

    // Clean up dead organism trails
    for (const [id] of this.trails) {
      const trail = this.trails.get(id)!;
      if (trail.length > 0 && trail[trail.length - 1].age > 60) {
        this.trails.delete(id);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera): void {
    if (camera.zoom < 0.5) return;

    for (const trail of this.trails.values()) {
      if (trail.length < 2) continue;

      ctx.beginPath();
      for (let i = 0; i < trail.length; i++) {
        const screen = camera.worldToScreen(trail[i].position.x, trail[i].position.y);
        if (i === 0) ctx.moveTo(screen.x, screen.y);
        else ctx.lineTo(screen.x, screen.y);
      }
      ctx.strokeStyle = withAlpha([150, 180, 220], 0.15);
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }
}
