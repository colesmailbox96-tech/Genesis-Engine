# Genesis Engine — Origin of Life Machine Learning Simulator

## BUILD INSTRUCTIONS FOR AGENT

**Read this entire document before writing any code.** This README is the complete specification. Do not ask clarifying questions — everything you need is here. Deliver a fully functional, compilable, runnable application at the end.

**Work style:** Do NOT work in tiny incremental chunks. Build complete systems. Every deliverable must be a working application I can launch and experience. Do not submit file scaffolding with TODO comments or placeholder functions. When you are finished, I should be able to run `npm install && npm run dev`, open the forwarded port on my phone, and watch life emerge from chemistry.

---

## What This Is

A browser-based simulation that models the emergence of life from raw chemistry and follows its evolution through increasingly complex stages — from molecular self-assembly to multicellular organisms to primitive tool use and discovery. Every behavior is emergent. Nothing is scripted. The simulation uses neural networks at every scale to produce genuine learning and adaptation.

This is not a game with life-themed graphics. This is a computational petri dish where chemical rules produce replicators, replicators produce organisms, organisms produce ecosystems, and ecosystems produce intelligence — all through the same underlying physics, selection pressure, and neural network architecture.

The player watches. The player does not control. The player is a scientist observing an experiment. The UI provides microscope-like tools: zoom levels from molecular to continental, time controls, lineage trees, chemical analysis panels, and data export for research.

**Visual style:** Scientific visualization meets generative art. Think electron microscope footage colorized with false-color palettes, mixed with fluid dynamics renders and bioluminescent deep-sea photography. Dark backgrounds. Glowing particles. Organic movement. Beautiful and alien.

---

## Tech Stack

| Component | Technology |
|---|---|
| Language | TypeScript (strict mode) |
| Framework | React 18 + Vite |
| Rendering | HTML5 Canvas 2D (layered, with offscreen compositing) |
| State Management | Zustand |
| Styling | Tailwind CSS |
| Package Manager | npm |
| Target | Modern browsers, mobile-first, GitHub Codespaces port forwarding |

**No external ML libraries.** All neural network operations implemented from scratch in TypeScript using Float32Array. This runs in the browser with zero backend.

---

## Directory Structure

```
genesis-engine/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   │
│   ├── engine/
│   │   ├── Simulation.ts                — master simulation coordinator
│   │   ├── GameLoop.ts                  — fixed timestep + variable render
│   │   ├── Config.ts                    — all simulation parameters
│   │   ├── SpatialHash.ts               — broad-phase collision/proximity
│   │   └── SeededRandom.ts              — deterministic PRNG
│   │
│   ├── chemistry/
│   │   ├── Element.ts                   — base element types and properties
│   │   ├── Molecule.ts                  — molecular structures and bonds
│   │   ├── Reaction.ts                  — reaction rules and energetics
│   │   ├── ChemicalField.ts             — concentration gradients across world
│   │   ├── EnergySource.ts              — thermal vents, UV, lightning, redox
│   │   └── Catalysis.ts                 — catalytic acceleration and specificity
│   │
│   ├── proto/
│   │   ├── Protocell.ts                 — membrane-bounded chemical systems
│   │   ├── Replicator.ts               — self-copying molecular chains
│   │   ├── Metabolism.ts                — energy harvesting reaction networks
│   │   ├── InformationPolymer.ts        — proto-genetic information storage
│   │   └── ProtoSelection.ts            — differential survival/replication
│   │
│   ├── organisms/
│   │   ├── Organism.ts                  — living entity with genome + brain
│   │   ├── Genome.ts                    — encoded traits, mutation, crossover
│   │   ├── OrganismBrain.ts             — neural network decision-making
│   │   ├── Morphology.ts                — body plan from genome expression
│   │   ├── Senses.ts                    — perception based on evolved sensors
│   │   ├── Locomotion.ts                — movement based on evolved body plan
│   │   ├── OrganismNeeds.ts             — energy, integrity, reproduction drive
│   │   └── OrganismManager.ts           — population management, speciation
│   │
│   ├── evolution/
│   │   ├── SelectionPressure.ts         — environmental fitness functions
│   │   ├── Mutation.ts                  — point mutations, insertions, deletions
│   │   ├── Crossover.ts                 — sexual recombination
│   │   ├── Speciation.ts               — genetic distance and reproductive isolation
│   │   ├── PhylogeneticTree.ts          — lineage tracking and tree construction
│   │   └── FitnessLandscape.ts          — adaptive landscape visualization
│   │
│   ├── ecology/
│   │   ├── Ecosystem.ts                 — trophic levels, carrying capacity
│   │   ├── FoodWeb.ts                   — predator-prey relationships
│   │   ├── EnvironmentZone.ts           — distinct biome regions
│   │   ├── ResourceCycle.ts             — nutrient cycling through ecosystem
│   │   └── ExtinctionEvent.ts           — mass extinction triggers and recovery
│   │
│   ├── discovery/
│   │   ├── ToolUse.ts                   — object manipulation behaviors
│   │   ├── SocialLearning.ts            — behavior copying between organisms
│   │   ├── Communication.ts             — signal emission and interpretation
│   │   ├── MemorySystem.ts              — episodic memory for complex organisms
│   │   └── CultureTracker.ts            — tracking emergent cultural behaviors
│   │
│   ├── neural/
│   │   ├── Tensor.ts                    — Float32Array tensor operations
│   │   ├── LinearLayer.ts               — matrix multiply + bias
│   │   ├── Activations.ts               — GELU, ReLU, sigmoid, tanh, softmax
│   │   ├── LayerNorm.ts                 — layer normalization
│   │   ├── NEAT.ts                      — neuroevolution of augmenting topologies
│   │   ├── NetworkTopology.ts           — variable-structure network encoding
│   │   ├── WeightSerializer.ts          — save/load network weights
│   │   └── GeneticEncoding.ts           — genome ↔ network topology mapping
│   │
│   ├── rendering/
│   │   ├── Renderer.ts                  — master render orchestrator
│   │   ├── Camera.ts                    — pan/zoom with smooth interpolation
│   │   ├── MolecularRenderer.ts         — molecule/bond visualization
│   │   ├── ProtocellRenderer.ts         — membrane/organelle rendering
│   │   ├── OrganismRenderer.ts          — procedural creature rendering
│   │   ├── EnvironmentRenderer.ts       — terrain, water, atmosphere
│   │   ├── ChemicalFieldRenderer.ts     — concentration gradient heatmaps
│   │   ├── ParticleSystem.ts            — generic particle engine
│   │   ├── FluidRenderer.ts             — fluid dynamics visualization
│   │   ├── TrailRenderer.ts             — organism movement trails
│   │   ├── LightingSystem.ts            — bioluminescence, energy source glow
│   │   └── PostProcessing.ts            — bloom, chromatic aberration, vignette
│   │
│   ├── input/
│   │   ├── InputManager.ts              — unified touch/mouse/keyboard
│   │   └── GestureDetector.ts           — pinch zoom, swipe pan, tap select
│   │
│   ├── ui/
│   │   ├── GameCanvas.tsx               — React component wrapping canvas
│   │   ├── HUD.tsx                      — epoch, population, energy, time
│   │   ├── InspectorPanel.tsx           — selected entity detail view
│   │   ├── PhylogeneticView.tsx         — interactive lineage tree
│   │   ├── ChemistryPanel.tsx           — reaction network viewer
│   │   ├── TimeControls.tsx             — pause/play/speed/epoch skip
│   │   ├── ZoomIndicator.tsx            — current scale label
│   │   ├── StatsDashboard.tsx           — population/diversity/energy charts
│   │   ├── MilestoneLog.tsx             — emergence event timeline
│   │   ├── MiniMap.tsx                  — world overview
│   │   └── WelcomeScreen.tsx            — seed input, parameter presets
│   │
│   ├── data/
│   │   ├── DataLogger.ts                — structured event logging
│   │   ├── MetricsCollector.ts          — population, diversity, energy metrics
│   │   └── ExportSystem.ts              — JSONL, CSV, phylogenetic export
│   │
│   ├── audio/
│   │   └── AmbientAudio.ts             — procedural soundscape
│   │
│   └── utils/
│       ├── SimplexNoise.ts
│       ├── Random.ts
│       ├── Color.ts
│       ├── Vector2.ts
│       └── Math.ts
```

---

## Architecture Rules — Non-Negotiable

### Rule 1: Everything Emerges From Chemistry
There are NO hardcoded behaviors for any organism. Organisms do not have a "forage" action or "flee" action programmed in. They have neural networks that receive sensory input and produce motor output. If an organism forages, it's because its neural network learned that moving toward food-chemical gradients and activating its ingestion actuator increases its energy. If it flees, it's because its neural network learned that moving away from predator-chemical signatures reduces damage. Every intelligent behavior is evolved, not designed.

### Rule 2: Simulation and Rendering Are Decoupled
The simulation ticks at a fixed rate. The renderer reads state and draws. The renderer NEVER modifies simulation state. The simulation must run headlessly at 1000x speed for fast-forward epochs.

### Rule 3: The Genome Is the Source of Truth
Every trait an organism has — body shape, sensor types, actuator types, neural network topology, metabolic pathways — is encoded in its genome. The genome is a variable-length array of genes. Genes are expressed into phenotype at birth. Mutation modifies the genome. Crossover combines two genomes. The organism's capabilities are entirely determined by genome expression. No organism has capabilities that aren't genome-encoded.

### Rule 4: Conservation of Energy
Energy is conserved in the simulation. Energy enters through energy sources (thermal vents, UV radiation, chemical gradients). Energy flows through food webs. Energy leaves through heat dissipation. No energy appears from nowhere. Every action costs energy. Replication costs energy. Movement costs energy. Neural computation costs energy. This constraint is what drives all evolutionary pressure.

### Rule 5: NEAT for Neural Evolution
Organisms' neural networks use NeuroEvolution of Augmenting Topologies (NEAT). Networks start minimal (direct sensor-to-actuator connections) and grow in complexity through mutation — adding nodes, adding connections, modifying weights. This means early organisms have simple reactive brains, and complexity evolves only when it provides survival advantage. The genome directly encodes the network topology.

### Rule 6: Mobile-First
Touch is the primary input. The simulation must be playable on a phone through a Codespaces forwarded port.

---

## The Simulation Stages

The simulation progresses through emergent stages. These stages are NOT scripted transitions. They are descriptions of what SHOULD emerge if the chemistry and selection pressures are correctly implemented. The simulation detects when milestones are reached and logs them, but never forces them.

### Stage 1: Primordial Chemistry (Ticks 0 – ~50,000)

**The world is a 2D chemical soup.** No life exists. Only elements, molecules, energy sources, and reaction rules.

#### World Setup

**World size:** 512 × 512 continuous coordinate space (not tile-based — entities have float positions)

**Environment zones** (generated with simplex noise):
- **Deep ocean:** low energy, stable temperature, high pressure. Covers ~40% of world
- **Hydrothermal vents:** extreme energy output, mineral-rich chemistry, localized hot spots. 5-8 vents scattered across deep ocean floor
- **Shallow pools:** moderate energy (UV penetration), evaporation concentrates molecules, temperature cycles. Covers ~25%
- **Tidal zones:** periodic flooding/draining cycles, wet-dry chemistry, wave mixing. Covers ~15%
- **Volcanic shores:** lightning, extreme heat, mineral deposits, violent mixing. Covers ~10%
- **Ice regions:** cold, slow reactions, but freeze-thaw cycles concentrate molecules. Covers ~10%

Each zone has distinct properties:
```typescript
interface EnvironmentZone {
  type: ZoneType;
  temperature: number;         // affects reaction rates (Arrhenius equation)
  energyDensity: number;       // available energy per unit area
  flowDirection: Vector2;      // current/convection pushing molecules
  flowSpeed: number;
  mineralConcentrations: Record<Element, number>;
  uvIntensity: number;
  pressure: number;
  cyclePhase: number;          // for tidal/day-night cycling
  cyclePeriod: number;
}
```

#### Elements

Six base elements, each with properties that determine bonding:

```typescript
enum Element {
  H,   // Hydrogen — lightest, bonds easily, energy carrier
  C,   // Carbon — backbone builder, 4 bond sites, structural
  N,   // Nitrogen — 3 bond sites, catalytic potential
  O,   // Oxygen — reactive, 2 bond sites, energy releaser
  P,   // Phosphorus — energy currency (like ATP), information backbone
  S,   // Sulfur — electron donor/acceptor, early metabolism
}

interface ElementProperties {
  symbol: string;
  bondSites: number;           // max bonds this element can form
  electronegativity: number;   // 0-1, determines bond polarity
  mass: number;                // affects diffusion speed
  color: [number, number, number]; // rendering color
  abundance: number;           // starting concentration
}
```

Element properties:
| Element | Bond Sites | Electronegativity | Mass | Color | Abundance |
|---|---|---|---|---|---|
| H | 1 | 0.21 | 1 | (200, 220, 255) ice blue | 0.40 |
| C | 4 | 0.55 | 12 | (100, 100, 100) dark gray | 0.15 |
| N | 3 | 0.65 | 14 | (100, 150, 255) blue | 0.10 |
| O | 2 | 0.75 | 16 | (255, 80, 80) red | 0.20 |
| P | 5 | 0.45 | 31 | (255, 180, 50) amber | 0.05 |
| S | 2 | 0.50 | 32 | (255, 255, 80) yellow | 0.10 |

#### Molecules

Molecules are graphs of bonded elements. Each bond has a strength (energy required to break it).

```typescript
interface Molecule {
  id: string;
  atoms: Atom[];               // elements at positions
  bonds: Bond[];               // connections between atoms
  position: Vector2;           // world position
  velocity: Vector2;           // movement from currents/diffusion
  energy: number;              // internal chemical energy
  age: number;                 // ticks since formation
  mass: number;                // sum of atom masses
  polarity: number;            // determines membrane interaction
  catalyticSites: CatalyticSite[];  // regions that accelerate reactions
}

interface Bond {
  atomA: number;               // index into atoms array
  atomB: number;
  strength: number;            // energy to break (0-1)
  type: 'covalent' | 'ionic' | 'hydrogen';
}
```

#### Reactions

Reactions occur when molecules collide and conditions are met:

```typescript
interface ReactionRule {
  reactants: MoleculePattern[];        // what molecules must collide
  products: MoleculePattern[];         // what they produce
  activationEnergy: number;            // minimum energy to trigger
  energyDelta: number;                 // positive = exothermic, negative = endothermic
  catalystPattern?: MoleculePattern;   // molecule that lowers activation energy
  catalyticReduction: number;          // how much catalyst lowers activation energy (0-1)
  temperatureRange: [number, number];  // reaction only occurs in this temp range
  probability: number;                 // base probability per collision
}
```

**Core reaction categories:**

1. **Synthesis reactions:** small molecules combine into larger ones. H + H → H₂. C + O → CO. Amino acid formation from simpler precursors. Energy input required (from UV, vents, lightning).

2. **Decomposition reactions:** large molecules break into smaller ones. Spontaneous at high temperature. Faster near energy sources. This is entropy — the constant enemy of complexity.

3. **Polymerization:** monomers link into chains. Amino acids → peptides. Nucleotides → polynucleotides. Requires energy and often a surface catalyst (mineral templates). This is the path to information storage.

4. **Catalytic reactions:** some molecules accelerate other reactions without being consumed. A peptide that happens to lower the activation energy of a synthesis reaction is a primitive enzyme. This is the path to metabolism.

5. **Energy transfer reactions:** high-energy bonds break, releasing energy that drives other reactions. P-O bonds store and release energy (like ATP). This is the path to energy currency.

**Reaction implementation:**
- Every tick, for every pair of molecules within reaction distance (2.0 units), check all applicable reaction rules
- Probability of reaction = base probability × temperature factor × catalyst factor × concentration factor
- Temperature factor: Arrhenius-like curve, reactions faster at higher temperature up to denaturation point
- Catalyst factor: if a catalyst molecule is within 3.0 units, multiply probability by (1 + catalyticReduction × catalystEfficiency)
- Concentration factor: higher local concentration of reactants increases probability (mass action kinetics)
- When a reaction occurs: consume reactants, produce products, release/absorb energy delta, create visual particle effect

#### Chemical Field

The world maintains continuous concentration fields for dissolved elements and small molecules.

```typescript
class ChemicalField {
  // Grid-based concentration storage (64×64 cells for 512×512 world)
  concentrations: Map<string, Float32Array>;  // molecule_type → grid values

  // Diffusion: each tick, concentrations spread toward neighbors
  diffuse(rate: number): void;

  // Flow: currents push concentrations in environment flow direction
  advect(flowField: Vector2[][]): void;

  // Source: energy sources inject elements/molecules into nearby cells
  addSource(x: number, y: number, type: string, amount: number): void;

  // Query: get local concentration at a position
  getConcentration(x: number, y: number, type: string): number;

  // Gradient: get direction of increasing concentration (for chemotaxis)
  getGradient(x: number, y: number, type: string): Vector2;
}
```

#### Energy Sources

```typescript
interface EnergySource {
  type: 'thermal_vent' | 'uv_radiation' | 'lightning' | 'chemical_gradient';
  position: Vector2;
  radius: number;              // area of effect
  power: number;               // energy output per tick
  reliability: number;         // 1.0 = constant, 0.5 = intermittent
  mineralOutput: Record<Element, number>;  // elements released
  temperature: number;         // local temperature boost
}
```

- **Thermal vents:** constant, localized, mineral-rich. The most reliable energy source. Historical: life likely started here.
- **UV radiation:** global but surface-only (shallow pools). Drives photochemistry. Day/night cycle modulates intensity.
- **Lightning:** rare, massive energy spikes. Strikes random locations in volcanic shores. Can form complex molecules in one event (Miller-Urey style).
- **Chemical gradients:** energy from concentration differences (like redox gradients at vent/ocean interfaces). Subtle but everywhere.

#### What Should Emerge in Stage 1

The chemistry system should naturally produce:
- Accumulation of complex molecules near energy sources (especially thermal vents and shallow pools)
- Amino acid-like structures (C-N-C chains with functional groups)
- Fatty acid-like structures (long C-H chains with polar heads) — membrane precursors
- Nucleotide-like structures (P-containing ring structures) — information precursors
- Primitive catalytic peptides (short chains that accelerate specific reactions)
- Concentration of organics in tidal pools (evaporation cycle concentrates molecules)

**Milestone detection:**
- `MILESTONE_AMINO_ACID`: First molecule with ≥4 atoms including C and N in a chain
- `MILESTONE_FATTY_ACID`: First molecule with ≥6 C atoms in a chain with polar head
- `MILESTONE_NUCLEOTIDE`: First molecule with P bonded to a ring structure
- `MILESTONE_CATALYST`: First molecule that accelerates another reaction by >50%
- `MILESTONE_POLYMER`: First chain of ≥5 repeating subunits

---

### Stage 2: Self-Assembly and Replication (Ticks ~50,000 – ~200,000)

When fatty acid molecules reach sufficient concentration near each other, they spontaneously form membranes (bilayer structures). This is pure chemistry — amphiphilic molecules self-organize.

#### Protocells

A protocell forms when a membrane encloses a collection of molecules:

```typescript
interface Protocell {
  id: string;
  position: Vector2;
  velocity: Vector2;
  membrane: Membrane;
  interior: Molecule[];          // molecules trapped inside
  energy: number;                // total internal energy
  age: number;
  size: number;                  // radius, determined by interior volume
  integrity: number;             // 0-1, membrane health

  // Emergent properties (computed, not set)
  metabolismRate: number;        // rate of internal energy-producing reactions
  replicationPotential: number;  // presence of self-copying polymers
  complexityScore: number;       // number of distinct molecule types inside
}

interface Membrane {
  lipidCount: number;           // fatty acid molecules in membrane
  permeability: Record<string, number>;  // which molecule types can pass through
  stability: number;            // resistance to disruption
  surfaceMolecules: Molecule[];  // molecules embedded in membrane (proto-receptors)
}
```

**Membrane behavior:**
- Forms spontaneously when ≥20 fatty acid molecules are within 3.0 units of each other
- Membrane is semi-permeable: small molecules (H₂, CO₂) pass freely, large molecules are trapped inside
- Membrane stability depends on lipid count and temperature (too hot = dissolves, too cold = rigid)
- Protocells can merge (membranes fuse when two protocells collide gently)
- Protocells can split (when internal pressure from too many molecules exceeds membrane strength)
- Molecules embedded in the membrane can act as channels (increase permeability to specific types) or receptors (respond to external chemicals)

#### Replicators

The key transition: some information polymers (nucleotide chains) develop the ability to template-copy themselves.

```typescript
interface Replicator {
  sequence: number[];           // encoded information (0-3 for 4 "bases")
  length: number;
  fidelity: number;             // copying accuracy (0-1)
  replicationSpeed: number;     // ticks per copy
  errorRate: number;            // mutation rate per position per copy

  // Template copying
  replicate(availableMonomers: Molecule[]): Replicator | null;
}
```

**Replication mechanics:**
- A replicator can copy itself if free nucleotide monomers are available nearby
- Copying is not perfect — errors (mutations) occur at `errorRate` per position
- Copying costs energy proportional to sequence length
- Longer sequences store more information but cost more to copy and mutate more
- Replicators compete for monomers — the replicator that copies fastest with fewest errors dominates
- A replicator inside a protocell has a survival advantage (protected from degradation)
- When a protocell splits, its replicators are randomly distributed between daughter cells

**This creates the first selection pressure:** protocells containing efficient replicators grow and divide faster. Protocells with no replicators don't "reproduce" — they just grow until they burst, with no inheritance.

#### Proto-Metabolism

Some protocells develop internal reaction networks that produce energy:

```typescript
interface MetabolicPathway {
  reactions: ReactionRule[];    // ordered sequence of reactions
  inputs: string[];             // required substrate molecule types
  outputs: string[];            // produced molecule types
  netEnergy: number;            // energy produced per cycle
  enzymes: Molecule[];          // catalysts that accelerate this pathway
}
```

A protocell with a metabolic pathway that produces energy from environmental substrates has a massive survival advantage — it doesn't just passively collect energy, it actively harvests it.

**What Should Emerge in Stage 2:**
- Spontaneous membrane formation creating protocells near fatty acid concentrations
- Replicating polymers appearing inside some protocells
- Protocell lineages: cells that split create "daughter" cells with similar contents
- Competition: protocells near vents grow faster, protocells with catalysts outcompete those without
- Proto-metabolism: reaction chains that extract energy from vent chemicals (like chemosynthesis)
- **The RNA World analog:** replicators that are ALSO catalysts (ribozyme-like) — information molecules that accelerate their own copying

**Milestone detection:**
- `MILESTONE_PROTOCELL`: First stable membrane enclosing ≥5 molecules
- `MILESTONE_REPLICATOR`: First polymer that successfully copies itself
- `MILESTONE_PROTOCELL_DIVISION`: First protocell that splits into two daughter cells, each containing replicators
- `MILESTONE_METABOLISM`: First protocell with a reaction network producing net positive energy
- `MILESTONE_HEREDITY`: First case where daughter cells exhibit similar metabolic behavior to parent (inherited chemistry)

---

### Stage 3: The First Organisms (Ticks ~200,000 – ~1,000,000)

The transition from protocell to organism occurs when:
1. A protocell has a replicator (genome) that encodes its own metabolic enzymes
2. The genome is reliably copied during cell division
3. Mutations to the genome produce heritable phenotypic changes

At this point, Darwinian evolution begins in earnest.

#### Genome

```typescript
class Genome {
  genes: Gene[];                // variable-length array
  mutationRate: number;         // per-gene per-replication
  totalLength: number;

  // Express genome into phenotype
  express(): Phenotype;

  // Create offspring genome with mutations
  replicate(): Genome;

  // Sexual recombination (if applicable)
  crossover(other: Genome): Genome;

  // Measure genetic distance
  distanceTo(other: Genome): number;
}

interface Gene {
  type: GeneType;
  parameters: number[];         // variable-length, type-dependent
  regulatory: number;           // expression level (0-1)
  enabled: boolean;
}

enum GeneType {
  // Body plan
  BODY_SIZE,                    // base radius
  BODY_SHAPE,                   // circular, elongated, branched
  BODY_SYMMETRY,                // radial, bilateral

  // Sensors
  SENSOR_CHEMICAL,              // detect specific molecule concentration
  SENSOR_LIGHT,                 // detect energy source direction/intensity
  SENSOR_TOUCH,                 // detect collision with other entities
  SENSOR_PROXIMITY,             // detect nearby organisms
  SENSOR_INTERNAL,              // detect own energy/integrity levels

  // Actuators
  ACTUATOR_FLAGELLUM,           // directional movement
  ACTUATOR_CILIA,               // local current generation
  ACTUATOR_INGESTION,           // consume adjacent molecules/organisms
  ACTUATOR_SECRETION,           // emit molecules
  ACTUATOR_ADHESION,            // attach to surfaces or other organisms
  ACTUATOR_DIVISION,            // trigger cell division when energy sufficient

  // Metabolism
  METABOLISM_CHEMOSYNTHESIS,    // harvest energy from chemical gradients
  METABOLISM_PHOTOSYNTHESIS,    // harvest energy from light
  METABOLISM_HETEROTROPHY,      // harvest energy from consuming organics
  METABOLISM_FERMENTATION,      // harvest energy from breaking down sugars

  // Neural
  NEURAL_CONNECTION,            // defines a connection in the NEAT network
  NEURAL_NODE,                  // defines a hidden node in the NEAT network
  NEURAL_BIAS,                  // node bias value
  NEURAL_MODULATION,            // neuromodulatory connection (learning signal)

  // Defense
  DEFENSE_TOXIN,                // produce toxic secretion
  DEFENSE_SHELL,                // hard exterior, reduces damage but slows movement
  DEFENSE_SPEED,                // increased movement speed multiplier
  DEFENSE_CAMOUFLAGE,           // reduced detection by predator sensors

  // Social
  SIGNAL_EMISSION,              // emit communication signals
  SIGNAL_RECEPTION,             // detect communication signals
  COOPERATION_MARKER,           // identification for kin recognition
}
```

#### Phenotype Expression

The genome is expressed into a concrete organism phenotype at birth:

```typescript
interface Phenotype {
  // Physical
  bodyRadius: number;
  bodyShape: 'circular' | 'elongated' | 'branched' | 'amorphous';
  bodyColor: [number, number, number];   // derived from metabolism type
  maxSpeed: number;                       // derived from actuators and body mass
  mass: number;                           // derived from body size

  // Sensors (what the organism can perceive)
  sensors: Sensor[];

  // Actuators (what the organism can do)
  actuators: Actuator[];

  // Metabolism
  metabolismType: MetabolismType;
  metabolicEfficiency: number;            // energy extracted per unit substrate
  energyCapacity: number;                 // max stored energy
  basalMetabolicRate: number;             // energy cost per tick just to exist

  // Neural network topology
  neuralTopology: NEATGenome;             // NEAT-encoded network structure

  // Defense
  toxicity: number;
  shellThickness: number;
  camouflageLevel: number;

  // Reproduction
  divisionEnergyCost: number;             // energy required to divide
  divisionThreshold: number;              // energy level that triggers division consideration
  offspringSize: number;                  // fraction of parent size given to offspring
}
```

#### NEAT Neural Network

Every organism has a brain encoded by NEAT (NeuroEvolution of Augmenting Topologies):

```typescript
interface NEATGenome {
  nodeGenes: NodeGene[];
  connectionGenes: ConnectionGene[];
  fitness: number;
  species: number;
}

interface NodeGene {
  id: number;
  type: 'input' | 'hidden' | 'output';
  activation: 'sigmoid' | 'tanh' | 'relu' | 'gaussian' | 'sine';
  bias: number;
}

interface ConnectionGene {
  innovationNumber: number;     // global innovation counter for crossover alignment
  inNode: number;
  outNode: number;
  weight: number;
  enabled: boolean;
}
```

**Input nodes** (one per sensor output):
- Chemical sensor readings (concentration of detected molecule types)
- Light sensor reading (intensity and direction)
- Touch sensor (binary: is something touching?)
- Proximity sensor (distance and direction to nearest entity)
- Internal energy level
- Internal integrity level
- Body orientation / facing direction
- Memory inputs (recurrent connections from previous tick's hidden states)

**Output nodes** (one per actuator control):
- Movement direction (x, y components)
- Movement speed (0 to 1)
- Ingestion activation (0 = don't eat, 1 = eat)
- Secretion activation + type
- Division trigger (> threshold = attempt to divide)
- Signal emission (content and intensity)
- Adhesion toggle
- Orientation change

**NEAT evolution mechanics:**
- **Mutation — add connection:** Pick two unconnected nodes, add a connection with random weight. Assign a new global innovation number
- **Mutation — add node:** Pick an existing connection, disable it, insert a new hidden node with two new connections (in → new → out, preserving the original weight on the out-connection and 1.0 on the in-connection)
- **Mutation — modify weight:** Perturb an existing connection weight by ±0.1 (80% of weight mutations) or replace with random value (20%)
- **Mutation — toggle connection:** Enable/disable an existing connection
- **Mutation — modify bias:** Perturb a node's bias
- **Mutation — modify activation:** Change a node's activation function
- **Crossover:** Align two genomes by innovation number. Matching genes: randomly inherit from either parent. Disjoint/excess genes: inherit from the more fit parent
- **Speciation:** Organisms with genetic distance > threshold are in different species. Distance = c1 × (excess genes / N) + c2 × (disjoint genes / N) + c3 × (average weight difference). Species share fitness to protect innovation.

**Why NEAT and not a fixed-topology network:**
Starting organisms should have the simplest possible brains — maybe just 3 connections from a chemical sensor to a movement actuator. Complexity must be earned through evolution. A fixed-size transformer would impose unnecessary complexity on simple organisms (and waste compute). NEAT lets brain complexity grow organically alongside body complexity. An early bacterium-like organism might have 5 nodes and 8 connections. A late-stage complex organism might have 50 nodes and 200 connections. The architecture matches the organism's ecological niche.

#### Organism Lifecycle

```typescript
class Organism {
  // Identity
  id: string;
  genome: Genome;
  phenotype: Phenotype;
  species: number;
  generation: number;
  parentId: string;
  birthTick: number;

  // State
  position: Vector2;
  velocity: Vector2;
  orientation: number;          // facing direction in radians
  energy: number;
  integrity: number;            // health, 0 = dead
  age: number;

  // Brain
  brain: NEATNetwork;
  sensorReadings: number[];
  actuatorOutputs: number[];

  // Per-tick cycle
  tick(): void {
    // 1. Sense: build sensor readings from environment
    this.sense();

    // 2. Think: run neural network
    this.actuatorOutputs = this.brain.forward(this.sensorReadings);

    // 3. Act: apply actuator outputs to world
    this.act();

    // 4. Metabolize: gain/lose energy based on metabolism type
    this.metabolize();

    // 5. Age: increment age, check death conditions
    this.age++;
    this.energy -= this.phenotype.basalMetabolicRate;
    if (this.energy <= 0 || this.integrity <= 0) this.die();

    // 6. Reproduce: if energy > threshold and brain output triggers division
    if (this.energy > this.phenotype.divisionThreshold &&
        this.actuatorOutputs[DIVISION_OUTPUT] > 0.5) {
      this.divide();
    }
  }
}
```

**Death conditions:**
- Energy reaches 0 (starvation)
- Integrity reaches 0 (destroyed by predator or environment)
- Age exceeds maximum lifespan (evolved trait, prevents immortal lineages from blocking evolution)
- Environmental extremes (temperature/pressure outside tolerance range)

**On death:** organism becomes a collection of organic molecules at its position (nutrients recycled into the environment). Other organisms can consume these molecules.

**What Should Emerge in Stage 3:**
- First true organisms near thermal vents (chemosynthetic, simple sensors, random movement)
- Chemotaxis: organisms evolving to move toward food gradients
- Phototaxis: organisms near surface evolving to move toward light
- Predation: some organisms evolving to consume other organisms instead of environmental chemicals
- Defense: prey evolving shells, speed, toxins in response to predation
- Autotroph/heterotroph split: photosynthesizers vs consumers
- Speciation: populations in different environments diverging genetically
- Increasing neural complexity: more connections, hidden nodes, new sensor types appearing

**Milestone detection:**
- `MILESTONE_FIRST_ORGANISM`: First entity with genome, neural network, and metabolism
- `MILESTONE_CHEMOTAXIS`: First organism that consistently moves toward food (statistical test over 100 ticks)
- `MILESTONE_PREDATION`: First organism that kills and consumes another organism
- `MILESTONE_PHOTOSYNTHESIS`: First organism harvesting energy from light
- `MILESTONE_SPECIATION`: First case where two lineages have genetic distance > speciation threshold
- `MILESTONE_DEFENSE`: First organism with shell, toxin, or camouflage genes expressed
- `MILESTONE_NEURAL_HIDDEN`: First organism with a hidden node in its neural network

---

### Stage 4: Ecosystem Complexity (Ticks ~1,000,000 – ~5,000,000)

As species diversify, ecological relationships emerge.

#### Food Web

```typescript
interface FoodWeb {
  producers: Species[];         // autotrophs (photosynthesizers, chemosynthesizers)
  primaryConsumers: Species[];  // herbivore-equivalents
  secondaryConsumers: Species[];// predators
  decomposers: Species[];       // consume dead organisms
  parasites: Species[];         // attach to hosts, drain energy slowly

  // Computed metrics
  trophicLevels: Map<Species, number>;
  connectance: number;          // fraction of possible links realized
  stability: number;            // eigenvalue analysis of population dynamics
}
```

#### Environmental Dynamics

The environment changes over long timescales, driving adaptation:

- **Day/night cycle:** 1,000-tick period. UV intensity cycles sinusoidally. Affects photosynthesizers and surface chemistry
- **Seasonal cycle:** 20,000-tick period. Temperature oscillates. Affects reaction rates everywhere. Winter → slower metabolism, reduced food. Summer → faster metabolism, more energy
- **Geological events:** Random, rare
  - **Volcanic eruption:** massive local energy spike, mineral injection, temperature increase. Kills nearby organisms but creates new ecological opportunities. Probability: 0.001 per 1,000 ticks
  - **Asteroid impact:** global temperature drop, reduced UV for 5,000 ticks. Mass extinction event. Probability: 0.0001 per 1,000 ticks. Kills ~60-90% of organisms. Opens ecological niches for survivors
  - **Continental shift:** very slow (over 100,000 ticks), environment zones shift position, creating migration pressure and geographic isolation
- **Oxygen crisis:** If photosynthesizers become abundant, they release O₂ as waste. Rising O₂ concentration is toxic to anaerobic organisms but enables aerobic metabolism (much more efficient energy extraction). This mirrors the Great Oxidation Event. Track global O₂ levels. When O₂ crosses a threshold, organisms without oxidative stress tolerance die. This is a massive selective sweep

#### Symbiosis

```typescript
interface SymbioticRelationship {
  hostSpecies: number;
  symbiontSpecies: number;
  type: 'mutualism' | 'commensalism' | 'parasitism';
  benefit: number;              // net fitness effect on host (-1 to 1)
  dependency: number;           // 0 = optional, 1 = obligate
  duration: number;             // ticks of association
}
```

Symbiosis emerges when adhesion genes cause two organisms to stick together and the combination is fitter than either alone:
- **Mutualism:** one organism provides energy (photosynthesis), the other provides protection (shell). Both benefit. Over time, the symbiont's genome may simplify (losing redundant genes) — this is the path to organelles (mitochondria, chloroplasts)
- **Parasitism:** one organism attaches and drains energy. Host evolves defenses. Parasite evolves evasion. Arms race

**Milestone detection:**
- `MILESTONE_FOOD_WEB`: Three trophic levels simultaneously sustained
- `MILESTONE_ECOSYSTEM`: 5+ species coexisting with stable populations for 10,000+ ticks
- `MILESTONE_MASS_EXTINCTION`: >50% of species go extinct within 5,000 ticks
- `MILESTONE_RECOVERY`: Population recovers to >80% of pre-extinction levels after a mass extinction
- `MILESTONE_OXYGEN_CRISIS`: Global O₂ exceeds toxicity threshold, mass die-off of anaerobes
- `MILESTONE_SYMBIOSIS`: Two species in obligate mutualism for >5,000 ticks
- `MILESTONE_MULTICELLULARITY`: Group of same-species organisms permanently adhered with division of labor (some sense, some move, some eat)

---

### Stage 5: Complex Organisms and Discovery (Ticks ~5,000,000+)

This is the aspirational stage. It may or may not emerge depending on the evolutionary trajectory. The simulation should support it but not force it.

#### Multicellularity

When same-species organisms use adhesion genes to permanently attach and specialize (some cells sense, some cells move, some cells digest), multicellularity emerges. This is detected, not scripted:

```typescript
interface Colony {
  cells: Organism[];            // individual organisms acting as cells
  centroid: Vector2;            // group center of mass
  collectiveMovement: Vector2;  // coordinated motion
  specialization: Map<string, Set<Organism>>;  // "sensor cells", "motor cells", "digestive cells"
  isMulticellular: boolean;     // true if specialization detected
}
```

Detection criteria for multicellularity:
- ≥5 same-species organisms permanently adhered (>5,000 ticks without separating)
- Different individuals have different dominant actuator outputs (specialization)
- The group moves as a coordinated unit (center-of-mass velocity > individual drift)

#### Tool Use and Discovery

Complex organisms with high neural complexity (>30 nodes) may develop emergent behaviors that look like tool use:

- **Object manipulation:** Using a rock (dense mineral molecule) as a shield by positioning it between self and predator
- **Trap building:** Secreting adhesive molecules in a pattern to trap prey
- **Agriculture:** Repeatedly visiting the same area and depositing waste that fertilizes autotroph growth
- **Social cooperation:** Coordinated hunting through signal-mediated group behavior

These are NOT coded behaviors. They are emergent neural network outputs that happen to be effective survival strategies. The simulation detects and logs them:

```typescript
interface DiscoveryEvent {
  type: DiscoveryType;
  organism: string;
  species: number;
  tick: number;
  description: string;
  evidence: string[];           // what behavioral pattern was detected
}

enum DiscoveryType {
  TOOL_USE,                     // object manipulation for non-nutritive purpose
  COOPERATIVE_HUNTING,          // coordinated predation by 3+ organisms
  COMMUNICATION_PROTOCOL,       // consistent signal-response patterns
  AGRICULTURE,                  // repeated fertilization of food sources
  TERRITORY,                    // consistent defense of a spatial region
  MOURNING,                     // lingering near dead kin
  PLAY,                         // energetically costly behavior with no survival benefit
  MIGRATION,                    // seasonal group movement patterns
  TEACHING,                     // demonstrating behavior to offspring
}
```

**Milestone detection:**
- `MILESTONE_MULTICELLULAR`: First multicellular organism
- `MILESTONE_TOOL_USE`: First object manipulation detected
- `MILESTONE_COOPERATION`: First coordinated group behavior
- `MILESTONE_COMMUNICATION`: First consistent signal-response protocol
- `MILESTONE_CULTURE`: First behavior transmitted socially (non-genetic)
- `MILESTONE_INTELLIGENCE`: First organism with >50 neural nodes and >3 distinct learned behaviors

---

## Rendering System

### Visual Philosophy

The rendering should feel like looking through a scientific instrument. Dark background (near-black). Entities glow with false-color based on their chemistry/metabolism. Fluid currents are visible as subtle flow lines. Energy sources pulse with light. The overall aesthetic is: deep ocean bioluminescence meets electron microscopy.

### Zoom Levels

The camera supports continuous zoom from molecular to world scale:

| Zoom Level | Scale | What's Visible |
|---|---|---|
| 6x–10x (molecular) | Individual atoms and bonds | Molecule structures, bond formations, reactions happening in real time. Atoms rendered as colored circles (3-5px), bonds as lines |
| 3x–6x (chemical) | Molecule clusters | Groups of molecules, concentration clouds, protocell membranes as visible boundaries |
| 1x–3x (cellular) | Individual organisms | Organism body shapes, sensors (rendered as small dots on body), actuator effects (flagellum trails, secretion particles) |
| 0.5x–1x (local) | Groups of organisms | Species clusters, predator-prey interactions, food web dynamics visible. Individual organisms are colored dots |
| 0.1x–0.5x (ecosystem) | Ecosystem regions | Environment zones visible as colored regions, population density as heat overlay, energy flow as glowing lines |
| 0.02x–0.1x (world) | Full world | Entire simulation visible. Organisms as sub-pixel dots aggregated into density. Zone boundaries. Global energy flow |

### Organism Rendering

Each organism is rendered procedurally based on its phenotype:

```typescript
class OrganismRenderer {
  draw(ctx: CanvasRenderingContext2D, organism: Organism, camera: Camera): void {
    const screenSize = organism.phenotype.bodyRadius * camera.zoom;

    if (screenSize < 1) {
      // Sub-pixel: render as a colored dot
      this.drawDot(ctx, organism);
      return;
    }

    // Body
    const shape = organism.phenotype.bodyShape;
    const color = this.getMetabolismColor(organism.phenotype.metabolismType);

    if (shape === 'circular') {
      this.drawCircularBody(ctx, organism, color);
    } else if (shape === 'elongated') {
      this.drawElongatedBody(ctx, organism, color);
    } else if (shape === 'branched') {
      this.drawBranchedBody(ctx, organism, color);
    }

    // Membrane glow (subtle radial gradient around body)
    this.drawMembraneGlow(ctx, organism, color);

    // Sensors (small circles on body perimeter at sensor positions)
    for (const sensor of organism.phenotype.sensors) {
      this.drawSensor(ctx, organism, sensor);
    }

    // Actuators
    if (organism.actuatorOutputs[MOVEMENT_SPEED] > 0.1) {
      this.drawFlagellumTrail(ctx, organism);
    }
    if (organism.actuatorOutputs[SECRETION] > 0.1) {
      this.drawSecretionParticles(ctx, organism);
    }

    // Energy indicator (inner glow brightness = energy level)
    this.drawEnergyGlow(ctx, organism);

    // Neural activity visualization (subtle pulse when brain is active)
    if (camera.zoom > 2) {
      this.drawNeuralPulse(ctx, organism);
    }
  }
}
```

**Metabolism colors:**
- Chemosynthesis: warm orange/red glow (#FF6B35)
- Photosynthesis: green/cyan glow (#00E676)
- Heterotrophy: purple/magenta (#E040FB)
- Fermentation: amber/yellow (#FFD600)
- Decomposer: dark blue/gray (#5C6BC0)

### Post-Processing Effects

Apply after all entities are rendered:

```typescript
class PostProcessing {
  // Bloom: bright areas bleed into surrounding pixels
  bloom(canvas: HTMLCanvasElement, threshold: number, intensity: number): void;

  // Chromatic aberration: subtle RGB offset at screen edges (microscope effect)
  chromaticAberration(canvas: HTMLCanvasElement, strength: number): void;

  // Vignette: darken screen edges
  vignette(canvas: HTMLCanvasElement, strength: number): void;

  // Scan lines: subtle horizontal lines (electron microscope aesthetic)
  scanLines(canvas: HTMLCanvasElement, opacity: number): void;

  // Depth of field: slight blur for entities far from camera focus point
  depthOfField(canvas: HTMLCanvasElement, focusPoint: Vector2, radius: number): void;

  // Color grading: shift overall color palette based on current epoch/environment
  colorGrade(canvas: HTMLCanvasElement, grade: ColorGrade): void;
}
```

### Ambient Audio

Procedural soundscape that reflects simulation state:

- **Baseline:** Deep, low-frequency hum (20-60Hz filtered brown noise). Volume proportional to total energy in system
- **Molecular activity:** High-frequency crackle (white noise bursts) when reactions are occurring nearby. Density scales with reaction rate
- **Energy sources:** Low pulsing tone near thermal vents. Gentle sine sweep near UV zones
- **Organisms:** Faint, organic clicking/bubbling sounds when organisms are near camera. Each species gets a slightly different frequency
- **Predation events:** Brief dissonant chord when a kill occurs near camera
- **Reproduction:** Soft ascending tone when an organism divides
- **Mass extinction:** Building low rumble, followed by silence, then gradual return of sounds
- **Milestones:** Distinctive harmonic chime when a milestone is reached

---

## UI Layout

### Desktop

```
┌──────────────────────────────────────────────────────────────┐
│  Epoch: 847,231  │  Pop: 1,247  │  Species: 34  │  ⚡ 89.4% │
│                                                    ┌────────┐│
│                                                    │Minimap ││
│                    SIMULATION CANVAS                │        ││
│                    (full remaining space)           │        ││
│                                                    └────────┘│
│                                              ┌───────────────┤
│                                              │ Inspector     │
│                                              │ Panel         │
│                                              │ (selected     │
│                                              │  entity)      │
│                                              │               │
│                                              └───────────────┤
│ ⏸ ▶ ▶▶ ▶▶▶ ⏭  🔬 Cellular  🔊━━○━━   [Milestones ▾]     │
└──────────────────────────────────────────────────────────────┘
```

### Mobile

```
┌─────────────────────────┐
│ E:847K Pop:1247 Sp:34   │
│ ┌──┐                    │
│ │mm│                    │
│ └──┘   CANVAS           │
│        (top 60%)        │
│                         │
│                         │
├─────────────────────────┤
│ Inspector / Milestones  │
│ (bottom 40%, swipeable) │
│                         │
│ ⏸ ▶ ▶▶ ▶▶▶  🔬 🔊     │
└─────────────────────────┘
```

### Inspector Panel

When player taps/clicks an entity:

**For a molecule:**
```
┌─────────────────────────┐
│ Molecule #4,891          │
│ Formula: C₃H₇NO₂        │
│ Mass: 89                 │
│ Energy: 0.34             │
│ Age: 12,400 ticks        │
│ Bonds: 11                │
│ Polarity: 0.67           │
│ Catalytic: Yes (2 sites) │
│ [Structure Diagram]      │
│    H                     │
│    |                     │
│ H-C-C-N-H               │
│    |   |                 │
│    O   H                 │
│    |                     │
│    H                     │
└─────────────────────────┘
```

**For an organism:**
```
┌─────────────────────────────┐
│ Organism #12,847             │
│ Species: Thermophilus α      │
│ Generation: 147              │
│ Age: 3,402 ticks             │
│                              │
│ ╔═══╗  Metabolism: Chemo     │
│ ║ 🦠 ║  Body: Elongated      │
│ ╚═══╝  Size: 2.3 units      │
│                              │
│  Energy    ████████░░  78%   │
│  Integrity █████████░  92%   │
│                              │
│  Sensors: Chemical(2), Light │
│  Actuators: Flagellum, Ingest│
│                              │
│  Brain: 12 nodes, 31 conns   │
│  [View Neural Network]       │
│                              │
│  Lineage: 7 ancestors        │
│  Offspring: 23               │
│  [View Phylogeny]            │
│                              │
│  Current behavior:           │
│  Moving toward food gradient │
│  Speed: 0.7, Direction: NE   │
└─────────────────────────────┘
```

### Phylogenetic Tree View

When "View Phylogeny" is tapped, show an interactive tree:
- Root = first organism of this lineage
- Branches = speciation events (where genetic distance exceeded threshold)
- Leaf nodes = currently living species
- Extinct branches shown as gray, fading
- Branch color = metabolism type
- Branch thickness = population size
- Timeline on x-axis (ticks)
- Click any node to inspect that ancestor's traits
- Zoomable and pannable

### Milestone Log

Scrollable timeline of emergence events:
```
┌───────────────────────────────────────────────┐
│ 📜 MILESTONES                                  │
│                                                │
│ ✨ Tick 847,231 — COOPERATIVE_HUNTING          │
│    Species Apex-γ: 4 organisms coordinated     │
│    pursuit of prey organism                    │
│                                                │
│ 🧬 Tick 612,000 — MULTICELLULAR               │
│    Species Colonial-β: 8-cell colony with      │
│    sensor/motor specialization detected        │
│                                                │
│ 💀 Tick 445,891 — MASS_EXTINCTION              │
│    Asteroid impact: 67% species lost           │
│    17 of 51 species survived                   │
│                                                │
│ 🌿 Tick 301,200 — PHOTOSYNTHESIS              │
│    Species Chloro-α: first light harvester     │
│    near shallow pool zone                      │
│                                                │
│ 🔬 Tick 198,400 — FIRST_ORGANISM              │
│    Genome-bearing, metabolizing, replicating   │
│    entity emerged near Vent #3                 │
│                                                │
│ ⚗️ Tick 52,100 — REPLICATOR                   │
│    First self-copying polymer (length 12)      │
│    inside protocell near Vent #3               │
│                                                │
│ 🫧 Tick 34,800 — PROTOCELL                    │
│    First stable membrane enclosure             │
│    Shallow pool zone                           │
│                                                │
│ 🧪 Tick 8,200 — AMINO_ACID                    │
│    First complex organic molecule              │
│    C₃H₇NO₂ formed near lightning strike       │
└───────────────────────────────────────────────┘
```

### Statistics Dashboard (F10)

- **Population over time:** line chart, one line per species (top 10 by population), zoomable timeline
- **Diversity metrics:** Shannon diversity index over time, species richness, evenness
- **Energy flow:** Sankey diagram showing energy from sources → producers → consumers → decomposers → heat
- **Genome complexity:** average genome length and neural network size over time
- **Chemical composition:** pie chart of current element distribution across molecules/organisms
- **Fitness landscape:** 2D projection of genome space, colored by fitness. Shows adaptive peaks and valleys
- **Neural complexity histogram:** distribution of brain sizes (node count) across all organisms
- **Extinction timeline:** bars showing species lifespans (birth tick to extinction tick)

---

## Configuration

```typescript
const DEFAULT_CONFIG = {
  // World
  worldSize: 512,
  tickRate: 60,

  // Chemistry
  elementCount: 6,
  reactionDistance: 2.0,
  baseReactionProbability: 0.01,
  catalystBoost: 5.0,
  diffusionRate: 0.1,
  moleculeDecayRate: 0.0001,
  maxMoleculeComplexity: 50,

  // Energy
  ventCount: 6,
  ventPower: 10.0,
  uvIntensityMax: 5.0,
  lightningProbability: 0.002,
  lightningEnergy: 100.0,
  energyDissipationRate: 0.001,

  // Protocells
  membraneFormationThreshold: 20,
  membraneStabilityBase: 0.8,
  protocellSplitThreshold: 50,

  // Organisms
  basalMetabolicRate: 0.01,
  movementEnergyCost: 0.005,
  divisionEnergyCost: 0.4,
  maxOrganismAge: 50000,
  sensorRange: 15.0,

  // NEAT
  neatWeightMutationRate: 0.8,
  neatWeightPerturbation: 0.1,
  neatAddConnectionRate: 0.05,
  neatAddNodeRate: 0.03,
  neatToggleConnectionRate: 0.01,
  neatSpeciationThreshold: 3.0,
  neatC1: 1.0,  // excess gene coefficient
  neatC2: 1.0,  // disjoint gene coefficient
  neatC3: 0.4,  // weight difference coefficient
  neatPopulationShare: true,

  // Evolution
  mutationRateBase: 0.01,
  crossoverRate: 0.3,
  speciationDistanceThreshold: 5.0,
  maxPopulation: 3000,
  carryingCapacityPerZone: 500,

  // Environment
  dayNightPeriod: 1000,
  seasonalPeriod: 20000,
  volcanicEruptionRate: 0.000001,
  asteroidImpactRate: 0.0000001,
  o2ToxicityThreshold: 0.3,

  // Rendering
  backgroundColor: '#0a0a12',
  bloomThreshold: 0.6,
  bloomIntensity: 0.4,
  scanLineOpacity: 0.03,
  vignetteStrength: 0.3,

  // Performance
  maxEntities: 5000,
  spatialHashCellSize: 16,
  cullingMargin: 2,
  lodThresholds: [0.5, 1.0, 3.0, 6.0],
};
```

---

## Performance Requirements

- **60 FPS on desktop** with up to 3,000 organisms
- **30 FPS on mobile** with up to 1,000 organisms
- **Fast-forward:** simulation can tick at 100x speed (6,000 ticks/sec) when rendering is simplified or disabled
- **Epoch skip:** button to run N,000 ticks instantly with no rendering, then resume viewing

**Optimization strategies:**
- Spatial hash for all proximity queries (reactions, sensing, collision)
- Only simulate chemistry at molecular zoom levels — at organism scale, use concentration field approximation
- LOD rendering: sub-pixel entities rendered as dots, skip detail rendering when zoomed out
- Canvas layer caching: environment/chemical field cached, only redrawn on camera move
- Entity pooling: pre-allocate, reuse dead entities
- Float32Array for all tensor operations and chemical fields
- Web Worker for fast-forward/epoch-skip computation
- Viewport culling: only process/render entities within camera view + margin

---

## Data Logging and Export

```typescript
interface SimulationLog {
  config: Config;
  worldSeed: number;
  milestones: MilestoneEvent[];
  speciesHistory: SpeciesRecord[];
  extinctions: ExtinctionEvent[];
  populationTimeSeries: { tick: number; count: number; speciesCount: number }[];
  energyTimeSeries: { tick: number; totalEnergy: number; flowRate: number }[];
  complexityTimeSeries: { tick: number; avgGenomeLength: number; avgNeuralNodes: number }[];
  discoveryEvents: DiscoveryEvent[];
}
```

**Export formats:**
- JSONL: full event stream
- CSV: population metrics over time
- Newick format: phylogenetic tree (standard bioinformatics format)
- DOT format: food web graph (for Graphviz)
- All exports downloadable from UI

---

## Command Line / URL Parameters

```
http://localhost:3000?seed=42&speed=5&zoom=1.0&config=harsh
```

| Parameter | Default | Description |
|---|---|---|
| seed | random | World seed for deterministic replay |
| speed | 1 | Initial simulation speed multiplier |
| zoom | 1.0 | Initial camera zoom level |
| config | default | Parameter preset: default, harsh, peaceful, primordial, fast_evolution |
| autostart | false | Skip welcome screen and start immediately |
| headless | false | Run without rendering (for data collection) |
| maxTicks | 0 | Stop after N ticks (0 = infinite) |

---

## Package Configuration

```json
{
  "name": "genesis-engine",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 3000",
    "build": "tsc && vite build",
    "preview": "vite preview --host 0.0.0.0 --port 3000",
    "test:evolution": "tsx src/testing/run_evolution_tests.ts",
    "test:chemistry": "tsx src/testing/run_chemistry_tests.ts",
    "export:phylogeny": "tsx src/testing/export_phylogeny.ts"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "vite": "^5.0.0"
  }
}
```

---

## Validation Checklist

### Build
- [ ] `npm install` succeeds with no errors
- [ ] `npm run dev` starts server on port 3000 with zero TypeScript errors
- [ ] `npm run build` produces a production build

### Chemistry (Stage 1)
- [ ] Elements and molecules exist in the world at startup
- [ ] Molecules drift with environment currents
- [ ] Reactions occur when molecules collide near energy sources
- [ ] Complex molecules form over time (chains of 4+ atoms)
- [ ] Concentration gradients visible in chemical field renderer
- [ ] Energy sources pulse with visible glow
- [ ] Amino acid milestone triggers within first 50,000 ticks
- [ ] Fatty acid milestone triggers (membrane precursors appear)

### Protocells (Stage 2)
- [ ] Membranes form spontaneously from fatty acid accumulations
- [ ] Protocells are visible as bounded spheres
- [ ] Molecules are trapped inside protocells
- [ ] Protocells split when too large
- [ ] Replicators appear inside some protocells
- [ ] Protocell lineages form (daughter cells inherit contents)

### Organisms (Stage 3)
- [ ] First organisms emerge with genome + neural network + metabolism
- [ ] Organisms sense environment (chemical gradients, light)
- [ ] Neural network produces motor output (movement, ingestion)
- [ ] Organisms consume food and gain energy
- [ ] Organisms die when energy reaches 0
- [ ] Organisms divide, creating offspring with mutated genomes
- [ ] NEAT evolution works: networks grow in complexity over generations
- [ ] Speciation occurs: genetically distinct populations form
- [ ] Chemotaxis evolves: organisms learn to follow food gradients
- [ ] Predation evolves: some organisms eat other organisms

### Ecosystem (Stage 4)
- [ ] Multiple species coexist simultaneously
- [ ] Food web forms with 2+ trophic levels
- [ ] Day/night cycle affects photosynthesizers
- [ ] Seasonal changes affect population dynamics
- [ ] Mass extinction possible (volcanic/asteroid events)
- [ ] Recovery from extinction (surviving species diversify)
- [ ] Phylogenetic tree shows branching lineage history

### Rendering
- [ ] Dark background with bioluminescent entity rendering
- [ ] Zoom works continuously from molecular to world scale
- [ ] Smooth camera pan and zoom with touch/mouse/keyboard
- [ ] Post-processing effects visible (bloom, vignette, scan lines)
- [ ] Organism body shapes rendered from phenotype data
- [ ] Metabolism type determines organism color
- [ ] Environment zones have distinct visual treatment
- [ ] Particles for reactions, secretions, death events

### UI
- [ ] Welcome screen with seed input and start button
- [ ] HUD shows epoch, population, species count, energy
- [ ] Time controls: pause, 1x, 5x, 20x, 100x, epoch skip
- [ ] Zoom level indicator updates with camera
- [ ] Tapping entity opens inspector panel
- [ ] Inspector shows full entity details (molecule structure, organism stats, neural network info)
- [ ] Phylogenetic tree view accessible and interactive
- [ ] Milestone log records and displays all emergence events
- [ ] Statistics dashboard (F10) shows population/diversity/energy charts
- [ ] Minimap shows full world overview

### Audio
- [ ] Ambient soundscape plays (deep hum, molecular crackle)
- [ ] Sounds spatially respond to camera position
- [ ] Volume control works

### Performance
- [ ] 60 FPS on desktop with 1000+ organisms
- [ ] 30 FPS on mobile with 500+ organisms
- [ ] Fast-forward (100x) runs smoothly
- [ ] No memory leaks over extended play (30+ minutes)
- [ ] Spatial hash prevents O(n²) slowdown

### Data
- [ ] Milestones logged with tick and description
- [ ] Population time series tracked
- [ ] Export JSONL and CSV work
- [ ] Phylogenetic tree exportable in Newick format

---

## Summary

Build a computational origin-of-life experiment. When I run `npm install && npm run dev`, I should see a dark primordial ocean with glowing energy sources, drifting molecules, and the slow emergence of complexity. Over minutes to hours of simulation time, I should witness:

1. Raw chemistry producing complex organic molecules
2. Membranes self-assembling into protocells
3. Replicators emerging and competing
4. The first true organisms with genomes and neural networks
5. Evolution producing diverse species with different survival strategies
6. Ecosystems forming with predators, prey, and producers
7. Increasing neural complexity leading to sophisticated behaviors
8. Perhaps — if the conditions are right — cooperation, communication, and the first sparks of collective intelligence

Every behavior is emergent. Nothing is scripted. The only rules are chemistry and physics. Everything else — life, evolution, intelligence — must arise on its own.

Build the universe. Set the rules. Press play. Watch life find a way.
