import { Phenotype } from './Genome';

export interface BodySegment {
  relativePosition: { x: number; y: number };
  radius: number;
  angle: number;
}

export function getBodySegments(phenotype: Phenotype): BodySegment[] {
  const segments: BodySegment[] = [];
  const r = phenotype.bodyRadius;

  switch (phenotype.bodyShape) {
    case 'circular':
      segments.push({ relativePosition: { x: 0, y: 0 }, radius: r, angle: 0 });
      break;
    case 'elongated':
      segments.push({ relativePosition: { x: -r * 0.5, y: 0 }, radius: r * 0.7, angle: 0 });
      segments.push({ relativePosition: { x: r * 0.5, y: 0 }, radius: r * 0.7, angle: 0 });
      break;
    case 'branched':
      segments.push({ relativePosition: { x: 0, y: 0 }, radius: r * 0.8, angle: 0 });
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        segments.push({
          relativePosition: { x: Math.cos(angle) * r, y: Math.sin(angle) * r },
          radius: r * 0.4,
          angle,
        });
      }
      break;
    case 'amorphous':
      segments.push({ relativePosition: { x: 0, y: 0 }, radius: r * 1.1, angle: 0 });
      break;
  }
  return segments;
}
