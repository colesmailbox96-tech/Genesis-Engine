import { NEATGenome } from './NEAT';

export function serializeGenome(genome: NEATGenome): string {
  return JSON.stringify(genome);
}

export function deserializeGenome(data: string): NEATGenome {
  return JSON.parse(data) as NEATGenome;
}
