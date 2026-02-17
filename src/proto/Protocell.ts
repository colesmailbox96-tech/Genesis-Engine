import { Vector2 } from '../utils/Vector2';
import { Random } from '../utils/Random';
import { generateId } from '../utils/Math';
import { Molecule } from '../chemistry/Molecule';
import { Replicator } from './Replicator';
import { ProtoMetabolism } from './Metabolism';
import { SpatialEntity } from '../engine/SpatialHash';

export interface Membrane {
  lipidCount: number;
  permeability: Record<string, number>;
  stability: number;
  surfaceMolecules: Molecule[];
}

export class Protocell implements SpatialEntity {
  id: string;
  position: Vector2;
  velocity: Vector2;
  membrane: Membrane;
  interior: Molecule[];
  replicators: Replicator[];
  metabolism: ProtoMetabolism;
  energy: number;
  age: number = 0;
  integrity: number = 1;
  parentId: string | null = null;

  constructor(position: Vector2, lipidCount: number = 20) {
    this.id = generateId();
    this.position = position;
    this.velocity = Vector2.zero();
    this.membrane = {
      lipidCount,
      permeability: { H2: 0.8, CO2: 0.7 },
      stability: 0.5 + lipidCount * 0.02,
      surfaceMolecules: [],
    };
    this.interior = [];
    this.replicators = [];
    this.metabolism = new ProtoMetabolism();
    this.energy = lipidCount * 0.1;
  }

  get size(): number {
    return Math.sqrt(this.interior.length + this.membrane.lipidCount) * 0.5;
  }

  get complexityScore(): number {
    const types = new Set(this.interior.map(m => m.getFormula()));
    return types.size;
  }

  get metabolismRate(): number {
    return this.metabolism.metabolismRate;
  }

  get replicationPotential(): number {
    return this.replicators.length > 0 ? this.replicators[0].polymer.fidelity : 0;
  }

  tick(rng: Random, temperature: number): Protocell | null {
    this.age++;

    // Membrane stability affected by temperature
    const tempFactor = 1 - Math.abs(temperature - 0.5) * 0.5;
    this.integrity = Math.min(1, this.membrane.stability * tempFactor);

    // Movement from currents
    this.position = this.position.add(this.velocity);

    // Metabolism
    const substrates = new Set(this.interior.map(m => m.getFormula()));
    const energyGain = this.metabolism.tick(substrates);
    this.energy += energyGain;

    // Energy cost of maintaining membrane
    this.energy -= this.membrane.lipidCount * 0.0001;

    // Replicator activity
    for (const rep of this.replicators) {
      const child = rep.tick(this.energy, rng);
      if (child) {
        this.energy -= rep.energyCost;
        this.replicators.push(child);
      }
    }

    // Check for division
    if (this.interior.length > 30 || this.replicators.length > 3) {
      if (rng.next() < 0.01 * (this.interior.length / 30)) {
        return this.divide(rng);
      }
    }

    // Integrity check
    if (this.energy <= 0 || this.integrity <= 0) {
      return null;
    }

    return null;
  }

  divide(rng: Random): Protocell {
    const daughter = new Protocell(
      this.position.add(new Vector2(rng.range(-2, 2), rng.range(-2, 2))),
      Math.floor(this.membrane.lipidCount / 2)
    );
    daughter.parentId = this.id;

    // Split interior molecules
    const shuffled = rng.shuffle(this.interior);
    const split = Math.floor(shuffled.length / 2);
    daughter.interior = shuffled.slice(0, split);
    this.interior = shuffled.slice(split);

    // Split replicators
    if (this.replicators.length > 1) {
      const repSplit = Math.floor(this.replicators.length / 2);
      daughter.replicators = this.replicators.splice(0, repSplit);
    } else if (this.replicators.length === 1 && rng.bool()) {
      daughter.replicators = [this.replicators[0]];
      this.replicators = [];
    }

    // Split energy
    daughter.energy = this.energy * 0.4;
    this.energy *= 0.6;

    // Halve parent lipids
    this.membrane.lipidCount = Math.ceil(this.membrane.lipidCount / 2);

    // Copy metabolism pathways
    daughter.metabolism.pathways = this.metabolism.pathways.map(p => ({
      ...p,
      currentCycle: 0,
    }));

    return daughter;
  }

  absorbMolecule(mol: Molecule): boolean {
    const formula = mol.getFormula();
    const perm = this.membrane.permeability[formula] ?? 0.1;
    if (Math.random() < perm && mol.atoms.length <= 5) {
      this.interior.push(mol);
      this.energy += mol.energy * 0.1;
      return true;
    }
    return false;
  }
}
