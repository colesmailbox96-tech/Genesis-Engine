import { Organism } from '../organisms/Organism';

export function calculateFitness(organism: Organism): number {
  // Fitness based on survival time, energy, offspring
  const ageFactor = Math.min(organism.age / 10000, 1) * 20;
  const energyFactor = organism.energy / organism.phenotype.energyCapacity * 10;
  const offspringFactor = organism.offspring * 5;
  return ageFactor + energyFactor + offspringFactor;
}

export function applySelectionPressure(organisms: Organism[], maxPop: number): Organism[] {
  if (organisms.length <= maxPop) return organisms;

  // Sort by fitness, keep the fittest
  const sorted = [...organisms].sort((a, b) => calculateFitness(b) - calculateFitness(a));
  const survivors = sorted.slice(0, maxPop);

  // Mark the rest as dead
  for (let i = maxPop; i < sorted.length; i++) {
    sorted[i].alive = false;
  }

  return survivors;
}
