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

// Discovery
import { CommunicationSystem } from '../discovery/Communication';
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
  cultureTracker: CultureTracker;

  // Data
  dataLogger: DataLogger;
  metricsCollector: MetricsCollector;
  milestones: MilestoneEvent[] = [];

  // State tracking
  private milestoneSet = new Set<string>();

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
    this.cultureTracker = new CultureTracker();
    this.dataLogger = new DataLogger();
    this.metricsCollector = new MetricsCollector(100);

    this.initializeWorld();
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

  update(): void {
    this.tick++;

    // Update environment cycles
    this.environmentMap.updateCycles(this.tick);

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
    this.chemicalField.tick();

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

      // Apply environment flow
      const zone = this.environmentMap.getZoneAt(mol.position.x, mol.position.y);
      mol.velocity = mol.velocity.add(zone.flowDirection.mul(zone.flowSpeed * 0.1));
      mol.velocity = mol.velocity.mul(0.99); // friction

      // Wrap position
      mol.position.x = ((mol.position.x % this.config.worldSize) + this.config.worldSize) % this.config.worldSize;
      mol.position.y = ((mol.position.y % this.config.worldSize) + this.config.worldSize) % this.config.worldSize;

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
          mol.halfLife = mol.estimateHalfLife();
          if (mol.bonds.length === 0 && mol.atoms.length > 1) {
            toRemove.add(mol.id);
            const mid = Math.floor(mol.atoms.length / 2);
            const mol1 = Molecule.createRandom(mol.atoms[0].element, mol.position.clone(), this.rng);
            const mol2 = Molecule.createRandom(mol.atoms[mid]?.element ?? Element.H, mol.position.add(new Vector2(this.rng.range(-1, 1), this.rng.range(-1, 1))), this.rng);
            newMolecules.push(mol1, mol2);
          }
        }
      }

      // Polymer hydrolysis in wet conditions
      if (zone.wetness > 0.7 && mol.getChainLength() >= 4 && this.rng.next() < this.config.polymerHydrolysisRate * zone.wetness) {
        if (mol.bonds.length > 0) {
          mol.bonds.pop();
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
    const deadProtocells: string[] = [];

    for (const cell of this.protocells) {
      const zone = this.environmentMap.getZoneAt(cell.position.x, cell.position.y);
      const daughter = cell.tick(this.rng, zone.temperature);

      if (daughter) {
        newProtocells.push(daughter);
        this.protoSelection.recordDivision(cell.id);
      }

      if (cell.energy <= 0 || cell.integrity <= 0) {
        deadProtocells.push(cell.id);
        // Release contents back to environment
        this.resourceCycle.addDeadOrganism(cell.energy);
      }

      // Absorb nearby molecules
      const nearby = this.moleculeSpatialHash.query(cell.position.x, cell.position.y, cell.size + 2);
      for (const mol of nearby) {
        if (cell.absorbMolecule(mol)) {
          const idx = this.molecules.indexOf(mol);
          if (idx >= 0) this.molecules.splice(idx, 1);
        }
      }

      this.protoSelection.track(cell);
    }

    // Remove dead protocells
    this.protocells = this.protocells.filter(c => !deadProtocells.includes(c.id));

    // Add new protocells
    this.protocells.push(...newProtocells);

    // Cap protocells
    if (this.protocells.length > 200) {
      this.protocells.sort((a, b) => b.age - a.age);
      this.protocells = this.protocells.slice(0, 150);
    }
  }

  private checkProtocellFormation(): void {
    for (const mol of this.molecules) {
      if (mol.hasLongCarbonChain() && mol.atoms.length >= 6) {
        const nearby = this.moleculeSpatialHash.query(mol.position.x, mol.position.y, 3);
        const fattyCount = nearby.filter(m => m.hasLongCarbonChain() && m.atoms.length >= 4).length;

        if (fattyCount >= this.config.membraneFormationThreshold * 0.5 && this.protocells.length < 100) {
          const cell = new Protocell(mol.position.clone(), fattyCount);

          // Absorb some nearby molecules
          let absorbed = 0;
          for (const nearMol of nearby) {
            if (absorbed < 10 && cell.absorbMolecule(nearMol)) {
              const idx = this.molecules.indexOf(nearMol);
              if (idx >= 0) this.molecules.splice(idx, 1);
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

      // Act
      org.act(this.config.worldSize);

      // Metabolize
      const zone = this.environmentMap.getZoneAt(org.position.x, org.position.y);
      const envEnergy = zone.energyDensity;
      const dayFactor = 0.5 + 0.5 * Math.sin((this.tick / this.config.dayNightPeriod) * Math.PI * 2);
      org.metabolize(envEnergy, zone.uvIntensity * dayFactor);

      // Communication
      this.communicationSystem.emitSignal(org, this.tick);

      // Horizontal gene transfer on collision
      if (this.rng.next() < this.config.horizontalTransferRate) {
        for (const other of nearbyOrgs) {
          if (other.id === org.id || !other.alive) continue;
          if (org.position.distanceTo(other.position) < org.phenotype.bodyRadius + other.phenotype.bodyRadius + 1) {
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
          if (org.position.distanceTo(other.position) < org.phenotype.bodyRadius + other.phenotype.bodyRadius) {
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
  }

  private updateEcology(): void {
    this.ecosystem.update(this.organismManager.organisms, this.speciationSystem);
    this.resourceCycle.decompose(0.01);
  }

  private checkMilestones(): void {
    // Stage 1 milestones
    if (!this.milestoneSet.has('AMINO_ACID')) {
      for (const mol of this.molecules) {
        if (mol.hasCNChain() && mol.atoms.length >= 4) {
          this.addMilestone('AMINO_ACID', `First complex organic: ${mol.getFormula()}`);
          break;
        }
      }
    }

    if (!this.milestoneSet.has('FATTY_ACID')) {
      for (const mol of this.molecules) {
        if (mol.hasLongCarbonChain() && mol.atoms.length >= 6) {
          this.addMilestone('FATTY_ACID', `First fatty acid: ${mol.getFormula()}`);
          break;
        }
      }
    }

    if (!this.milestoneSet.has('NUCLEOTIDE')) {
      for (const mol of this.molecules) {
        if (mol.hasPhosphorusRing()) {
          this.addMilestone('NUCLEOTIDE', `First nucleotide: ${mol.getFormula()}`);
          break;
        }
      }
    }

    if (!this.milestoneSet.has('POLYMER')) {
      for (const mol of this.molecules) {
        if (mol.getChainLength() >= 5) {
          this.addMilestone('POLYMER', `First polymer (chain length ${mol.getChainLength()})`);
          break;
        }
      }
    }

    // Stage 2 milestones
    if (!this.milestoneSet.has('PROTOCELL') && this.protocells.length > 0) {
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

    // Stage 3 milestones
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
    };
  }
}
