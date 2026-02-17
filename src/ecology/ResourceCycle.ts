export class ResourceCycle {
  organicMatter: number = 0;
  dissolvedMinerals: number = 100;

  addDeadOrganism(energy: number): void {
    this.organicMatter += energy;
  }

  decompose(rate: number): number {
    const decomposed = this.organicMatter * rate;
    this.organicMatter -= decomposed;
    this.dissolvedMinerals += decomposed * 0.8;
    return decomposed;
  }

  consumeMinerals(amount: number): number {
    const consumed = Math.min(amount, this.dissolvedMinerals);
    this.dissolvedMinerals -= consumed;
    return consumed;
  }
}
