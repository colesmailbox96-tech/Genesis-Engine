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

  private scanLinePattern: CanvasPattern | null = null;
  private cachedScanLineOpacity: number = -1;

  scanLines(ctx: CanvasRenderingContext2D, width: number, height: number, opacity: number): void {
    if (opacity <= 0) return;

    // Create/update cached scan line pattern
    if (!this.scanLinePattern || this.cachedScanLineOpacity !== opacity) {
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = 1;
      patternCanvas.height = 3;
      const pCtx = patternCanvas.getContext('2d')!;
      pCtx.fillStyle = `rgba(0,0,0,${opacity})`;
      pCtx.fillRect(0, 0, 1, 1);
      this.scanLinePattern = ctx.createPattern(patternCanvas, 'repeat');
      this.cachedScanLineOpacity = opacity;
    }

    if (this.scanLinePattern) {
      ctx.fillStyle = this.scanLinePattern;
      ctx.fillRect(0, 0, width, height);
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
