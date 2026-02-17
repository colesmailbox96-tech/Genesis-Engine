import { Organism } from '../organisms/Organism';

export interface FoodWebLink {
  predatorSpecies: number;
  preySpecies: number;
  strength: number;
}

export class FoodWeb {
  links: FoodWebLink[] = [];

  recordPredation(predator: Organism, prey: Organism): void {
    const existing = this.links.find(
      l => l.predatorSpecies === predator.species && l.preySpecies === prey.species
    );
    if (existing) {
      existing.strength++;
    } else {
      this.links.push({
        predatorSpecies: predator.species,
        preySpecies: prey.species,
        strength: 1,
      });
    }
  }

  getConnectance(speciesCount: number): number {
    if (speciesCount <= 1) return 0;
    const maxLinks = speciesCount * (speciesCount - 1);
    return this.links.length / maxLinks;
  }

  toDot(): string {
    let dot = 'digraph FoodWeb {\n';
    for (const link of this.links) {
      dot += `  species_${link.preySpecies} -> species_${link.predatorSpecies} [label="${link.strength}"];\n`;
    }
    dot += '}\n';
    return dot;
  }
}
