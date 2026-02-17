import { Organism } from './Organism';
import { Vector2 } from '../utils/Vector2';
import { ChemicalField } from '../chemistry/ChemicalField';
import { EnergySource } from '../chemistry/EnergySource';

export function buildSensorReadings(
  organism: Organism,
  chemField: ChemicalField,
  energySources: EnergySource[],
  nearbyOrganisms: Organism[],
  tick: number
): void {
  // Chemical gradient
  const gradient = chemField.getGradient(organism.position.x, organism.position.y, 'organic');

  // Light from energy sources
  let lightIntensity = 0;
  let lightDir = Vector2.zero();
  for (const src of energySources) {
    if (src.type === 'uv_radiation') {
      const energy = src.getEnergyAt(organism.position, tick);
      if (energy > lightIntensity) {
        lightIntensity = energy;
        lightDir = src.position.sub(organism.position).normalize();
      }
    }
  }

  // Nearest entity
  let nearest: { distance: number; direction: Vector2 } | null = null;
  let nearestDist = Infinity;
  for (const other of nearbyOrganisms) {
    if (other.id === organism.id) continue;
    const dist = organism.position.distanceTo(other.position);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = { distance: dist, direction: other.position.sub(organism.position).normalize() };
    }
  }

  // Touch
  const touchActive = nearestDist < organism.phenotype.bodyRadius * 2;

  organism.sense(gradient, lightIntensity, lightDir, nearest, touchActive);
}
