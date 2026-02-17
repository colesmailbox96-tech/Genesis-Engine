import { Molecule } from './Molecule';
import { ReactionRule } from './Reaction';

export class Catalysis {
  findCatalyst(molecules: Molecule[], reactionRule: ReactionRule): Molecule | null {
    if (!reactionRule.catalystPattern) return null;

    for (const mol of molecules) {
      for (const site of mol.catalyticSites) {
        if (site.targetReactionType === reactionRule.name) {
          return mol;
        }
      }
    }
    return null;
  }

  calculateCatalyticEffect(catalyst: Molecule, rule: ReactionRule): number {
    let maxEfficiency = 0;
    for (const site of catalyst.catalyticSites) {
      if (site.targetReactionType === rule.name && site.efficiency > maxEfficiency) {
        maxEfficiency = site.efficiency;
      }
    }
    return rule.activationEnergy * rule.catalyticReduction * maxEfficiency;
  }
}
