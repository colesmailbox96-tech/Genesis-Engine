import { Random } from '../utils/Random';
import { NEATGenome, createMinimalGenome, mutateGenome, crossoverGenomes, geneticDistance } from '../neural/NEAT';

export enum GeneType {
  BODY_SIZE, BODY_SHAPE, BODY_SYMMETRY,
  SENSOR_CHEMICAL, SENSOR_LIGHT, SENSOR_TOUCH, SENSOR_PROXIMITY, SENSOR_INTERNAL,
  ACTUATOR_FLAGELLUM, ACTUATOR_CILIA, ACTUATOR_INGESTION, ACTUATOR_SECRETION,
  ACTUATOR_ADHESION, ACTUATOR_DIVISION,
  METABOLISM_CHEMOSYNTHESIS, METABOLISM_PHOTOSYNTHESIS, METABOLISM_HETEROTROPHY, METABOLISM_FERMENTATION,
  NEURAL_CONNECTION, NEURAL_NODE, NEURAL_BIAS, NEURAL_MODULATION,
  DEFENSE_TOXIN, DEFENSE_SHELL, DEFENSE_SPEED, DEFENSE_CAMOUFLAGE,
  SIGNAL_EMISSION, SIGNAL_RECEPTION, COOPERATION_MARKER,
}

export interface Gene {
  type: GeneType;
  parameters: number[];
  regulatory: number;  // 0-1 expression level
  enabled: boolean;
}

export type BodyShape = 'circular' | 'elongated' | 'branched' | 'amorphous';
export type MetabolismType = 'chemosynthesis' | 'photosynthesis' | 'heterotrophy' | 'fermentation';

export interface Sensor {
  type: string;
  range: number;
  sensitivity: number;
  angle: number;  // position on body
}

export interface Actuator {
  type: string;
  strength: number;
  energyCost: number;
}

export interface Phenotype {
  bodyRadius: number;
  bodyShape: BodyShape;
  bodyColor: [number, number, number];
  maxSpeed: number;
  mass: number;
  sensors: Sensor[];
  actuators: Actuator[];
  metabolismType: MetabolismType;
  metabolicEfficiency: number;
  energyCapacity: number;
  basalMetabolicRate: number;
  neuralTopology: NEATGenome;
  toxicity: number;
  shellThickness: number;
  camouflageLevel: number;
  divisionEnergyCost: number;
  divisionThreshold: number;
  offspringSize: number;
  maxAge: number;
  signalType: number;
  cooperationMarker: number;
}

export class Genome {
  genes: Gene[];
  mutationRate: number;
  neuralGenome: NEATGenome;

  constructor(genes: Gene[], neuralGenome: NEATGenome, mutationRate: number = 0.01) {
    this.genes = genes;
    this.neuralGenome = neuralGenome;
    this.mutationRate = mutationRate;
  }

  get totalLength(): number { return this.genes.length; }

  express(): Phenotype {
    let bodySize = 1.0;
    let shape: BodyShape = 'circular';
    let metabolismType: MetabolismType = 'chemosynthesis';
    const sensors: Sensor[] = [];
    const actuators: Actuator[] = [];
    let toxicity = 0, shell = 0, camouflage = 0, speed = 1;
    let signalType = 0, cooperationMarker = 0;

    for (const gene of this.genes) {
      if (!gene.enabled || gene.regulatory < 0.1) continue;
      const p = gene.parameters;
      const reg = gene.regulatory;

      switch (gene.type) {
        case GeneType.BODY_SIZE: bodySize = (p[0] ?? 1) * reg; break;
        case GeneType.BODY_SHAPE: {
          const shapes: BodyShape[] = ['circular', 'elongated', 'branched', 'amorphous'];
          shape = shapes[Math.floor((p[0] ?? 0) * 4) % 4]; break;
        }
        case GeneType.SENSOR_CHEMICAL:
          sensors.push({ type: 'chemical', range: (p[0] ?? 10) * reg, sensitivity: (p[1] ?? 0.5) * reg, angle: p[2] ?? 0 }); break;
        case GeneType.SENSOR_LIGHT:
          sensors.push({ type: 'light', range: (p[0] ?? 15) * reg, sensitivity: (p[1] ?? 0.5) * reg, angle: p[2] ?? 0 }); break;
        case GeneType.SENSOR_TOUCH:
          sensors.push({ type: 'touch', range: 1, sensitivity: reg, angle: p[0] ?? 0 }); break;
        case GeneType.SENSOR_PROXIMITY:
          sensors.push({ type: 'proximity', range: (p[0] ?? 10) * reg, sensitivity: reg, angle: p[1] ?? 0 }); break;
        case GeneType.SENSOR_INTERNAL:
          sensors.push({ type: 'internal', range: 0, sensitivity: reg, angle: 0 }); break;
        case GeneType.ACTUATOR_FLAGELLUM:
          actuators.push({ type: 'flagellum', strength: (p[0] ?? 1) * reg, energyCost: 0.005 }); break;
        case GeneType.ACTUATOR_CILIA:
          actuators.push({ type: 'cilia', strength: (p[0] ?? 0.5) * reg, energyCost: 0.003 }); break;
        case GeneType.ACTUATOR_INGESTION:
          actuators.push({ type: 'ingestion', strength: (p[0] ?? 1) * reg, energyCost: 0.002 }); break;
        case GeneType.ACTUATOR_SECRETION:
          actuators.push({ type: 'secretion', strength: (p[0] ?? 0.5) * reg, energyCost: 0.004 }); break;
        case GeneType.ACTUATOR_ADHESION:
          actuators.push({ type: 'adhesion', strength: (p[0] ?? 1) * reg, energyCost: 0.001 }); break;
        case GeneType.ACTUATOR_DIVISION:
          actuators.push({ type: 'division', strength: reg, energyCost: 0.4 }); break;
        case GeneType.METABOLISM_CHEMOSYNTHESIS: metabolismType = 'chemosynthesis'; break;
        case GeneType.METABOLISM_PHOTOSYNTHESIS: metabolismType = 'photosynthesis'; break;
        case GeneType.METABOLISM_HETEROTROPHY: metabolismType = 'heterotrophy'; break;
        case GeneType.METABOLISM_FERMENTATION: metabolismType = 'fermentation'; break;
        case GeneType.DEFENSE_TOXIN: toxicity = (p[0] ?? 0.5) * reg; break;
        case GeneType.DEFENSE_SHELL: shell = (p[0] ?? 0.3) * reg; break;
        case GeneType.DEFENSE_SPEED: speed *= 1 + (p[0] ?? 0.5) * reg; break;
        case GeneType.DEFENSE_CAMOUFLAGE: camouflage = (p[0] ?? 0.5) * reg; break;
        case GeneType.SIGNAL_EMISSION: signalType = (p[0] ?? 1); break;
        case GeneType.COOPERATION_MARKER: cooperationMarker = (p[0] ?? 1); break;
      }
    }

    // Ensure at least one sensor and actuator
    if (sensors.length === 0) {
      sensors.push({ type: 'internal', range: 0, sensitivity: 0.5, angle: 0 });
    }
    if (actuators.length === 0) {
      actuators.push({ type: 'flagellum', strength: 0.5, energyCost: 0.005 });
    }

    const mass = bodySize * bodySize * (1 + shell);
    const colorMap: Record<MetabolismType, [number, number, number]> = {
      chemosynthesis: [255, 107, 53],
      photosynthesis: [0, 230, 118],
      heterotrophy: [224, 64, 251],
      fermentation: [255, 214, 0],
    };

    return {
      bodyRadius: Math.max(0.5, bodySize),
      bodyShape: shape,
      bodyColor: colorMap[metabolismType],
      maxSpeed: speed * (1 - shell * 0.5) / Math.sqrt(mass),
      mass,
      sensors,
      actuators,
      metabolismType,
      metabolicEfficiency: 0.3 + this.genes.filter(g => g.type >= GeneType.METABOLISM_CHEMOSYNTHESIS && g.type <= GeneType.METABOLISM_FERMENTATION).length * 0.1,
      energyCapacity: bodySize * 10,
      basalMetabolicRate: 0.01 * mass,
      neuralTopology: this.neuralGenome,
      toxicity,
      shellThickness: shell,
      camouflageLevel: camouflage,
      divisionEnergyCost: 0.4 * mass,
      divisionThreshold: 0.6,
      offspringSize: 0.5,
      maxAge: 30000 + bodySize * 5000,
      signalType,
      cooperationMarker,
    };
  }

  replicate(rng: Random): Genome {
    const newGenes = this.genes.map(g => {
      const gene = { ...g, parameters: [...g.parameters] };
      if (rng.next() < this.mutationRate) {
        if (gene.parameters.length > 0) {
          const idx = rng.int(0, gene.parameters.length);
          gene.parameters[idx] += rng.gaussian(0, 0.1);
        }
        if (rng.next() < 0.05) gene.enabled = !gene.enabled;
        gene.regulatory = Math.max(0, Math.min(1, gene.regulatory + rng.gaussian(0, 0.05)));
      }
      return gene;
    });

    // Gene insertion
    if (rng.next() < this.mutationRate * 0.5) {
      const types = Object.values(GeneType).filter(v => typeof v === 'number') as GeneType[];
      newGenes.push({
        type: rng.pick(types),
        parameters: [rng.range(0, 1), rng.range(0, 1)],
        regulatory: rng.range(0.3, 1),
        enabled: true,
      });
    }

    // Gene deletion — rate increases with genome length to counter bloat.
    // 15 genes is the baseline complexity for a functional organism (body + sensors
    // + actuators + metabolism). Beyond that, each extra gene adds 0.5% deletion
    // probability, providing gradual pressure against unbounded genome growth.
    const deletionRate = this.mutationRate * 0.3 + Math.max(0, (newGenes.length - 15) * 0.005);
    if (rng.next() < deletionRate && newGenes.length > 5) {
      newGenes.splice(rng.int(0, newGenes.length), 1);
    }

    const newNeural = mutateGenome(this.neuralGenome, rng, {
      weightMutationRate: 0.8,
      weightPerturbation: 0.1,
      addConnectionRate: 0.05,
      addNodeRate: 0.03,
      toggleConnectionRate: 0.01,
    });

    return new Genome(newGenes, newNeural, this.mutationRate + rng.gaussian(0, 0.001));
  }

  /** Horizontal gene transfer: absorb genes from another genome */
  horizontalTransfer(donor: Genome, rng: Random): Genome {
    const newGenes = [...this.genes.map(g => ({ ...g, parameters: [...g.parameters] }))];

    // Transfer 1-3 random genes from donor
    const transferCount = rng.int(1, Math.min(4, donor.genes.length + 1));
    for (let i = 0; i < transferCount; i++) {
      const donorGene = rng.pick(donor.genes);
      newGenes.push({ ...donorGene, parameters: [...donorGene.parameters] });
    }

    return new Genome(newGenes, this.neuralGenome, this.mutationRate);
  }

  /** Gene duplication: duplicate a random gene */
  duplicateGene(rng: Random): void {
    if (this.genes.length > 0 && this.genes.length < 50) {
      const gene = rng.pick(this.genes);
      this.genes.push({
        ...gene,
        parameters: [...gene.parameters],
        regulatory: gene.regulatory * (0.8 + rng.next() * 0.4),
      });
    }
  }

  crossover(other: Genome, rng: Random): Genome {
    const maxLen = Math.max(this.genes.length, other.genes.length);
    const newGenes: Gene[] = [];
    for (let i = 0; i < maxLen; i++) {
      if (i < this.genes.length && i < other.genes.length) {
        newGenes.push(rng.bool() ? { ...this.genes[i], parameters: [...this.genes[i].parameters] } : { ...other.genes[i], parameters: [...other.genes[i].parameters] });
      } else if (i < this.genes.length) {
        newGenes.push({ ...this.genes[i], parameters: [...this.genes[i].parameters] });
      } else {
        newGenes.push({ ...other.genes[i], parameters: [...other.genes[i].parameters] });
      }
    }

    const newNeural = crossoverGenomes(this.neuralGenome, other.neuralGenome, rng);
    return new Genome(newGenes, newNeural, (this.mutationRate + other.mutationRate) / 2);
  }

  distanceTo(other: Genome): number {
    let geneDist = Math.abs(this.genes.length - other.genes.length) * 0.5;
    const minLen = Math.min(this.genes.length, other.genes.length);
    for (let i = 0; i < minLen; i++) {
      if (this.genes[i].type !== other.genes[i].type) geneDist += 1;
    }
    const neuralDist = geneticDistance(this.neuralGenome, other.neuralGenome, 1, 1, 0.4);
    return geneDist + neuralDist;
  }

  static createInitial(inputCount: number, outputCount: number, metabolismType: MetabolismType, rng: Random): Genome {
    const genes: Gene[] = [
      { type: GeneType.BODY_SIZE, parameters: [rng.range(0.8, 1.5)], regulatory: 1, enabled: true },
      { type: GeneType.BODY_SHAPE, parameters: [rng.range(0, 1)], regulatory: 1, enabled: true },
      { type: GeneType.SENSOR_CHEMICAL, parameters: [10, 0.5, 0], regulatory: 1, enabled: true },
      { type: GeneType.SENSOR_INTERNAL, parameters: [], regulatory: 1, enabled: true },
      { type: GeneType.ACTUATOR_FLAGELLUM, parameters: [1], regulatory: 1, enabled: true },
      { type: GeneType.ACTUATOR_INGESTION, parameters: [1], regulatory: 1, enabled: true },
      { type: GeneType.ACTUATOR_DIVISION, parameters: [1], regulatory: 1, enabled: true },
    ];

    const metaMap: Record<MetabolismType, GeneType> = {
      chemosynthesis: GeneType.METABOLISM_CHEMOSYNTHESIS,
      photosynthesis: GeneType.METABOLISM_PHOTOSYNTHESIS,
      heterotrophy: GeneType.METABOLISM_HETEROTROPHY,
      fermentation: GeneType.METABOLISM_FERMENTATION,
    };
    genes.push({ type: metaMap[metabolismType], parameters: [1], regulatory: 1, enabled: true });

    const neuralGenome = createMinimalGenome(inputCount, outputCount, rng);
    return new Genome(genes, neuralGenome, 0.01);
  }
}
