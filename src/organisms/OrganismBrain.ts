import { NEATGenome, neatForward } from '../neural/NEAT';

export class OrganismBrain {
  genome: NEATGenome;
  lastOutputs: number[] = [];

  constructor(genome: NEATGenome) {
    this.genome = genome;
  }

  forward(inputs: number[]): number[] {
    this.lastOutputs = neatForward(this.genome, inputs);
    return this.lastOutputs;
  }

  get nodeCount(): number {
    return this.genome.nodeGenes.length;
  }

  get connectionCount(): number {
    return this.genome.connectionGenes.filter(c => c.enabled).length;
  }

  get hiddenNodeCount(): number {
    return this.genome.nodeGenes.filter(n => n.type === 'hidden').length;
  }
}
