export class PostProcessing {
  bloom(ctx: CanvasRenderingContext2D, width: number, height: number, _threshold: number, intensity: number): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = `blur(${4}px) brightness(${1 + intensity})`;
    ctx.globalAlpha = intensity * 0.3;
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.restore();
    ctx.filter = 'none';
  }

  vignette(ctx: CanvasRenderingContext2D, width: number, height: number, strength: number): void {
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, width * 0.3,
      width / 2, height / 2, width * 0.7
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${strength})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  scanLines(ctx: CanvasRenderingContext2D, width: number, height: number, opacity: number): void {
    ctx.fillStyle = `rgba(0,0,0,${opacity})`;
    for (let y = 0; y < height; y += 3) {
      ctx.fillRect(0, y, width, 1);
    }
  }

  chromaticAberration(ctx: CanvasRenderingContext2D, width: number, height: number, strength: number): void {
    if (strength < 0.001) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.03 * strength;
    ctx.drawImage(ctx.canvas, strength, 0, width, height);
    ctx.drawImage(ctx.canvas, -strength, 0, width, height);
    ctx.restore();
  }
}
