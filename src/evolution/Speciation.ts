import { Organism } from '../organisms/Organism';

export interface Species {
  id: number;
  representative: Organism;
  members: Organism[];
  averageFitness: number;
  age: number;
  stagnationCounter: number;
  bestFitness: number;
}

export class SpeciationSystem {
  species: Species[] = [];
  private nextSpeciesId = 1;
  private threshold: number;

  constructor(threshold: number = 5.0) {
    this.threshold = threshold;
  }

  assignSpecies(organisms: Organism[]): void {
    // Clear old members
    for (const sp of this.species) {
      sp.members = [];
    }

    for (const org of organisms) {
      let assigned = false;
      for (const sp of this.species) {
        if (sp.representative && org.genome.distanceTo(sp.representative.genome) < this.threshold) {
          sp.members.push(org);
          org.species = sp.id;
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        const newSpecies: Species = {
          id: this.nextSpeciesId++,
          representative: org,
          members: [org],
          averageFitness: 0,
          age: 0,
          stagnationCounter: 0,
          bestFitness: 0,
        };
        this.species.push(newSpecies);
        org.species = newSpecies.id;
      }
    }

    // Remove empty species and update representatives
    this.species = this.species.filter(sp => sp.members.length > 0);
    for (const sp of this.species) {
      sp.representative = sp.members[Math.floor(Math.random() * sp.members.length)];
      sp.age++;
    }
  }

  getSpeciesCount(): number {
    return this.species.filter(s => s.members.length > 0).length;
  }

  getSpeciesList(): { id: number; population: number; averageFitness: number }[] {
    return this.species.map(s => ({
      id: s.id,
      population: s.members.length,
      averageFitness: s.averageFitness,
    }));
  }
}
