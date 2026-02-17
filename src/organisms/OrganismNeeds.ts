import { Organism } from './Organism';

export interface NeedsState {
  hunger: number;        // 0 = full, 1 = starving
  integrity: number;     // current integrity
  reproductionDrive: number; // how strongly wants to reproduce
}

export function assessNeeds(organism: Organism): NeedsState {
  return {
    hunger: 1 - (organism.energy / organism.phenotype.energyCapacity),
    integrity: organism.integrity,
    reproductionDrive: organism.energy > organism.phenotype.energyCapacity * organism.phenotype.divisionThreshold ? 1 : 0,
  };
}
