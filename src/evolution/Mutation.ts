import { Genome } from '../organisms/Genome';
import { Random } from '../utils/Random';

export function mutateGenome(genome: Genome, rng: Random): Genome {
  return genome.replicate(rng);
}

export function getMutationRate(genome: Genome, environmentStress: number): number {
  // Higher stress = higher mutation rate (faster adaptation)
  return genome.mutationRate * (1 + environmentStress);
}
