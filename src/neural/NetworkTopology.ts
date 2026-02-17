import { NEATGenome } from './NEAT';

export function getInputCount(genome: NEATGenome): number {
  return genome.nodeGenes.filter(n => n.type === 'input').length;
}

export function getOutputCount(genome: NEATGenome): number {
  return genome.nodeGenes.filter(n => n.type === 'output').length;
}

export function getHiddenCount(genome: NEATGenome): number {
  return genome.nodeGenes.filter(n => n.type === 'hidden').length;
}

export function getEnabledConnectionCount(genome: NEATGenome): number {
  return genome.connectionGenes.filter(c => c.enabled).length;
}

export function getComplexity(genome: NEATGenome): number {
  return genome.nodeGenes.length + genome.connectionGenes.filter(c => c.enabled).length;
}
