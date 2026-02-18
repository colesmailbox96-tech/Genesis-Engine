import { Molecule } from './Molecule';
import { ReactionRule } from './Reaction';
import { Element } from './Element';

export interface CatalyticMotif {
  name: string;
  test: (mol: Molecule) => boolean;
  reactionClass: string;  // reaction name it catalyzes
  reductionBonus: number; // additional activation energy reduction (0-1)
}

export const CATALYTIC_MOTIFS: CatalyticMotif[] = [
  {
    name: 'NN_motif',
    test: (mol) => mol.bonds.some(b =>
      mol.atoms[b.atomA].element === Element.N && mol.atoms[b.atomB].element === Element.N ||
      mol.atoms[b.atomB].element === Element.N && mol.atoms[b.atomA].element === Element.N
    ),
    reactionClass: 'synthesis',
    reductionBonus: 0.2,
  },
  {
    name: 'COO_motif',
    test: (mol) => {
      // Has a carbon bonded to two oxygens
      const cIndices = mol.atoms.map((a, i) => a.element === Element.C ? i : -1).filter(i => i >= 0);
      for (const ci of cIndices) {
        const oNeighbors = mol.bonds
          .filter(b => (b.atomA === ci || b.atomB === ci))
          .filter(b => mol.atoms[b.atomA === ci ? b.atomB : b.atomA].element === Element.O)
          .length;
        if (oNeighbors >= 2) return true;
      }
      return false;
    },
    reactionClass: 'hydrolysis',
    reductionBonus: 0.25,
  },
  {
    name: 'S_redox_motif',
    test: (mol) => mol.atoms.some(a => a.element === Element.S),
    reactionClass: 'energy_transfer',
    reductionBonus: 0.3,
  },
  {
    name: 'P_phosphoryl_motif',
    test: (mol) => mol.atoms.some(a => a.element === Element.P) && mol.atoms.some(a => a.element === Element.O),
    reactionClass: 'polymerization',
    reductionBonus: 0.35,
  },
  {
    name: 'long_chain_motif',
    test: (mol) => mol.getChainLength() >= 4,
    reactionClass: 'autocatalytic',
    reductionBonus: 0.2,
  },
];

// Cache motif detection results (keyed by molecule id + formula)
const motifCache = new Map<string, CatalyticMotif[]>();

function getMotifs(mol: Molecule): CatalyticMotif[] {
  const key = mol.id;
  let cached = motifCache.get(key);
  if (!cached) {
    cached = CATALYTIC_MOTIFS.filter(m => m.test(mol));
    motifCache.set(key, cached);
  }
  return cached;
}

export function clearMotifCache(molId: string): void {
  motifCache.delete(molId);
}

export class Catalysis {
  findCatalyst(molecules: Molecule[], reactionRule: ReactionRule): Molecule | null {
    for (const mol of molecules) {
      // Legacy: explicit catalytic sites
      if (mol.catalyticSites.some(s => s.targetReactionType === reactionRule.name)) {
        return mol;
      }
      // Motif-based: check if molecule has a motif for this reaction class
      const motifs = getMotifs(mol);
      if (motifs.some(m => m.reactionClass === reactionRule.name)) {
        return mol;
      }
    }
    return null;
  }

  calculateCatalyticEffect(catalyst: Molecule, rule: ReactionRule): number {
    // Legacy site-based effect
    let maxEfficiency = 0;
    for (const site of catalyst.catalyticSites) {
      if (site.targetReactionType === rule.name && site.efficiency > maxEfficiency) {
        maxEfficiency = site.efficiency;
      }
    }
    const legacyReduction = rule.activationEnergy * rule.catalyticReduction * maxEfficiency;

    // Motif-based effect
    const motifs = getMotifs(catalyst);
    const motifReduction = motifs
      .filter(m => m.reactionClass === rule.name)
      .reduce((sum, m) => sum + m.reductionBonus * rule.activationEnergy, 0);

    return legacyReduction + motifReduction;
  }

  /** Assign catalytic sites to a molecule based on its motifs */
  assignMotifsAsCatalyticSites(mol: Molecule): void {
    const motifs = getMotifs(mol);
    for (const motif of motifs) {
      const alreadyHas = mol.catalyticSites.some(s => s.targetReactionType === motif.reactionClass);
      if (!alreadyHas) {
        mol.catalyticSites.push({
          targetReactionType: motif.reactionClass,
          efficiency: motif.reductionBonus,
        });
      }
    }
    if (motifs.length > 0) mol.role = 'catalyst';
  }
}
