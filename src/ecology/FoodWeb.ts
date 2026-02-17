import { Organism } from '../organisms/Organism';

export interface FoodWebLink {
  predatorSpecies: number;
  preySpecies: number;
  strength: number;
}

export class FoodWeb {
  links: FoodWebLink[] = [];
  /** Keyed by `"predatorSpecies_preySpecies"` for O(1) lookup */
  private linkMap = new Map<string, FoodWebLink>();

  recordPredation(predator: Organism, prey: Organism): void {
    const key = `${predator.species}_${prey.species}`;
    const existing = this.linkMap.get(key);
    if (existing) {
      existing.strength++;
    } else {
      const link: FoodWebLink = {
        predatorSpecies: predator.species,
        preySpecies: prey.species,
        strength: 1,
      };
      this.links.push(link);
      this.linkMap.set(key, link);
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
