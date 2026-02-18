import { Random } from '../utils/Random';
import { InformationPolymer } from './InformationPolymer';

export class Replicator {
  polymer: InformationPolymer;
  replicationSpeed: number; // ticks per copy
  replicationProgress: number = 0;
  copyCount: number = 0;

  constructor(polymer: InformationPolymer, speed: number = 100) {
    this.polymer = polymer;
    this.replicationSpeed = speed;
  }

  get errorRate(): number {
    return 1 - this.polymer.fidelity;
  }

  get energyCost(): number {
    return this.polymer.length * 0.01;
  }

  tick(availableEnergy: number, rng: Random, temperature: number = 0.5): Replicator | null {
    if (availableEnergy < this.energyCost) return null;

    this.replicationProgress++;
    if (this.replicationProgress >= this.replicationSpeed) {
      this.replicationProgress = 0;
      this.copyCount++;
      const newPolymer = this.polymer.copyWithTemperature(rng, temperature);
      const speed = this.replicationSpeed + rng.gaussian(0, 5);
      return new Replicator(newPolymer, Math.max(10, speed));
    }
    return null;
  }
}
