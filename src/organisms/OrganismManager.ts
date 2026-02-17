import { Organism } from './Organism';
import { Genome, MetabolismType } from './Genome';
import { Random } from '../utils/Random';
import { Vector2 } from '../utils/Vector2';
import { SpatialHash } from '../engine/SpatialHash';
import { SimConfig } from '../engine/Config';

export class OrganismManager {
  organisms: Organism[] = [];
  deadOrganisms: Organism[] = [];
  spatialHash: SpatialHash<Organism>;
  private config: SimConfig;
  private rng: Random;
  totalBorn: number = 0;
  totalDied: number = 0;

  constructor(config: SimConfig, rng: Random) {
    this.config = config;
    this.rng = rng;
    this.spatialHash = new SpatialHash(config.spatialHashCellSize);
  }

  addOrganism(organism: Organism): void {
    if (this.organisms.length >= this.config.maxPopulation) return;
    this.organisms.push(organism);
    this.spatialHash.insert(organism);
    this.totalBorn++;
  }

  removeOrganism(organism: Organism): void {
    organism.alive = false;
    this.spatialHash.remove(organism);
    this.deadOrganisms.push(organism);
    this.totalDied++;
  }

  tick(tick: number): Organism[] {
    const newOrganisms: Organism[] = [];

    // Rebuild spatial hash
    this.spatialHash.clear();
    for (const org of this.organisms) {
      this.spatialHash.insert(org);
    }

    for (const organism of this.organisms) {
      if (!organism.alive) continue;

      // Age and metabolism
      organism.tickAge();

      if (!organism.alive) continue;

      // Division
      if (organism.canDivide() && this.organisms.length + newOrganisms.length < this.config.maxPopulation) {
        const child = organism.divide(this.rng);
        child.birthTick = tick;
        newOrganisms.push(child);
      }
    }

    // Remove dead
    const deadThisTick = this.organisms.filter(o => !o.alive);
    this.organisms = this.organisms.filter(o => o.alive);
    for (const dead of deadThisTick) {
      this.deadOrganisms.push(dead);
      this.totalDied++;
    }

    // Keep only recent dead for rendering death effects
    if (this.deadOrganisms.length > 100) {
      this.deadOrganisms = this.deadOrganisms.slice(-100);
    }

    // Add new organisms
    for (const newOrg of newOrganisms) {
      this.addOrganism(newOrg);
    }

    return newOrganisms;
  }

  getNearby(x: number, y: number, radius: number): Organism[] {
    return this.spatialHash.query(x, y, radius);
  }

  getSpeciesCounts(): Map<number, number> {
    const counts = new Map<number, number>();
    for (const org of this.organisms) {
      counts.set(org.species, (counts.get(org.species) ?? 0) + 1);
    }
    return counts;
  }

  get population(): number {
    return this.organisms.length;
  }

  spawnInitialOrganism(position: Vector2, metabolismType: MetabolismType, tick: number): Organism {
    const inputCount = 8;
    const outputCount = 8;

    const genome = Genome.createInitial(inputCount, outputCount, metabolismType, this.rng);
    const organism = new Organism(genome, position, 0);
    organism.birthTick = tick;
    this.addOrganism(organism);
    return organism;
  }
}
