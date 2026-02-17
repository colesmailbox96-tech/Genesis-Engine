import { Organism } from '../organisms/Organism';
import { calculateFitness } from './SelectionPressure';

export interface FitnessPoint {
  x: number;
  y: number;
  fitness: number;
  species: number;
}

export function computeFitnessLandscape(organisms: Organism[]): FitnessPoint[] {
  return organisms.map(org => ({
    x: org.position.x,
    y: org.position.y,
    fitness: calculateFitness(org),
    species: org.species,
  }));
}
