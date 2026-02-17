import { Genome } from '../organisms/Genome';
import { Random } from '../utils/Random';

export function crossover(parent1: Genome, parent2: Genome, rng: Random): Genome {
  return parent1.crossover(parent2, rng);
}

export function shouldCrossover(parent1: Genome, parent2: Genome, threshold: number): boolean {
  return parent1.distanceTo(parent2) < threshold;
}
