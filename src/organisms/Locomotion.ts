import { Organism } from './Organism';

export function applyLocomotion(organism: Organism, worldSize: number): void {
  organism.act(worldSize);
}
