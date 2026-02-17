export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function inverseLerp(a: number, b: number, value: number): number {
  if (a === b) return 0;
  return (value - a) / (b - a);
}

export function remap(inMin: number, inMax: number, outMin: number, outMax: number, value: number): number {
  const t = inverseLerp(inMin, inMax, value);
  return lerp(outMin, outMax, t);
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function wrap(value: number, min: number, max: number): number {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
}

export function arrhenius(temperature: number, activationEnergy: number, baseRate: number = 1): number {
  const k = 0.01; // Boltzmann-like constant for our scale
  return baseRate * Math.exp(-activationEnergy / (k * Math.max(temperature, 0.01)));
}

let _idCounter = 0;
export function generateId(): string {
  return `e${++_idCounter}`;
}

export function resetIdCounter(): void {
  _idCounter = 0;
}
