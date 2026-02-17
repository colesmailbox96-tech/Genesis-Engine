export type RGB = [number, number, number];
export type RGBA = [number, number, number, number];

export function rgbToString(rgb: RGB, alpha: number = 1): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export function lerpColor(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

export function rgbToHex(rgb: RGB): string {
  return '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('');
}

export function brighten(rgb: RGB, factor: number): RGB {
  return [
    Math.min(255, Math.round(rgb[0] * factor)),
    Math.min(255, Math.round(rgb[1] * factor)),
    Math.min(255, Math.round(rgb[2] * factor)),
  ];
}

export function withAlpha(rgb: RGB, alpha: number): string {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

// Metabolism-based organism colors
export const METABOLISM_COLORS: Record<string, RGB> = {
  chemosynthesis: [255, 107, 53],    // warm orange/red
  photosynthesis: [0, 230, 118],     // green/cyan
  heterotrophy: [224, 64, 251],      // purple/magenta
  fermentation: [255, 214, 0],       // amber/yellow
  decomposer: [92, 107, 192],        // dark blue/gray
};
