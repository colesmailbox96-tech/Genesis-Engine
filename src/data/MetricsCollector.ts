export interface MetricsSnapshot {
  tick: number;
  population: number;
  speciesCount: number;
  totalEnergy: number;
  avgGenomeLength: number;
  avgNeuralNodes: number;
  births: number;
  deaths: number;
}

export class MetricsCollector {
  snapshots: MetricsSnapshot[] = [];
  private interval: number;
  private lastTick: number = 0;

  constructor(interval: number = 100) {
    this.interval = interval;
  }

  shouldCollect(tick: number): boolean {
    return tick - this.lastTick >= this.interval;
  }

  collect(snapshot: MetricsSnapshot): void {
    this.snapshots.push(snapshot);
    this.lastTick = snapshot.tick;

    // Keep last 5000 snapshots
    if (this.snapshots.length > 5000) {
      this.snapshots = this.snapshots.slice(-2500);
    }
  }

  getPopulationSeries(): { tick: number; value: number }[] {
    return this.snapshots.map(s => ({ tick: s.tick, value: s.population }));
  }

  getSpeciesSeries(): { tick: number; value: number }[] {
    return this.snapshots.map(s => ({ tick: s.tick, value: s.speciesCount }));
  }

  toCSV(): string {
    const headers = 'tick,population,speciesCount,totalEnergy,avgGenomeLength,avgNeuralNodes,births,deaths';
    const rows = this.snapshots.map(s =>
      `${s.tick},${s.population},${s.speciesCount},${s.totalEnergy.toFixed(2)},${s.avgGenomeLength.toFixed(1)},${s.avgNeuralNodes.toFixed(1)},${s.births},${s.deaths}`
    );
    return [headers, ...rows].join('\n');
  }
}
