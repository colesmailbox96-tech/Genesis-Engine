import { Vector2 } from '../utils/Vector2';
import { Random } from '../utils/Random';
import { generateId, clamp } from '../utils/Math';
import { SpatialEntity } from '../engine/SpatialHash';
import { Genome, Phenotype } from './Genome';
import { neatForward } from '../neural/NEAT';
import { computeNeuralCost } from '../neural/GeneticEncoding';

// Output indices
export const MOVE_X = 0;
export const MOVE_Y = 1;
export const MOVE_SPEED = 2;
export const INGESTION = 3;
export const SECRETION = 4;
export const DIVISION_OUTPUT = 5;
export const SIGNAL_OUT = 6;
export const ADHESION_OUT = 7;

export class Organism implements SpatialEntity {
  id: string;
  genome: Genome;
  phenotype: Phenotype;
  species: number = 0;
  generation: number = 0;
  parentId: string = '';
  birthTick: number = 0;

  position: Vector2;
  velocity: Vector2 = Vector2.zero();
  orientation: number = 0;
  energy: number;
  integrity: number = 1;
  age: number = 0;

  sensorReadings: number[] = [];
  actuatorOutputs: number[] = [];

  alive: boolean = true;
  killCount: number = 0;
  offspring: number = 0;

  // For adhesion/multicellularity tracking
  adheredTo: string | null = null;
  adheredTicks: number = 0;

  constructor(genome: Genome, position: Vector2, generation: number = 0) {
    this.id = generateId();
    this.genome = genome;
    this.phenotype = genome.express();
    this.position = position;
    this.energy = this.phenotype.energyCapacity * 0.7;
    this.generation = generation;
    this.actuatorOutputs = new Array(8).fill(0);
    this.sensorReadings = [];
  }

  sense(
    chemicalGradient: Vector2,
    lightIntensity: number,
    lightDirection: Vector2,
    nearestEntity: { distance: number; direction: Vector2 } | null,
    touchActive: boolean
  ): void {
    const readings: number[] = [];

    for (const sensor of this.phenotype.sensors) {
      switch (sensor.type) {
        case 'chemical':
          readings.push(chemicalGradient.x * sensor.sensitivity);
          readings.push(chemicalGradient.y * sensor.sensitivity);
          break;
        case 'light':
          readings.push(lightIntensity * sensor.sensitivity);
          readings.push(lightDirection.x * sensor.sensitivity);
          readings.push(lightDirection.y * sensor.sensitivity);
          break;
        case 'touch':
          readings.push(touchActive ? 1 : 0);
          break;
        case 'proximity':
          if (nearestEntity) {
            readings.push(1 - clamp(nearestEntity.distance / sensor.range, 0, 1));
            readings.push(nearestEntity.direction.x);
            readings.push(nearestEntity.direction.y);
          } else {
            readings.push(0);
            readings.push(0);
            readings.push(0);
          }
          break;
        case 'internal':
          readings.push(this.energy / this.phenotype.energyCapacity);
          readings.push(this.integrity);
          break;
      }
    }

    // Add orientation
    readings.push(Math.cos(this.orientation));
    readings.push(Math.sin(this.orientation));

    this.sensorReadings = readings;
  }

  think(): void {
    const inputCount = this.phenotype.neuralTopology.nodeGenes.filter(n => n.type === 'input').length;
    while (this.sensorReadings.length < inputCount) {
      this.sensorReadings.push(0);
    }
    if (this.sensorReadings.length > inputCount) {
      this.sensorReadings = this.sensorReadings.slice(0, inputCount);
    }

    this.actuatorOutputs = neatForward(this.phenotype.neuralTopology, this.sensorReadings);

    while (this.actuatorOutputs.length < 8) {
      this.actuatorOutputs.push(0);
    }
  }

  act(worldSize: number): void {
    const moveX = this.actuatorOutputs[MOVE_X] ?? 0;
    const moveY = this.actuatorOutputs[MOVE_Y] ?? 0;
    const speed = Math.abs(this.actuatorOutputs[MOVE_SPEED] ?? 0);

    const moveVec = new Vector2(moveX, moveY).normalize().mul(speed * this.phenotype.maxSpeed);
    this.velocity = moveVec;
    this.position = this.position.add(this.velocity);

    // Wrap around world
    this.position = new Vector2(
      ((this.position.x % worldSize) + worldSize) % worldSize,
      ((this.position.y % worldSize) + worldSize) % worldSize
    );

    // Movement energy cost
    const moveCost = moveVec.length() * 0.005;
    this.energy -= moveCost;

    // Update orientation
    if (moveVec.length() > 0.01) {
      this.orientation = moveVec.angle();
    }
  }

  metabolize(environmentEnergy: number, lightLevel: number): void {
    switch (this.phenotype.metabolismType) {
      case 'chemosynthesis':
        this.energy += environmentEnergy * this.phenotype.metabolicEfficiency * 0.1;
        break;
      case 'photosynthesis':
        this.energy += lightLevel * this.phenotype.metabolicEfficiency * 0.15;
        break;
      case 'heterotrophy':
        // Energy gained through ingestion handled elsewhere
        break;
      case 'fermentation':
        this.energy += environmentEnergy * this.phenotype.metabolicEfficiency * 0.05;
        break;
    }

    this.energy = Math.min(this.energy, this.phenotype.energyCapacity);
  }

  tickAge(): void {
    this.age++;
    this.energy -= this.phenotype.basalMetabolicRate;

    // Neural computation cost
    this.energy -= computeNeuralCost(this.phenotype.neuralTopology);

    // Death conditions
    if (this.energy <= 0 || this.integrity <= 0 || this.age > this.phenotype.maxAge) {
      this.alive = false;
    }
  }

  canDivide(): boolean {
    return this.energy > this.phenotype.energyCapacity * this.phenotype.divisionThreshold &&
      (this.actuatorOutputs[DIVISION_OUTPUT] ?? 0) > 0.5;
  }

  divide(rng: Random): Organism {
    const childGenome = this.genome.replicate(rng);
    const offset = Vector2.fromAngle(rng.range(0, Math.PI * 2), this.phenotype.bodyRadius * 2);
    const child = new Organism(childGenome, this.position.add(offset), this.generation + 1);
    child.parentId = this.id;
    child.species = this.species;
    child.birthTick = this.age;

    const transferEnergy = this.energy * this.phenotype.offspringSize;
    child.energy = transferEnergy;
    this.energy -= transferEnergy + this.phenotype.divisionEnergyCost;
    this.offspring++;

    return child;
  }

  takeDamage(amount: number): void {
    const reduction = this.phenotype.shellThickness * 0.5;
    const actualDamage = amount * (1 - reduction);
    this.integrity -= actualDamage;
    if (this.integrity <= 0) this.alive = false;
  }

  die(): void {
    this.alive = false;
  }
}
