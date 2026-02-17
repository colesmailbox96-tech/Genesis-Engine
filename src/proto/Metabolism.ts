export interface MetabolicPathway {
  id: string;
  inputs: string[]; // required substrate types
  outputs: string[]; // produced types
  netEnergy: number; // energy per cycle
  efficiency: number; // 0-1
  cycleLength: number; // ticks per cycle
  currentCycle: number;
}

export class ProtoMetabolism {
  pathways: MetabolicPathway[] = [];
  totalEnergyProduced: number = 0;

  addPathway(pathway: MetabolicPathway): void {
    this.pathways.push(pathway);
  }

  tick(availableSubstrates: Set<string>): number {
    let energyProduced = 0;
    for (const pathway of this.pathways) {
      const hasInputs = pathway.inputs.every(i => availableSubstrates.has(i));
      if (!hasInputs) continue;

      pathway.currentCycle++;
      if (pathway.currentCycle >= pathway.cycleLength) {
        pathway.currentCycle = 0;
        const energy = pathway.netEnergy * pathway.efficiency;
        energyProduced += energy;
        this.totalEnergyProduced += energy;
      }
    }
    return energyProduced;
  }

  get metabolismRate(): number {
    if (this.pathways.length === 0) return 0;
    return this.pathways.reduce(
      (sum, p) => sum + (p.netEnergy * p.efficiency) / p.cycleLength,
      0
    );
  }
}
