import { Organism } from '../organisms/Organism';
import { SpeciationSystem } from '../evolution/Speciation';

export interface TrophicLevel {
  level: number;
  species: number[];
  totalPopulation: number;
  totalEnergy: number;
}

export class Ecosystem {
  trophicLevels: TrophicLevel[] = [];
  totalEnergy: number = 0;
  oxygenLevel: number = 0;

  update(organisms: Organism[], speciationSystem: SpeciationSystem): void {
    // Reset
    this.trophicLevels = [];
    this.totalEnergy = 0;

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

    // Update populations and energy
    for (const org of organisms) {
      this.totalEnergy += org.energy;
      for (const tl of this.trophicLevels) {
        if (tl.species.includes(org.species)) {
          tl.totalPopulation++;
          tl.totalEnergy += org.energy;
        }
      }
    }

    // Track O2 from photosynthesizers
    const photoCount = organisms.filter(o => o.phenotype.metabolismType === 'photosynthesis').length;
    this.oxygenLevel = Math.min(1, photoCount * 0.001);
  }

  get trophicLevelCount(): number {
    return this.trophicLevels.length;
  }
}
