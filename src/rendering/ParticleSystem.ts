import { Vector2 } from '../utils/Vector2';
import { RGB, withAlpha } from '../utils/Color';

export interface Particle {
  position: Vector2;
  velocity: Vector2;
  color: RGB;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  particles: Particle[] = [];
  private maxParticles: number = 2000;

  emit(x: number, y: number, count: number, color: RGB, speed: number = 1, life: number = 60): void {
    for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        position: new Vector2(x, y),
        velocity: new Vector2(Math.cos(angle) * spd, Math.sin(angle) * spd),
        color,
        alpha: 1,
        size: 1 + Math.random() * 2,
        life,
        maxLife: life,
      });
    }
  }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.position = p.position.add(p.velocity);
      p.velocity = p.velocity.mul(0.98);
      p.life--;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, worldToScreen: (x: number, y: number) => { x: number; y: number }, zoom: number): void {
    for (const p of this.particles) {
      const screen = worldToScreen(p.position.x, p.position.y);
      const size = Math.max(1, p.size * zoom);
      ctx.fillStyle = withAlpha(p.color, p.alpha);
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
