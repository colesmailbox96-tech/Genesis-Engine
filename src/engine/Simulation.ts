import { SimConfig, DEFAULT_CONFIG } from './Config';
import { SpatialHash } from './SpatialHash';
import { Random } from '../utils/Random';
import { Vector2 } from '../utils/Vector2';
import { generateId } from '../utils/Math';

// Chemistry
import { Element, ELEMENT_PROPERTIES } from '../chemistry/Element';
import { Molecule } from '../chemistry/Molecule';
import { ReactionSystem } from '../chemistry/Reaction';
import { ChemicalField } from '../chemistry/ChemicalField';
import { EnergySource } from '../chemistry/EnergySource';
import { Catalysis } from '../chemistry/Catalysis';

// Proto
import { Protocell } from '../proto/Protocell';
import { Replicator } from '../proto/Replicator';
import { InformationPolymer } from '../proto/InformationPolymer';
import { ProtoSelection } from '../proto/ProtoSelection';

// Organisms
import { Organism } from '../organisms/Organism';
import { OrganismManager } from '../organisms/OrganismManager';
import { Genome, MetabolismType } from '../organisms/Genome';
import { buildSensorReadings } from '../organisms/Senses';

// Evolution
import { SpeciationSystem } from '../evolution/Speciation';
import { PhylogeneticTree } from '../evolution/PhylogeneticTree';
import { calculateFitness } from '../evolution/SelectionPressure';

// Ecology
import { EnvironmentMap } from '../ecology/EnvironmentZone';
import { Ecosystem } from '../ecology/Ecosystem';
import { FoodWeb } from '../ecology/FoodWeb';
import { ResourceCycle } from '../ecology/ResourceCycle';
import { ExtinctionEventSystem } from '../ecology/ExtinctionEvent';
import { SymbiosisSystem } from '../ecology/Symbiosis';
import { CoevolutionSystem } from '../ecology/Coevolution';

// Evolution (new)
import { PopulationGenetics } from '../evolution/PopulationGenetics';
import { applyPlasticity } from '../evolution/PhenotypicPlasticity';

// Discovery
import { CommunicationSystem } from '../discovery/Communication';
import { SocialLearningTracker } from '../discovery/SocialLearning';
import { CultureTracker, DiscoveryType } from '../discovery/CultureTracker';

// Data
import { DataLogger } from '../data/DataLogger';
import { MetricsCollector } from '../data/MetricsCollector';

export interface MilestoneEvent {
  type: string;
  tick: number;
  description: string;
}

export class Simulation {
  config: SimConfig;
  rng: Random;
  tick: number = 0;

  // Chemistry
  molecules: Molecule[] = [];
  moleculeSpatialHash: SpatialHash<Molecule>;
  chemicalField: ChemicalField;
  energySources: EnergySource[] = [];
  reactionSystem: ReactionSystem;
  catalysis: Catalysis;

  // Proto
  protocells: Protocell[] = [];
  protoSelection: ProtoSelection;

  // Organisms
  organismManager: OrganismManager;

  // Evolution
  speciationSystem: SpeciationSystem;
  phylogeneticTree: PhylogeneticTree;

  // Ecology
  environmentMap: EnvironmentMap;
  ecosystem: Ecosystem;
  foodWeb: FoodWeb;
  resourceCycle: ResourceCycle;
  extinctionSystem: ExtinctionEventSystem;

  // Discovery
  communicationSystem: CommunicationSystem;
  socialLearning: SocialLearningTracker;
  cultureTracker: CultureTracker;

  // New systems
  symbiosisSystem: SymbiosisSystem;
  coevolutionSystem: CoevolutionSystem;
  populationGenetics: PopulationGenetics;

  // Data
  dataLogger: DataLogger;
  metricsCollector: MetricsCollector;
  milestones: MilestoneEvent[] = [];

  // State tracking
  private milestoneSet = new Set<string>();
  private surfaceMap: Float32Array = new Float32Array(0);
  private viscosityMap: Float32Array = new Float32Array(0);

  constructor(config: SimConfig = DEFAULT_CONFIG, seed?: number) {
    this.config = config;
    this.rng = new Random(seed);

    // Initialize subsystems
    this.moleculeSpatialHash = new SpatialHash(config.spatialHashCellSize);
    this.chemicalField = new ChemicalField(config.worldSize, 64);
    this.reactionSystem = new ReactionSystem();
    this.catalysis = new Catalysis();
    this.protoSelection = new ProtoSelection();
    this.organismManager = new OrganismManager(config, this.rng);
    this.speciationSystem = new SpeciationSystem(config.speciationDistanceThreshold);
    this.phylogeneticTree = new PhylogeneticTree();
    this.environmentMap = new EnvironmentMap(config.worldSize, 64, this.rng.getSeed());
    this.ecosystem = new Ecosystem();
    this.foodWeb = new FoodWeb();
    this.resourceCycle = new ResourceCycle();
    this.extinctionSystem = new ExtinctionEventSystem();
    this.communicationSystem = new CommunicationSystem();
    this.socialLearning = new SocialLearningTracker();
    this.cultureTracker = new CultureTracker();
    this.symbiosisSystem = new SymbiosisSystem();
    this.coevolutionSystem = new CoevolutionSystem();
    this.populationGenetics = new PopulationGenetics();
    this.dataLogger = new DataLogger();
    this.metricsCollector = new MetricsCollector(100);

    this.initializeWorld();
    this.surfaceMap = this.generateSurfaceMap();
    this.viscosityMap = this.generateViscosityMap();
  }

  private initializeWorld(): void {
    this.createEnergySources();
    this.createInitialMolecules();
    this.seedChemicalField();
  }

  private createEnergySources(): void {
    const ws = this.config.worldSize;

    // Thermal vents
    for (let i = 0; i < this.config.ventCount; i++) {
      const x = this.rng.range(ws * 0.1, ws * 0.9);
      const y = this.rng.range(ws * 0.1, ws * 0.9);
      this.energySources.push(EnergySource.createVent(new Vector2(x, y), this.config.ventPower));
    }

    // UV zones
    for (let i = 0; i < 3; i++) {
      const x = this.rng.range(ws * 0.2, ws * 0.8);
      const y = this.rng.range(ws * 0.2, ws * 0.8);
      this.energySources.push(EnergySource.createUV(new Vector2(x, y), this.config.uvIntensityMax));
    }
  }

  private createInitialMolecules(): void {
    const ws = this.config.worldSize;
    const elements = [Element.H, Element.C, Element.N, Element.O, Element.P, Element.S];

    for (let i = 0; i < 500; i++) {
      const element = this.rng.pick(elements);
      const abundance = ELEMENT_PROPERTIES[element].abundance;

      if (this.rng.next() > abundance * 2) continue;

      const pos = new Vector2(this.rng.range(0, ws), this.rng.range(0, ws));
      const mol = Molecule.createRandom(element, pos, this.rng);
      this.molecules.push(mol);
    }
  }

  private seedChemicalField(): void {
    for (const source of this.energySources) {
      for (let i = 0; i < 10; i++) {
        const x = source.position.x + this.rng.gaussian(0, source.radius);
        const y = source.position.y + this.rng.gaussian(0, source.radius);
        this.chemicalField.addSource(x, y, 'organic', 0.3);
        this.chemicalField.addSource(x, y, 'mineral', 0.2);
      }
    }
  }

  private generateSurfaceMap(): Float32Array {
    const gridSize = 64;
    const map = new Float32Array(gridSize * gridSize);
    for (let i = 0; i < gridSize * gridSize; i++) {
      const gx = i % gridSize;
      const gy = Math.floor(i / gridSize);
      const worldX = (gx / gridSize) * this.config.worldSize;
      const worldY = (gy / gridSize) * this.config.worldSize;
      const zone = this.environmentMap.getZoneAt(worldX, worldY);
      if (zone && (zone.type === 'tidal_zone' || zone.type === 'volcanic_shore')) {
        map[i] = 0.7 + this.rng.next() * 0.3;
      } else if (zone && zone.type === 'hydrothermal_vent') {
        map[i] = 0.4 + this.rng.next() * 0.3;
      } else {
        map[i] = this.rng.next() * 0.2;
      }
    }
    return map;
  }

  private generateViscosityMap(): Float32Array {
    const gridSize = 64;
    const map = new Float32Array(gridSize * gridSize);
    for (let i = 0; i < gridSize * gridSize; i++) {
      const gx = i % gridSize;
      const gy = Math.floor(i / gridSize);
      const worldX = (gx / gridSize) * this.config.worldSize;
      const worldY = (gy / gridSize) * this.config.worldSize;
      const zone = this.environmentMap.getZoneAt(worldX, worldY);
      if (zone) {
        map[i] = zone.diffusionRate;
      } else {
        map[i] = 0.1;
      }
    }
    return map;
  }

  update(): void {
    this.tick++;

    // Update environment cycles
    this.environmentMap.updateCycles(this.tick);
    this.environmentMap.decayChemistry();

    // Chemistry
    this.updateChemistry();

    // Protocells
    this.updateProtocells();

    // Organisms
    this.updateOrganisms();

    // Ecology (every 100 ticks)
    if (this.tick % 100 === 0) {
      this.updateEcology();
    }

    // Check milestones
    this.checkMilestones();

    // Collect metrics
    if (this.metricsCollector.shouldCollect(this.tick)) {
      this.collectMetrics();
    }

    // Chemical field diffusion
    this.chemicalField.tickWithViscosity(this.viscosityMap);

    // Surface adsorption every 10 ticks
    if (this.tick % 10 === 0) {
      this.chemicalField.applySurfaceAdsorption(this.surfaceMap);
    }

    // Flow field advection every 50 ticks
    if (this.tick % 50 === 0) {
      const flowField = this.environmentMap.buildFlowField();
      this.chemicalField.advect(flowField);
    }

    // Extinction events
    const extinctionType = this.extinctionSystem.checkForEvent(
      this.tick, this.rng,
      this.config.volcanicEruptionRate,
      this.config.asteroidImpactRate,
      this.ecosystem.oxygenLevel,
      this.config.o2ToxicityThreshold
    );
    if (extinctionType) {
      this.extinctionSystem.startEvent(extinctionType, this.tick);
      this.addMilestone('MASS_EXTINCTION', `${extinctionType} event started`);
    }
    if (this.extinctionSystem.activeEvent) {
      this.extinctionSystem.applyEffects(this.organismManager.organisms, this.tick, this.rng);
    }

    // Spawn organisms from mature protocells (transition from chemistry to life)
    this.checkOrganismEmergence();

    // Prune data structures periodically
    if (this.tick % 10000 === 0) {
      this.phylogeneticTree.prune(5000);
    }
  }

  private updateChemistry(): void {
    // Rebuild spatial hash
    this.moleculeSpatialHash.clear();
    for (const mol of this.molecules) {
      this.moleculeSpatialHash.insert(mol);
    }

    // Molecule physics and reactions
    const newMolecules: Molecule[] = [];
    const toRemove = new Set<string>();

    for (const mol of this.molecules) {
      mol.tick();

      // Apply environment flow (in-place to reduce allocations)
      const zone = this.environmentMap.getZoneAt(mol.position.x, mol.position.y);
      mol.velocity.x += zone.flowDirection.x * zone.flowSpeed * 0.1;
      mol.velocity.y += zone.flowDirection.y * zone.flowSpeed * 0.1;
      mol.velocity.mulMut(0.99); // friction

      // Wrap position
      mol.position.wrapMut(this.config.worldSize);

      // Energy from nearby sources
      for (const source of this.energySources) {
        const energy = source.getEnergyAt(mol.position, this.tick);
        if (energy > 0) {
          mol.energy += energy * 0.001;
        }
      }

      // Reactions with nearby molecules
      const nearby = this.moleculeSpatialHash.query(mol.position.x, mol.position.y, this.config.reactionDistance);
      for (const other of nearby) {
        if (other.id === mol.id || toRemove.has(other.id) || toRemove.has(mol.id)) continue;

        // Event-driven: skip low-activity pairs
        if (mol.age > 1000 && other.age > 1000 && mol.energy < 1 && other.energy < 1) {
          if (this.rng.next() < 0.3) continue;
        }

        const rule = this.reactionSystem.checkReaction(mol, other, zone.temperature, undefined, zone.wetness);
        if (rule && this.rng.next() < rule.probability * zone.temperature) {
          const products = this.reactionSystem.executeReaction(mol, other, rule, this.rng);
          if (products.length > 0) {
            toRemove.add(mol.id);
            toRemove.add(other.id);
            for (const product of products) {
              // Track formation pathway
              product.formation = {
                parentFormulas: [mol.getFormula(), other.getFormula()],
                reactionType: rule.name,
                zoneName: zone.type,
                catalystFormula: null,
                tick: this.tick,
              };
              product.role = product.inferRole();
            }
            newMolecules.push(...products);

            // Add to chemical field
            this.chemicalField.addSource(mol.position.x, mol.position.y, 'organic', 0.05);
          }
        }
      }

      // Decay based on half-life
      const decayProb = 1 - Math.pow(0.5, 1 / Math.max(1, mol.halfLife));
      if (this.rng.next() < decayProb && mol.atoms.length > 2) {
        if (mol.bonds.length > 0) {
          mol.bonds.pop();
          mol.invalidateChainLength();
          mol.halfLife = mol.estimateHalfLife();
          if (mol.bonds.length === 0 && mol.atoms.length > 1) {
            toRemove.add(mol.id);
            const mid = Math.floor(mol.atoms.length / 2);
            const mol1 = Molecule.createRandom(mol.atoms[0].element, mol.position.clone(), this.rng);
            const mol2 = Molecule.createRandom(mol.atoms[mid]?.element ?? Element.H, mol.position.add(new Vector2(this.rng.range(-1, 1), this.rng.range(-1, 1))), this.rng);
            mol1.role = 'waste';
            mol2.role = 'waste';
            newMolecules.push(mol1, mol2);
          }
        }
      }

      // Polymer hydrolysis in wet conditions
      if (zone.wetness > 0.7 && mol.getChainLength() >= 4 && this.rng.next() < this.config.polymerHydrolysisRate * zone.wetness) {
        if (mol.bonds.length > 0) {
          mol.bonds.pop();
          mol.invalidateChainLength();
        }
      }

      // Toxin accumulation from reactions in zone
      if (zone.toxinLevel > 0.5 && mol.energy > 0) {
        mol.energy -= zone.toxinLevel * 0.001;
      }
    }

    // Remove consumed molecules
    this.molecules = this.molecules.filter(m => !toRemove.has(m.id));

    // Add new molecules (cap total)
    for (const mol of newMolecules) {
      if (this.molecules.length < this.config.maxEntities) {
        this.molecules.push(mol);
      }
    }

    // Lightning strikes
    if (this.rng.next() < this.config.lightningProbability) {
      const x = this.rng.range(0, this.config.worldSize);
      const y = this.rng.range(0, this.config.worldSize);

      // Create complex molecules from lightning
      for (let i = 0; i < 5; i++) {
        const pos = new Vector2(x + this.rng.gaussian(0, 5), y + this.rng.gaussian(0, 5));
        const element = this.rng.pick([Element.C, Element.N, Element.O, Element.H]);
        const mol = Molecule.createRandom(element, pos, this.rng);
        mol.energy += this.config.lightningEnergy * 0.1;

        // Try to make it more complex
        if (mol.atoms.length < 3) {
          const additionalElements = [Element.C, Element.H, Element.N];
          for (let j = 0; j < this.rng.int(1, 4); j++) {
            const elem = this.rng.pick(additionalElements);
            mol.atoms.push({ element: elem, bondCount: 0 });
            if (mol.atoms.length > 1) {
              mol.bonds.push({
                atomA: mol.atoms.length - 2,
                atomB: mol.atoms.length - 1,
                strength: 0.5 + this.rng.next() * 0.5,
                type: 'covalent',
              });
            }
          }
          mol.invalidateChainLength();
          mol.mass = mol.atoms.reduce((s, a) => s + ELEMENT_PROPERTIES[a.element].mass, 0);
        }

        this.molecules.push(mol);
      }

      this.chemicalField.addSource(x, y, 'organic', 0.5);
    }

    // Electrical storms — create redox-enriched molecules and energy bursts
    if (this.rng.next() < this.config.electricalStormProbability) {
      const x = this.rng.range(0, this.config.worldSize);
      const y = this.rng.range(0, this.config.worldSize);
      for (let i = 0; i < 3; i++) {
        const pos = new Vector2(x + this.rng.gaussian(0, 8), y + this.rng.gaussian(0, 8));
        const mol = Molecule.createRandom(this.rng.pick([Element.N, Element.O, Element.S]), pos, this.rng);
        mol.energy += 50;
        this.molecules.push(mol);
      }
      // Boost redox potential in nearby zone
      const zone = this.environmentMap.getZoneAt(x, y);
      zone.redoxPotential = Math.min(1, zone.redoxPotential + 0.3);
    }

    // UV bursts — damage fragile molecules in exposed zones
    if (this.rng.next() < this.config.uvBurstProbability) {
      for (const mol of this.molecules) {
        const zone = this.environmentMap.getZoneAt(mol.position.x, mol.position.y);
        if (zone.uvIntensity > 0.5 && mol.getChainLength() >= 3) {
          if (mol.bonds.length > 0 && this.rng.next() < 0.3) {
            mol.bonds.pop();
            mol.invalidateChainLength();
          }
        }
      }
    }

    // Heat spikes — damage molecules in volcanic zones
    if (this.rng.next() < this.config.heatSpikeProbability) {
      for (const mol of this.molecules) {
        const zone = this.environmentMap.getZoneAt(mol.position.x, mol.position.y);
        if (zone.temperature > 0.7 && this.rng.next() < 0.2) {
          mol.energy *= 0.5;
        }
      }
    }

    // Energy sources emit minerals
    for (const source of this.energySources) {
      if (this.tick % 50 === 0) {
        const minerals = source.emitMinerals(this.rng);
        for (const mineral of minerals) {
          this.chemicalField.addSource(
            source.position.x + this.rng.gaussian(0, 3),
            source.position.y + this.rng.gaussian(0, 3),
            'mineral',
            0.1
          );
        }
      }
    }
  }

  private updateProtocells(): void {
    // Check for spontaneous protocell formation from fatty acid clusters
    if (this.tick % 100 === 0) {
      this.checkProtocellFormation();
    }

    const newProtocells: Protocell[] = [];
    const deadProtocellIds = new Set<string>();

    for (const cell of this.protocells) {
      const zone = this.environmentMap.getZoneAt(cell.position.x, cell.position.y);
      const daughter = cell.tick(this.rng, zone.temperature);

      // Environmental pH/redox feedback from protocell metabolism
      const pHDelta = cell.metabolism.metabolismRate > 0 ? -0.001 : 0;
      const redoxDelta = cell.energy > 0 ? 0.001 : -0.001;
      this.environmentMap.modifyLocalChemistry(cell.position.x, cell.position.y, pHDelta, redoxDelta);

      if (daughter) {
        newProtocells.push(daughter);
        this.protoSelection.recordDivision(cell.id);
      }

      if (cell.energy <= 0 || cell.integrity <= 0) {
        deadProtocellIds.add(cell.id);
        // Release contents back to environment
        this.resourceCycle.addDeadOrganism(cell.energy);
      }

      // Absorb nearby molecules — collect IDs to remove in batch
      const nearby = this.moleculeSpatialHash.query(cell.position.x, cell.position.y, cell.size + 2);
      const absorbedIds = new Set<string>();
      for (const mol of nearby) {
        if (cell.absorbMolecule(mol)) {
          absorbedIds.add(mol.id);
        }
      }
      if (absorbedIds.size > 0) {
        this.molecules = this.molecules.filter(m => !absorbedIds.has(m.id));
      }

      this.protoSelection.track(cell);
    }

    // Remove dead protocells using Set lookup
    this.protocells = this.protocells.filter(c => !deadProtocellIds.has(c.id));

    // Add new protocells
    this.protocells.push(...newProtocells);

    // Cross-feeding: protocells leak metabolites that nearby cells can absorb
    if (this.tick % 10 === 0) {
      for (const cell of this.protocells) {
        const leaked = cell.leakMetabolites(this.rng);
        if (leaked.length === 0) continue;
        for (const other of this.protocells) {
          if (other.id === cell.id) continue;
          if (cell.position.distanceTo(other.position) < 20) {
            for (const metabolite of leaked) {
              other.energy += metabolite.energy * 0.3; // cross-feed benefit
            }
          }
        }
      }
    }

    // Cap protocells
    if (this.protocells.length > 200) {
      this.protocells.sort((a, b) => b.age - a.age);
      this.protocells = this.protocells.slice(0, 150);
    }

    // Waste-as-food: waste molecules near protocells provide energy
    if (this.tick % 5 === 0) {
      for (const cell of this.protocells) {
        const nearby = this.moleculeSpatialHash.query(cell.position.x, cell.position.y, 5);
        for (const mol of nearby) {
          if (mol.role === 'waste' && mol.energy > 0) {
            cell.energy += mol.energy * 0.2;
            mol.energy = 0;
          }
        }
      }
    }

    // Predation/parasitism every 5 ticks
    if (this.tick % 5 === 0) {
      for (const cell of this.protocells) {
        const nearbyProtocells = this.protocells.filter(
          other => other.id !== cell.id && cell.position.distanceTo(other.position) < 15
        );
        for (const neighbor of nearbyProtocells) {
          const gained = cell.tryHydrolyzeNeighbor(neighbor, this.rng);
          if (gained > 0) cell.energy += gained;
          const siphoned = cell.tryParasiteSiphon(neighbor, this.rng);
          if (siphoned > 0) {
            cell.energy += siphoned;
          }
        }
      }
    }
  }

  private checkProtocellFormation(): void {
    const absorbedMolIds = new Set<string>();
    for (const mol of this.molecules) {
      if (absorbedMolIds.has(mol.id)) continue;
      if (mol.hasLongCarbonChain() && mol.atoms.length >= 6) {
        const nearby = this.moleculeSpatialHash.query(mol.position.x, mol.position.y, 3);
        const fattyCount = nearby.filter(m => m.hasLongCarbonChain() && m.atoms.length >= 4).length;

        if (fattyCount >= this.config.membraneFormationThreshold * 0.5 && this.protocells.length < 100) {
          const cell = new Protocell(mol.position.clone(), fattyCount);

          // Absorb some nearby molecules
          let absorbed = 0;
          for (const nearMol of nearby) {
            if (absorbed < 10 && !absorbedMolIds.has(nearMol.id) && cell.absorbMolecule(nearMol)) {
              absorbedMolIds.add(nearMol.id);
              absorbed++;
            }
          }

          // Maybe add a replicator
          if (this.rng.next() < 0.1 && this.tick > 5000) {
            const polymer = InformationPolymer.createRandom(this.rng.int(5, 15), this.rng);
            cell.replicators.push(new Replicator(polymer));
          }

          this.protocells.push(cell);
        }
      }
    }
    if (absorbedMolIds.size > 0) {
      this.molecules = this.molecules.filter(m => !absorbedMolIds.has(m.id));
    }
  }

  private checkOrganismEmergence(): void {
    for (let i = this.protocells.length - 1; i >= 0; i--) {
      const cell = this.protocells[i];

      if (cell.replicators.length > 0 && cell.metabolismRate > 0 && cell.complexityScore >= 3 && cell.age > 1000) {
        if (this.organismManager.population < this.config.maxPopulation && this.rng.next() < 0.01) {
          const zone = this.environmentMap.getZoneAt(cell.position.x, cell.position.y);
          let metType: MetabolismType = 'chemosynthesis';
          if (zone.uvIntensity > 0.5) metType = 'photosynthesis';
          else if (zone.type === 'hydrothermal_vent') metType = 'chemosynthesis';
          else metType = 'fermentation';

          const organism = this.organismManager.spawnInitialOrganism(
            cell.position.clone(),
            metType,
            this.tick
          );

          organism.energy = cell.energy * 0.5;

          this.phylogeneticTree.addNode(
            organism.id, null, organism.species,
            this.tick, 0, organism.phenotype.metabolismType
          );

          this.protocells.splice(i, 1);
        }
      }
    }

    // Spontaneously spawn if past tick threshold and no organisms
    if (this.tick > 2000 && this.organismManager.population === 0 && this.tick % 500 === 0) {
      const source = this.rng.pick(this.energySources);
      const pos = source.position.add(new Vector2(this.rng.gaussian(0, 10), this.rng.gaussian(0, 10)));
      const zone = this.environmentMap.getZoneAt(pos.x, pos.y);

      let metType: MetabolismType = 'chemosynthesis';
      if (zone.uvIntensity > 0.5) metType = 'photosynthesis';

      const organism = this.organismManager.spawnInitialOrganism(pos, metType, this.tick);
      this.phylogeneticTree.addNode(
        organism.id, null, organism.species,
        this.tick, 0, organism.phenotype.metabolismType
      );
    }
  }

  private updateOrganisms(): void {
    const organisms = this.organismManager.organisms;

    for (const org of organisms) {
      if (!org.alive) continue;

      // Sense
      const nearbyOrgs = this.organismManager.getNearby(org.position.x, org.position.y, this.config.sensorRange);
      buildSensorReadings(org, this.chemicalField, this.energySources, nearbyOrgs, this.tick);

      // Think
      org.think();

      // Social Learning: apply learned behavioral biases after think() so they
      // durably influence behavior (profiles are updated periodically in check())
      this.socialLearning.applyLearnedBias(org);

      // Phenotypic Plasticity: adapt traits to local environment BEFORE act()
      // so that speed and sensor modifiers take effect during this tick
      const zone = this.environmentMap.getZoneAt(org.position.x, org.position.y);
      const restorePlasticity = applyPlasticity(org, zone);

      // Act
      org.act(this.config.worldSize);

      // Restore base phenotype values after act() to prevent compounding
      restorePlasticity();

      // Metabolize
      const envEnergy = zone.energyDensity;
      const dayFactor = 0.5 + 0.5 * Math.sin((this.tick / this.config.dayNightPeriod) * Math.PI * 2);
      org.metabolize(envEnergy, zone.uvIntensity * dayFactor);

      // Communication
      this.communicationSystem.emitSignal(org, this.tick);

      // Horizontal gene transfer on collision
      if (this.rng.next() < this.config.horizontalTransferRate) {
        for (const other of nearbyOrgs) {
          if (other.id === org.id || !other.alive) continue;
          const threshold = org.phenotype.bodyRadius + other.phenotype.bodyRadius + 1;
          if (org.position.distanceSqTo(other.position) < threshold * threshold) {
            org.genome.horizontalTransfer(other.genome, this.rng);
            break;
          }
        }
      }

      // Carrying capacity pressure — organisms in over-crowded niches lose energy faster
      const nichePressure = this.ecosystem.getNichePressure(org);
      if (nichePressure > 1) {
        org.energy -= (nichePressure - 1) * 0.005;
      }

      // Predation check
      if ((org.actuatorOutputs[3] ?? 0) > 0.5) {
        for (const other of nearbyOrgs) {
          if (other.id === org.id || !other.alive) continue;
          const threshold = org.phenotype.bodyRadius + other.phenotype.bodyRadius;
          if (org.position.distanceSqTo(other.position) < threshold * threshold) {
            if (org.phenotype.metabolismType === 'heterotrophy' || org.phenotype.mass > other.phenotype.mass * 1.5) {
              const energyGain = other.energy * 0.7;
              org.energy += energyGain;
              other.takeDamage(1);
              if (!other.alive) {
                org.killCount++;
                this.foodWeb.recordPredation(org, other);
                this.resourceCycle.addDeadOrganism(other.energy * 0.3);
              }
            }
          }
        }
      }
    }

    // Run organism manager tick (handles death, reproduction)
    const newOrgs = this.organismManager.tick(this.tick);

    // Track new organisms in phylogeny
    for (const org of newOrgs) {
      this.phylogeneticTree.addNode(
        org.id, org.parentId, org.species,
        this.tick, org.generation, org.phenotype.metabolismType
      );
    }

    // Track deaths
    for (const dead of this.organismManager.deadOrganisms) {
      this.phylogeneticTree.markDeath(dead.id, this.tick);
    }

    // Speciation (every 500 ticks)
    if (this.tick % 500 === 0 && organisms.length > 0) {
      this.speciationSystem.assignSpecies(organisms);
    }

    // Social Learning: record profiles and check for learning events (every 50 ticks)
    if (this.tick % 50 === 0 && organisms.length > 1) {
      this.socialLearning.recordProfiles(organisms);
      const learningEvent = this.socialLearning.check(
        organisms,
        this.tick,
        (x, y, r) => this.organismManager.getNearby(x, y, r)
      );
      if (learningEvent && !this.milestoneSet.has('SOCIAL_LEARNING')) {
        this.addMilestone('SOCIAL_LEARNING', `First social learning: ${learningEvent.behavior}`);
        this.cultureTracker.record({
          type: DiscoveryType.TEACHING,
          organismId: learningEvent.teacherId,
          species: organisms.find(o => o.id === learningEvent.teacherId)?.species ?? 0,
          tick: this.tick,
          description: `Behavior "${learningEvent.behavior}" learned`,
          evidence: [learningEvent.learnerId, learningEvent.teacherId],
        });
      }
    }

    // Symbiosis: update bonds and apply effects (every 100 ticks)
    if (this.tick % 100 === 0 && organisms.length > 1) {
      this.symbiosisSystem.update(
        organisms,
        (x, y, r) => this.organismManager.getNearby(x, y, r)
      );
      const orgById = new Map(organisms.map(o => [o.id, o]));
      this.symbiosisSystem.applyEffects(orgById);

      if (!this.milestoneSet.has('SYMBIOSIS') && this.symbiosisSystem.getBondCount() >= 3) {
        const bondTypes = this.symbiosisSystem.getBondsByType();
        this.addMilestone('SYMBIOSIS',
          `Symbiotic relationships: ${bondTypes.mutualism} mutualism, ${bondTypes.parasitism} parasitism, ${bondTypes.commensalism} commensalism`
        );
      }
    }

    // Coevolution: track arms race dynamics (every 200 ticks)
    if (this.tick % 200 === 0 && organisms.length > 0) {
      const metrics = this.coevolutionSystem.update(organisms, this.foodWeb, this.tick);
      this.coevolutionSystem.applyCoevolutionaryPressure(organisms);

      if (!this.milestoneSet.has('ARMS_RACE') && metrics.escalationRate > 0.1) {
        this.addMilestone('ARMS_RACE', `Predator-prey arms race detected (escalation: ${metrics.escalationRate.toFixed(3)})`);
      }
    }

    // Population Genetics: analyze and apply drift (every 500 ticks)
    if (this.tick % 500 === 0 && organisms.length > 0) {
      const snapshot = this.populationGenetics.analyze(organisms, this.tick);
      this.populationGenetics.applyDrift(organisms, this.rng);

      if (!this.milestoneSet.has('GENETIC_DRIFT') && this.populationGenetics.checkBottleneck()) {
        this.addMilestone('GENETIC_DRIFT', `Population bottleneck detected (Ne: ${snapshot.effectivePopulationSize})`);
      }

      if (!this.milestoneSet.has('ALLELE_FIXATION') && this.populationGenetics.getTotalFixations() > 0) {
        this.addMilestone('ALLELE_FIXATION', `First allele fixation (${snapshot.fixationEvents} genes fixed in population)`);
      }
    }
  }

  private updateEcology(): void {
    this.ecosystem.update(this.organismManager.organisms, this.speciationSystem);
    this.resourceCycle.decompose(0.01);
  }

  private checkMilestones(): void {
    // Reduce frequency of expensive milestone checks on molecule arrays
    // Stage 1 milestones only need checking every 50 ticks
    if (this.tick % 50 === 0) {
      // Check all pending molecule-based milestones in a single pass
      let needAminoAcid = !this.milestoneSet.has('AMINO_ACID');
      let needFattyAcid = !this.milestoneSet.has('FATTY_ACID');
      let needNucleotide = !this.milestoneSet.has('NUCLEOTIDE');
      let needPolymer = !this.milestoneSet.has('POLYMER');

      if (needAminoAcid || needFattyAcid || needNucleotide || needPolymer) {
        for (const mol of this.molecules) {
          if (needAminoAcid && mol.hasCNChain() && mol.atoms.length >= 4) {
            this.addMilestone('AMINO_ACID', `First complex organic: ${mol.getFormula()}`);
            needAminoAcid = false;
          }
          if (needFattyAcid && mol.hasLongCarbonChain() && mol.atoms.length >= 6) {
            this.addMilestone('FATTY_ACID', `First fatty acid: ${mol.getFormula()}`);
            needFattyAcid = false;
          }
          if (needNucleotide && mol.hasPhosphorusRing()) {
            this.addMilestone('NUCLEOTIDE', `First nucleotide: ${mol.getFormula()}`);
            needNucleotide = false;
          }
          if (needPolymer && mol.getChainLength() >= 5) {
            this.addMilestone('POLYMER', `First polymer (chain length ${mol.getChainLength()})`);
            needPolymer = false;
          }
          // Early exit if all molecule milestones found
          if (!needAminoAcid && !needFattyAcid && !needNucleotide && !needPolymer) {
            break;
          }
        }
      }
    }

    // Stage 2 milestones (protocell-based) — only check every 100 ticks
    if (this.tick % 100 === 0 && this.protocells.length > 0) {
      if (!this.milestoneSet.has('PROTOCELL')) {
        const cell = this.protocells[0];
        if (cell.interior.length >= 5) {
          this.addMilestone('PROTOCELL', `First stable protocell with ${cell.interior.length} molecules`);
        }
      }

      if (!this.milestoneSet.has('REPLICATOR')) {
        for (const cell of this.protocells) {
          if (cell.replicators.length > 0 && cell.replicators[0].copyCount > 0) {
            this.addMilestone('REPLICATOR', `First self-copying polymer (length ${cell.replicators[0].polymer.length})`);
            break;
          }
        }
      }

      if (!this.milestoneSet.has('PROTOCELL_DIVISION')) {
        for (const cell of this.protocells) {
          if (cell.parentId) {
            this.addMilestone('PROTOCELL_DIVISION', 'First protocell division');
            break;
          }
        }
      }

      if (!this.milestoneSet.has('METABOLISM')) {
        for (const cell of this.protocells) {
          if (cell.metabolismRate > 0) {
            this.addMilestone('METABOLISM', `First metabolizing protocell (rate: ${cell.metabolismRate.toFixed(3)})`);
            break;
          }
        }
      }

      // COMPARTMENT: first stable vesicle with trapped contents
      if (!this.milestoneSet.has('COMPARTMENT')) {
        const stableCell = this.protocells.find(c => c.interior.length >= 3 && c.integrity >= 0.7);
        if (stableCell) {
          this.addMilestone('COMPARTMENT', `First stable compartment (${stableCell.interior.length} trapped molecules, integrity ${stableCell.integrity.toFixed(2)})`);
        }
      }

      // TEMPLATE_REPLICATION: genome copying observed
      if (!this.milestoneSet.has('TEMPLATE_REPLICATION')) {
        const cell = this.protocells.find(c => c.replicators.length > 0 && c.replicators[0].copyCount >= 2);
        if (cell) {
          this.addMilestone('TEMPLATE_REPLICATION', `Template replication observed (${cell.replicators[0].copyCount} copies, length ${cell.replicators[0].polymer.length})`);
        }
      }

      // PROTON_GRADIENT: compartment with pH differential from environment
      if (!this.milestoneSet.has('PROTON_GRADIENT')) {
        for (const cell of this.protocells) {
          const localPH = this.environmentMap.getLocalPH(cell.position.x, cell.position.y);
          const internalPH = 7.0 + (cell.energy - 1) * 0.5;
          if (Math.abs(internalPH - localPH) > 1.0) {
            this.addMilestone('PROTON_GRADIENT', `Proton gradient detected (ΔpH: ${Math.abs(internalPH - localPH).toFixed(2)})`);
            break;
          }
        }
      }

      // CATALYTIC_CYCLE: closed-loop metabolic network (3+ pathways)
      if (!this.milestoneSet.has('CATALYTIC_CYCLE')) {
        const cell = this.protocells.find(c => c.metabolism.pathways.length >= 3 && c.metabolism.totalEnergyProduced > 0);
        if (cell) {
          this.addMilestone('CATALYTIC_CYCLE', `Catalytic cycle: ${cell.metabolism.pathways.length} metabolic pathways active`);
        }
      }
    }

    // Stage 3 milestones (organism-based) — only check every 100 ticks
    if (this.tick % 100 === 0) {
      if (!this.milestoneSet.has('FIRST_ORGANISM') && this.organismManager.population > 0) {
        this.addMilestone('FIRST_ORGANISM', 'First genome-bearing, metabolizing organism');
      }

      if (!this.milestoneSet.has('PREDATION')) {
        for (const org of this.organismManager.organisms) {
          if (org.killCount > 0) {
            this.addMilestone('PREDATION', `First predator: species ${org.species}`);
            break;
          }
        }
      }

      if (!this.milestoneSet.has('SPECIATION') && this.speciationSystem.getSpeciesCount() >= 2) {
        this.addMilestone('SPECIATION', `${this.speciationSystem.getSpeciesCount()} species diverged`);
      }

      if (!this.milestoneSet.has('PHOTOSYNTHESIS')) {
        for (const org of this.organismManager.organisms) {
          if (org.phenotype.metabolismType === 'photosynthesis') {
            this.addMilestone('PHOTOSYNTHESIS', 'First photosynthesizing organism');
            break;
          }
        }
      }

      if (!this.milestoneSet.has('NEURAL_HIDDEN')) {
        for (const org of this.organismManager.organisms) {
          if (org.genome.neuralGenome.nodeGenes.some(n => n.type === 'hidden')) {
            this.addMilestone('NEURAL_HIDDEN', 'First organism with hidden neural node');
            break;
          }
        }
      }

      // Stage 4
      if (!this.milestoneSet.has('FOOD_WEB') && this.ecosystem.trophicLevelCount >= 3) {
        this.addMilestone('FOOD_WEB', 'Three trophic levels established');
      }

      if (!this.milestoneSet.has('ECOSYSTEM') && this.speciationSystem.getSpeciesCount() >= 5) {
        this.addMilestone('ECOSYSTEM', `${this.speciationSystem.getSpeciesCount()} species coexisting`);
      }

      // PROOFREADING: mutation rate drops (fidelity improvement observed)
      if (!this.milestoneSet.has('PROOFREADING')) {
        for (const cell of this.protocells) {
          if (cell.replicators.length > 0 && cell.replicators[0].polymer.fidelity > 0.95) {
            this.addMilestone('PROOFREADING', `High-fidelity replication evolved (fidelity: ${cell.replicators[0].polymer.fidelity.toFixed(3)})`);
            break;
          }
        }
      }

      // PHOTOSYNTHESIS_LIKE: UV harvesting milestone
      if (!this.milestoneSet.has('PHOTOSYNTHESIS_LIKE') && !this.milestoneSet.has('PHOTOSYNTHESIS')) {
        const uvSource = this.energySources.find(s => s.type === 'uv_radiation');
        if (uvSource) {
          const nearUV = this.protocells.find(c => c.position.distanceTo(uvSource.position) < uvSource.radius * 0.5 && c.energy > 2);
          if (nearUV) {
            this.addMilestone('PHOTOSYNTHESIS_LIKE', `UV energy harvesting (protocell thriving in UV zone with energy ${nearUV.energy.toFixed(1)})`);
          }
        }
      }

      // MULTICELLULAR_ISH: multiple organisms moving as cluster (adhesion)
      if (!this.milestoneSet.has('MULTICELLULAR_ISH')) {
        const organisms = this.organismManager.organisms;
        if (organisms.length >= 3) {
          const clusters = new Set<string>();
          for (const org of organisms) {
            const nearby = this.organismManager.getNearby(org.position.x, org.position.y, 5);
            const nearbyOthers = nearby.filter(o => o !== org);
            // Require at least two *other* organisms nearby → cluster of at least three including this one
            if (nearbyOthers.length >= 2) { clusters.add(org.species.toString()); }
          }
          if (clusters.size > 0) {
            this.addMilestone('MULTICELLULAR_ISH', `Proto-multicellular cluster detected (${clusters.size} species participating)`);
          }
        }
      }
    }
  }

  private addMilestone(type: string, description: string): void {
    if (this.milestoneSet.has(type)) return;
    this.milestoneSet.add(type);
    const event = { type, tick: this.tick, description };
    this.milestones.push(event);
    this.dataLogger.log(this.tick, 'milestone', { type, description });
  }

  private collectMetrics(): void {
    const organisms = this.organismManager.organisms;
    const avgGenomeLength = organisms.length > 0
      ? organisms.reduce((s, o) => s + o.genome.totalLength, 0) / organisms.length
      : 0;
    const avgNeuralNodes = organisms.length > 0
      ? organisms.reduce((s, o) => s + o.genome.neuralGenome.nodeGenes.length, 0) / organisms.length
      : 0;

    // Average chain length of all molecules
    const avgChainLength = this.molecules.length > 0
      ? this.molecules.reduce((s, m) => s + m.getChainLength(), 0) / this.molecules.length
      : 0;

    // Energy flux (total energy from all sources)
    const energyFlux = this.energySources.reduce((s, src) => s + src.power, 0);

    this.metricsCollector.collect({
      tick: this.tick,
      population: organisms.length,
      speciesCount: this.speciationSystem.getSpeciesCount(),
      totalEnergy: organisms.reduce((s, o) => s + o.energy, 0),
      avgGenomeLength,
      avgNeuralNodes,
      births: this.organismManager.totalBorn,
      deaths: this.organismManager.totalDied,
      diversityIndex: this.ecosystem.diversityIndex,
      avgChainLength,
      energyFlux,
      extinctionRate: this.ecosystem.extinctionRate,
    });
  }

  getStats() {
    return {
      tick: this.tick,
      moleculeCount: this.molecules.length,
      protocellCount: this.protocells.length,
      population: this.organismManager.population,
      speciesCount: this.speciationSystem.getSpeciesCount(),
      totalEnergy: this.organismManager.organisms.reduce((s, o) => s + o.energy, 0),
      milestoneCount: this.milestones.length,
      oxygenLevel: this.ecosystem.oxygenLevel,
      symbioticBonds: this.symbiosisSystem.getBondCount(),
      socialLearningEvents: this.socialLearning.getEventCount(),
      heterozygosity: this.populationGenetics.getLatestHeterozygosity(),
      coevolutionPairs: this.coevolutionSystem.getActivePairCount(),
    };
  }
}
