import { Vector2 } from '../utils/Vector2';
import { Random } from '../utils/Random';
import { Element, ELEMENT_PROPERTIES } from './Element';
import { Molecule, Atom, Bond } from './Molecule';

const REDOX_FAVORABLE_THRESHOLD = -1.0;
const DOUBLE_BOND_ELECTRONEGATIVITY_THRESHOLD = 0.1;

export interface MoleculePattern {
  minAtoms?: number;
  requiredElements?: Element[];
  minChainLength?: number;
}

export interface ReactionRule {
  name: string;
  reactants: [MoleculePattern, MoleculePattern];
  products: MoleculePattern[];
  activationEnergy: number;
  energyDelta: number;
  isExergonic: boolean;
  catalystPattern?: MoleculePattern;
  catalyticReduction: number;
  temperatureRange: [number, number];
  probability: number;
  autocatalytic?: boolean;
}

function matchesPattern(mol: Molecule, pattern: MoleculePattern): boolean {
  if (pattern.minAtoms !== undefined && mol.atoms.length < pattern.minAtoms) return false;
  if (pattern.requiredElements) {
    const elements = new Set(mol.atoms.map(a => a.element));
    for (const req of pattern.requiredElements) {
      if (!elements.has(req)) return false;
    }
  }
  if (pattern.minChainLength !== undefined && mol.getChainLength() < pattern.minChainLength) return false;
  return true;
}

const CORE_RULES: ReactionRule[] = [
  {
    name: 'synthesis',
    reactants: [{ minAtoms: 1 }, { minAtoms: 1 }],
    products: [{ minAtoms: 2 }],
    activationEnergy: 5,
    energyDelta: -2,
    isExergonic: true,
    catalyticReduction: 0.5,
    temperatureRange: [0, 500],
    probability: 0.3,
  },
  {
    name: 'decomposition',
    reactants: [{ minAtoms: 3 }, { minAtoms: 1 }],
    products: [{ minAtoms: 1 }, { minAtoms: 1 }],
    activationEnergy: 15,
    energyDelta: 5,
    isExergonic: false,
    catalyticReduction: 0.4,
    temperatureRange: [200, 1000],
    probability: 0.1,
  },
  {
    name: 'polymerization',
    reactants: [{ minAtoms: 2, requiredElements: [Element.C] }, { minAtoms: 1 }],
    products: [{ minAtoms: 3 }],
    activationEnergy: 8,
    energyDelta: -3,
    isExergonic: true,
    catalyticReduction: 0.6,
    temperatureRange: [50, 400],
    probability: 0.15,
  },
  {
    name: 'catalytic',
    reactants: [{ minAtoms: 1 }, { minAtoms: 1 }],
    products: [{ minAtoms: 2 }],
    activationEnergy: 3,
    energyDelta: -1,
    isExergonic: true,
    catalystPattern: { minAtoms: 3, minChainLength: 2 },
    catalyticReduction: 0.7,
    temperatureRange: [0, 600],
    probability: 0.25,
  },
  {
    name: 'energy_transfer',
    reactants: [{ minAtoms: 1, requiredElements: [Element.P] }, { minAtoms: 1 }],
    products: [{ minAtoms: 1 }, { minAtoms: 1 }],
    activationEnergy: 2,
    energyDelta: 0,
    isExergonic: false,
    catalyticReduction: 0.3,
    temperatureRange: [0, 800],
    probability: 0.2,
  },
  {
    name: 'autocatalytic',
    reactants: [{ minAtoms: 3, minChainLength: 2 }, { minAtoms: 2 }],
    products: [{ minAtoms: 4 }],
    activationEnergy: 4,
    energyDelta: -2,
    isExergonic: true,
    catalyticReduction: 0.8,
    temperatureRange: [50, 500],
    probability: 0.1,
    autocatalytic: true,
  },
  {
    name: 'hydrolysis',
    reactants: [{ minAtoms: 4, minChainLength: 3 }, { minAtoms: 1 }],
    products: [{ minAtoms: 1 }, { minAtoms: 1 }],
    activationEnergy: 6,
    energyDelta: 3,
    isExergonic: false,
    catalyticReduction: 0.3,
    temperatureRange: [0, 400],
    probability: 0.08,
  },
];

export class ReactionSystem {
  private rules: ReactionRule[];

  constructor(additionalRules: ReactionRule[] = []) {
    this.rules = [...CORE_RULES, ...additionalRules];
  }

  getRules(): readonly ReactionRule[] {
    return this.rules;
  }

  checkReaction(
    mol1: Molecule,
    mol2: Molecule,
    temperature: number,
    catalyst?: Molecule,
    wetness: number = 1.0,
  ): ReactionRule | null {
    for (const rule of this.rules) {
      // Check temperature range
      if (temperature < rule.temperatureRange[0] || temperature > rule.temperatureRange[1]) continue;

      // Check reactant patterns (try both orderings)
      const matchForward =
        matchesPattern(mol1, rule.reactants[0]) && matchesPattern(mol2, rule.reactants[1]);
      const matchReverse =
        matchesPattern(mol1, rule.reactants[1]) && matchesPattern(mol2, rule.reactants[0]);
      if (!matchForward && !matchReverse) continue;

      // If rule requires catalyst, check it
      if (rule.catalystPattern && (!catalyst || !matchesPattern(catalyst, rule.catalystPattern))) continue;

      // Wet/dry affects polymerization vs hydrolysis
      // Dry conditions favor condensation (polymerization/synthesis); wet favors hydrolysis
      if (rule.name === 'polymerization' || rule.name === 'synthesis' || rule.name === 'autocatalytic') {
        if (wetness > 0.8) {
          // Very wet suppresses condensation — use wetness as deterministic skip factor
          const suppressFactor = (wetness - 0.8) * 5; // 0..1 range
          if (suppressFactor > 0.5) continue;
        }
      }
      if (rule.name === 'hydrolysis') {
        if (wetness < 0.4) continue; // Dry suppresses hydrolysis
      }

      // Check activation energy (catalyst reduces it)
      let effectiveActivation = rule.activationEnergy;
      if (catalyst && rule.catalystPattern) {
        effectiveActivation *= (1 - rule.catalyticReduction);
      }

      // Autocatalytic reactions: product similarity reduces activation further
      if (rule.autocatalytic) {
        const formula1 = mol1.getFormula();
        const formula2 = mol2.getFormula();
        if (formula1 === formula2) {
          effectiveActivation *= 0.3; // Strong self-catalysis
        }
      }

      const availableEnergy = mol1.energy + mol2.energy + temperature * 0.1;
      if (availableEnergy < effectiveActivation) continue;

      // Redox balance: exergonic reactions with very negative reactant redox get a probability boost
      let probability = rule.probability;
      if (rule.isExergonic) {
        const redoxSum = mol1.redoxPotential + mol2.redoxPotential;
        if (redoxSum < REDOX_FAVORABLE_THRESHOLD) {
          // Favorable thermodynamics: boost probability ×1.5 (applied in executeReaction)
          probability = Math.min(1, rule.probability * 1.5);
        }
      }

      return { ...rule, probability };
    }
    return null;
  }

  executeReaction(
    mol1: Molecule,
    mol2: Molecule,
    rule: ReactionRule,
    rng: Random,
  ): Molecule[] {
    if (rng.next() > rule.probability) return [];

    const midPos = mol1.position.lerp(mol2.position, 0.5);
    const totalEnergy = mol1.energy + mol2.energy + rule.energyDelta;

    if (rule.name === 'decomposition') {
      return this.executeDecomposition(mol1, mol2, totalEnergy, midPos, rng);
    }

    if (rule.name === 'energy_transfer') {
      return this.executeEnergyTransfer(mol1, mol2, totalEnergy, rng);
    }

    // Default: synthesis / polymerization / catalytic — merge atoms
    return this.executeSynthesis(mol1, mol2, totalEnergy, midPos);
  }

  private executeSynthesis(
    mol1: Molecule,
    mol2: Molecule,
    totalEnergy: number,
    position: Vector2,
  ): Molecule[] {
    const atoms = [...mol1.atoms, ...mol2.atoms];
    const bonds = [...mol1.bonds];

    // Remap bonds from mol2
    const offset = mol1.atoms.length;
    for (const bond of mol2.bonds) {
      bonds.push({ atomA: bond.atomA + offset, atomB: bond.atomB + offset, strength: bond.strength, type: bond.type });
    }

    // Create a new bond between the two molecules
    const a1 = this.findAvailableBondSite(mol1.atoms, mol1.bonds, 0);
    const a2 = this.findAvailableBondSite(mol2.atoms, mol2.bonds, 0);
    if (a1 >= 0 && a2 >= 0) {
      const elA = atoms[a1].element;
      const elB = atoms[a2 + offset].element;
      const maxBondsA = ELEMENT_PROPERTIES[elA].bondSites;
      const maxBondsB = ELEMENT_PROPERTIES[elB].bondSites;

      // If BOTH candidate sites would exceed max bondCount, synthesis cannot proceed
      if (atoms[a1].bondCount >= maxBondsA && atoms[a2 + offset].bondCount >= maxBondsB) {
        return [];
      }

      const diff = Math.abs(
        ELEMENT_PROPERTIES[elA].electronegativity - ELEMENT_PROPERTIES[elB].electronegativity,
      );
      const bondType = diff > 0.4 ? 'ionic' as const : 'covalent' as const;

      // Choose bond order: double if electronegativity diff < 0.1 and both atoms have room
      const bondOrder: 'single' | 'double' =
        (diff < DOUBLE_BOND_ELECTRONEGATIVITY_THRESHOLD &&
          atoms[a1].bondCount < maxBondsA - 1 &&
          atoms[a2 + offset].bondCount < maxBondsB - 1)
          ? 'double'
          : 'single';

      bonds.push({ atomA: a1, atomB: a2 + offset, strength: 1 - diff * 0.5, type: bondType, order: bondOrder });
      atoms[a1].bondCount++;
      atoms[a2 + offset].bondCount++;
    }

    const product = new Molecule(atoms, bonds, position, Math.max(0, totalEnergy));
    product.catalyticSites = [...mol1.catalyticSites, ...mol2.catalyticSites];
    return [product];
  }

  private executeDecomposition(
    mol1: Molecule,
    mol2: Molecule,
    totalEnergy: number,
    position: Vector2,
    rng: Random,
  ): Molecule[] {
    // Split the larger molecule
    const source = mol1.atoms.length >= mol2.atoms.length ? mol1 : mol2;
    if (source.atoms.length <= 1) {
      return [new Molecule([...source.atoms], [], position, totalEnergy)];
    }

    const splitPoint = rng.int(1, source.atoms.length);
    const atomsA = source.atoms.slice(0, splitPoint).map(a => ({ ...a, bondCount: 0 }));
    const atomsB = source.atoms.slice(splitPoint).map(a => ({ ...a, bondCount: 0 }));

    const bondsA = source.bonds
      .filter(b => b.atomA < splitPoint && b.atomB < splitPoint)
      .map(b => {
        atomsA[b.atomA].bondCount++;
        atomsA[b.atomB].bondCount++;
        return { ...b };
      });
    const bondsB = source.bonds
      .filter(b => b.atomA >= splitPoint && b.atomB >= splitPoint)
      .map(b => {
        const shifted = { ...b, atomA: b.atomA - splitPoint, atomB: b.atomB - splitPoint };
        atomsB[shifted.atomA].bondCount++;
        atomsB[shifted.atomB].bondCount++;
        return shifted;
      });

    const energyA = totalEnergy * (atomsA.length / source.atoms.length);
    const energyB = totalEnergy - energyA;
    const offset = rng.range(-1, 1);
    const posA = position.add(new Vector2(offset, -offset));
    const posB = position.add(new Vector2(-offset, offset));

    return [
      new Molecule(atomsA, bondsA, posA, Math.max(0, energyA)),
      new Molecule(atomsB, bondsB, posB, Math.max(0, energyB)),
    ];
  }

  private executeEnergyTransfer(
    mol1: Molecule,
    mol2: Molecule,
    totalEnergy: number,
    _rng: Random,
  ): Molecule[] {
    // Redistribute energy between the two molecules
    const half = totalEnergy / 2;
    const p1 = new Molecule([...mol1.atoms], [...mol1.bonds], mol1.position.clone(), Math.max(0, half));
    const p2 = new Molecule([...mol2.atoms], [...mol2.bonds], mol2.position.clone(), Math.max(0, half));
    p1.catalyticSites = [...mol1.catalyticSites];
    p2.catalyticSites = [...mol2.catalyticSites];
    return [p1, p2];
  }

  private findAvailableBondSite(atoms: Atom[], _bonds: Bond[], _baseOffset: number): number {
    for (let i = 0; i < atoms.length; i++) {
      const maxBonds = ELEMENT_PROPERTIES[atoms[i].element].bondSites;
      if (atoms[i].bondCount < maxBonds) return i;
    }
    return -1;
  }
}

