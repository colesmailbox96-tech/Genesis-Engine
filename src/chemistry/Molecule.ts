import { Vector2 } from '../utils/Vector2';
import { Random } from '../utils/Random';
import { generateId } from '../utils/Math';
import { SpatialEntity } from '../engine/SpatialHash';
import { Element, ELEMENT_PROPERTIES } from './Element';

export interface Atom {
  element: Element;
  bondCount: number;
}

export interface Bond {
  atomA: number;
  atomB: number;
  strength: number;
  type: 'covalent' | 'ionic' | 'hydrogen';
}

export interface CatalyticSite {
  targetReactionType: string;
  efficiency: number;
}

export type MoleculeRole = 'food' | 'waste' | 'catalyst' | 'membrane' | 'genome_segment' | 'toxin' | 'unknown';

export interface FormationRecord {
  parentFormulas: string[];
  reactionType: string;
  zoneName: string;
  catalystFormula: string | null;
  tick: number;
}

export class Molecule implements SpatialEntity {
  id: string;
  atoms: Atom[];
  bonds: Bond[];
  position: Vector2;
  velocity: Vector2;
  energy: number;
  age: number;
  mass: number;
  polarity: number;
  catalyticSites: CatalyticSite[];
  role: MoleculeRole;
  formation: FormationRecord | null;
  halfLife: number;
  private _cachedChainLength: number = -1;

  constructor(
    atoms: Atom[],
    bonds: Bond[],
    position: Vector2,
    energy: number = 0,
  ) {
    this.id = generateId();
    this.atoms = atoms;
    this.bonds = bonds;
    this.position = position;
    this.velocity = Vector2.zero();
    this.energy = energy;
    this.age = 0;
    this.mass = this.computeMass();
    this.polarity = this.computePolarity();
    this.catalyticSites = [];
    this.role = 'unknown';
    this.formation = null;
    this.halfLife = this.estimateHalfLife();
  }

  estimateHalfLife(): number {
    // Estimate stability based on bond count and types
    const avgBondStrength = this.bonds.length > 0
      ? this.bonds.reduce((s, b) => s + b.strength, 0) / this.bonds.length
      : 0;
    // Base half-life scales with bonds; stronger bonds = longer half-life
    return Math.max(100, (this.bonds.length * avgBondStrength * 5000) + 500);
  }

  inferRole(): MoleculeRole {
    if (this.catalyticSites.length > 0) return 'catalyst';
    if (this.hasLongCarbonChain() && this.polarity > 0.3) return 'membrane';
    if (this.hasPhosphorusRing() || (this.hasCNChain() && this.getChainLength() >= 4)) return 'genome_segment';
    if (this.atoms.length <= 2 && this.energy > 0) return 'food';
    if (this.polarity > 0.5 && this.atoms.some(a => a.element === Element.S)) return 'toxin';
    if (this.atoms.length <= 1) return 'waste';
    return 'unknown';
  }

  private computeMass(): number {
    return this.atoms.reduce((sum, a) => sum + ELEMENT_PROPERTIES[a.element].mass, 0);
  }

  private computePolarity(): number {
    if (this.atoms.length <= 1) return 0;
    const electronegativities = this.atoms.map(a => ELEMENT_PROPERTIES[a.element].electronegativity);
    const max = Math.max(...electronegativities);
    const min = Math.min(...electronegativities);
    return max - min;
  }

  getFormula(): string {
    const counts = new Map<Element, number>();
    for (const atom of this.atoms) {
      counts.set(atom.element, (counts.get(atom.element) ?? 0) + 1);
    }
    // Standard chemical formula ordering: C, H, then alphabetical
    const order: Element[] = [Element.C, Element.H, Element.N, Element.O, Element.P, Element.S];
    let formula = '';
    for (const el of order) {
      const count = counts.get(el);
      if (count) {
        formula += el;
        if (count > 1) formula += count;
      }
    }
    return formula;
  }

  /** Invalidate cached chain length when bonds change */
  invalidateChainLength(): void {
    this._cachedChainLength = -1;
  }

  getChainLength(): number {
    if (this._cachedChainLength >= 0) return this._cachedChainLength;
    if (this.atoms.length === 0) { this._cachedChainLength = 0; return 0; }
    // BFS to find the longest chain
    const adj: number[][] = Array.from({ length: this.atoms.length }, () => []);
    for (const bond of this.bonds) {
      adj[bond.atomA].push(bond.atomB);
      adj[bond.atomB].push(bond.atomA);
    }
    let maxLen = 1;
    for (let start = 0; start < this.atoms.length; start++) {
      const visited = new Set<number>();
      const stack: Array<[number, number]> = [[start, 1]];
      visited.add(start);
      while (stack.length > 0) {
        const [node, depth] = stack.pop()!;
        if (depth > maxLen) maxLen = depth;
        for (const neighbor of adj[node]) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            stack.push([neighbor, depth + 1]);
          }
        }
      }
    }
    this._cachedChainLength = maxLen;
    return maxLen;
  }

  hasCNChain(): boolean {
    // Check if molecule has a chain with alternating C and N atoms
    for (const bond of this.bonds) {
      const elA = this.atoms[bond.atomA].element;
      const elB = this.atoms[bond.atomB].element;
      if ((elA === Element.C && elB === Element.N) ||
          (elA === Element.N && elB === Element.C)) {
        return true;
      }
    }
    return false;
  }

  hasLongCarbonChain(): boolean {
    if (this.atoms.length < 4) return false;
    const adj: number[][] = Array.from({ length: this.atoms.length }, () => []);
    for (const bond of this.bonds) {
      adj[bond.atomA].push(bond.atomB);
      adj[bond.atomB].push(bond.atomA);
    }
    // DFS for carbon-only chains of length >= 4
    const dfs = (node: number, visited: Set<number>, length: number): number => {
      if (length >= 4) return length;
      let maxLen = length;
      for (const neighbor of adj[node]) {
        if (!visited.has(neighbor) && this.atoms[neighbor].element === Element.C) {
          visited.add(neighbor);
          maxLen = Math.max(maxLen, dfs(neighbor, visited, length + 1));
          visited.delete(neighbor);
        }
      }
      return maxLen;
    };
    for (let i = 0; i < this.atoms.length; i++) {
      if (this.atoms[i].element === Element.C) {
        const visited = new Set<number>([i]);
        if (dfs(i, visited, 1) >= 4) return true;
      }
    }
    return false;
  }

  hasPhosphorusRing(): boolean {
    // Check for a cycle containing phosphorus
    const pIndices = this.atoms
      .map((a, i) => a.element === Element.P ? i : -1)
      .filter(i => i >= 0);
    if (pIndices.length === 0) return false;

    const adj: number[][] = Array.from({ length: this.atoms.length }, () => []);
    for (const bond of this.bonds) {
      adj[bond.atomA].push(bond.atomB);
      adj[bond.atomB].push(bond.atomA);
    }

    // For each P atom, BFS to detect cycle
    for (const pIdx of pIndices) {
      const visited = new Set<number>();
      const parent = new Map<number, number>();
      const queue: number[] = [pIdx];
      visited.add(pIdx);
      parent.set(pIdx, -1);
      while (queue.length > 0) {
        const node = queue.shift()!;
        for (const neighbor of adj[node]) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            parent.set(neighbor, node);
            queue.push(neighbor);
          } else if (parent.get(node) !== neighbor) {
            return true;
          }
        }
      }
    }
    return false;
  }

  tick(): void {
    this.age++;
    this.position.addMut(this.velocity);
  }

  static createRandom(element: Element, position: Vector2, _rng: Random): Molecule {
    const atom: Atom = { element, bondCount: 0 };
    return new Molecule([atom], [], position, 0);
  }
}
