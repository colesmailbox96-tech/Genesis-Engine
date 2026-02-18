import { Organism } from '../organisms/Organism';
import { SpeciationSystem } from '../evolution/Speciation';

const MET_TO_NICHE: Record<string, string> = {
  chemosynthesis: 'vent_chemotroph',
  photosynthesis: 'surface_phototroph',
  fermentation: 'deep_fermentor',
  heterotrophy: 'tidal_scavenger',
};

export interface TrophicLevel {
  level: number;
  species: number[];
  totalPopulation: number;
  totalEnergy: number;
}

export interface ResourceNiche {
  name: string;
  energySource: string;
  temperatureRange: [number, number];
  currentUsers: number;
  capacity: number;
}

export class Ecosystem {
  trophicLevels: TrophicLevel[] = [];
  totalEnergy: number = 0;
  oxygenLevel: number = 0;
  diversityIndex: number = 0;
  extinctionRate: number = 0;
  resourceNiches: ResourceNiche[] = [];
  private previousSpeciesCount: number = 0;
  /** O(1) niche lookup by name – kept in sync with resourceNiches */
  private nicheMap: Map<string, ResourceNiche> = new Map();

  constructor() {
    // Define resource niches
    this.resourceNiches = [
      { name: 'vent_chemotroph', energySource: 'geothermal', temperatureRange: [0.6, 1.0], currentUsers: 0, capacity: 200 },
      { name: 'surface_phototroph', energySource: 'light', temperatureRange: [0.3, 0.7], currentUsers: 0, capacity: 300 },
      { name: 'deep_fermentor', energySource: 'organic', temperatureRange: [0.1, 0.4], currentUsers: 0, capacity: 150 },
      { name: 'tidal_scavenger', energySource: 'detritus', temperatureRange: [0.2, 0.6], currentUsers: 0, capacity: 100 },
    ];
    for (const niche of this.resourceNiches) this.nicheMap.set(niche.name, niche);
  }

  update(organisms: Organism[], speciationSystem: SpeciationSystem): void {
    // Reset
    this.trophicLevels = [];
    this.totalEnergy = 0;
    for (const niche of this.resourceNiches) niche.currentUsers = 0;

    const producers: number[] = [];
    const primaryConsumers: number[] = [];
    const secondaryConsumers: number[] = [];

    for (const sp of speciationSystem.species) {
      if (sp.members.length === 0) continue;
      const rep = sp.members[0];

      if (rep.phenotype.metabolismType === 'photosynthesis' || rep.phenotype.metabolismType === 'chemosynthesis') {
        producers.push(sp.id);
      } else if (rep.phenotype.metabolismType === 'heterotrophy') {
        if (rep.killCount > 0) {
          secondaryConsumers.push(sp.id);
        } else {
          primaryConsumers.push(sp.id);
        }
      } else {
        primaryConsumers.push(sp.id);
      }
    }

    if (producers.length > 0) {
      this.trophicLevels.push({ level: 1, species: producers, totalPopulation: 0, totalEnergy: 0 });
    }
    if (primaryConsumers.length > 0) {
      this.trophicLevels.push({ level: 2, species: primaryConsumers, totalPopulation: 0, totalEnergy: 0 });
    }
    if (secondaryConsumers.length > 0) {
      this.trophicLevels.push({ level: 3, species: secondaryConsumers, totalPopulation: 0, totalEnergy: 0 });
    }

    // Build a species-id → TrophicLevel map for O(1) lookup (avoids O(n²) nested loop)
    const speciesLevelMap = new Map<number, TrophicLevel>();
    for (const tl of this.trophicLevels) {
      for (const spId of tl.species) speciesLevelMap.set(spId, tl);
    }

    // Single-pass over organisms: accumulate energy, trophic stats, niche counts,
    // photosynthesizer count, and species counts for Shannon diversity.
    const speciesCounts = new Map<number, number>();
    let photoCount = 0;
    for (const org of organisms) {
      this.totalEnergy += org.energy;

      const tl = speciesLevelMap.get(org.species);
      if (tl) {
        tl.totalPopulation++;
        tl.totalEnergy += org.energy;
      }

      const nicheName = MET_TO_NICHE[org.phenotype.metabolismType] ?? 'tidal_scavenger';
      const niche = this.nicheMap.get(nicheName);
      if (niche) niche.currentUsers++;

      if (org.phenotype.metabolismType === 'photosynthesis') photoCount++;

      speciesCounts.set(org.species, (speciesCounts.get(org.species) ?? 0) + 1);
    }

    // Track O2 from photosynthesizers
    this.oxygenLevel = Math.min(1, photoCount * 0.001);

    // Calculate Shannon diversity index
    const total = organisms.length;
    if (total > 0) {
      let h = 0;
      for (const count of speciesCounts.values()) {
        const p = count / total;
        if (p > 0) h -= p * Math.log(p);
      }
      this.diversityIndex = h;
    } else {
      this.diversityIndex = 0;
    }

    // Extinction rate tracking
    const currentSpeciesCount = speciationSystem.getSpeciesCount();
    if (this.previousSpeciesCount > currentSpeciesCount) {
      this.extinctionRate = this.previousSpeciesCount - currentSpeciesCount;
    } else {
      this.extinctionRate = 0;
    }
    this.previousSpeciesCount = currentSpeciesCount;
  }

  /** Returns carrying capacity pressure (>1 means over capacity) for an organism's niche */
  getNichePressure(org: Organism): number {
    const nicheName = MET_TO_NICHE[org.phenotype.metabolismType] ?? 'tidal_scavenger';
    const niche = this.nicheMap.get(nicheName);
    if (!niche) return 1;
    return niche.currentUsers / Math.max(1, niche.capacity);
  }

  get trophicLevelCount(): number {
    return this.trophicLevels.length;
  }
}
