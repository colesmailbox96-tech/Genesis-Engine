import { Organism } from '../organisms/Organism';

export type SymbiosisType = 'mutualism' | 'parasitism' | 'commensalism';

export interface SymbioticBond {
  hostId: string;
  symbiontId: string;
  type: SymbiosisType;
  strength: number;       // 0-1, how established the bond is
  ticksActive: number;
  hostSpecies: number;
  symbiontSpecies: number;
}

export class SymbiosisSystem {
  bonds: SymbioticBond[] = [];
  private readonly proximityThreshold = 3.0;
  private readonly minTicksForBond = 50;
  private readonly maxBonds = 500;

  /**
   * Detect and update symbiotic relationships between nearby organisms.
   * Bonds form when organisms of different species stay in close proximity.
   * The type of symbiosis emerges from their energy exchange patterns.
   */
  update(organisms: Organism[], getNearby: (x: number, y: number, r: number) => Organism[]): void {
    // Decay existing bonds and remove broken ones
    for (const bond of this.bonds) {
      bond.ticksActive++;
      bond.strength = Math.min(1, bond.strength + 0.001);
    }

    // Remove bonds where one partner is dead
    const aliveIds = new Set(organisms.filter(o => o.alive).map(o => o.id));
    this.bonds = this.bonds.filter(
      b => aliveIds.has(b.hostId) && aliveIds.has(b.symbiontId)
    );

    // Check for new bonds forming between close, different-species organisms
    const bonded = new Set<string>();
    for (const bond of this.bonds) {
      bonded.add(bond.hostId + ':' + bond.symbiontId);
    }

    for (const org of organisms) {
      if (!org.alive) continue;

      const nearby = getNearby(org.position.x, org.position.y, this.proximityThreshold);
      for (const other of nearby) {
        if (other.id === org.id || !other.alive) continue;
        if (org.species === other.species) continue;

        const key = org.id < other.id
          ? org.id + ':' + other.id
          : other.id + ':' + org.id;

        if (bonded.has(key)) continue;

        const distSq = org.position.distanceSqTo(other.position);
        const threshold = (org.phenotype.bodyRadius + other.phenotype.bodyRadius + 1);
        if (distSq > threshold * threshold) continue;

        // Determine symbiosis type from metabolic compatibility
        const type = this.classifySymbiosis(org, other);

        this.bonds.push({
          hostId: org.id < other.id ? org.id : other.id,
          symbiontId: org.id < other.id ? other.id : org.id,
          type,
          strength: 0.01,
          ticksActive: 0,
          hostSpecies: org.species,
          symbiontSpecies: other.species,
        });
        bonded.add(key);
      }
    }

    // Cap bonds
    if (this.bonds.length > this.maxBonds) {
      this.bonds.sort((a, b) => b.strength - a.strength);
      this.bonds = this.bonds.slice(0, this.maxBonds);
    }
  }

  /**
   * Apply symbiotic effects: energy transfers based on bond type.
   */
  applyEffects(organismsById: Map<string, Organism>): void {
    for (const bond of this.bonds) {
      if (bond.ticksActive < this.minTicksForBond) continue;

      const host = organismsById.get(bond.hostId);
      const symbiont = organismsById.get(bond.symbiontId);
      if (!host || !symbiont || !host.alive || !symbiont.alive) continue;

      const effect = bond.strength * 0.002;

      switch (bond.type) {
        case 'mutualism':
          // Both gain a small energy bonus
          host.energy += effect;
          symbiont.energy += effect;
          break;
        case 'parasitism':
          // Symbiont drains energy from host
          host.energy -= effect;
          symbiont.energy += effect * 0.7;
          break;
        case 'commensalism':
          // Symbiont gains small benefit, host unaffected
          symbiont.energy += effect * 0.5;
          break;
      }
    }
  }

  /**
   * Classify symbiosis type based on metabolic complementarity.
   * Organisms with complementary metabolisms (e.g., photosynthesis + chemosynthesis)
   * tend toward mutualism. Heterotrophs tend toward parasitism.
   */
  private classifySymbiosis(a: Organism, b: Organism): SymbiosisType {
    const metA = a.phenotype.metabolismType;
    const metB = b.phenotype.metabolismType;

    // Different autotrophic metabolisms → mutualism (complementary waste products)
    const autotrophic = new Set(['photosynthesis', 'chemosynthesis', 'fermentation']);
    if (autotrophic.has(metA) && autotrophic.has(metB) && metA !== metB) {
      return 'mutualism';
    }

    // Heterotroph + autotroph → parasitism (predator/prey dynamic)
    if (metA === 'heterotrophy' || metB === 'heterotrophy') {
      // If both have cooperation markers, upgrade to mutualism
      if (a.phenotype.cooperationMarker > 0.5 && b.phenotype.cooperationMarker > 0.5) {
        return 'mutualism';
      }
      return 'parasitism';
    }

    // Same metabolism → commensalism (one benefits from proximity)
    return 'commensalism';
  }

  getBondCount(): number {
    return this.bonds.length;
  }

  getBondsByType(): Record<SymbiosisType, number> {
    const counts: Record<SymbiosisType, number> = { mutualism: 0, parasitism: 0, commensalism: 0 };
    for (const bond of this.bonds) {
      counts[bond.type]++;
    }
    return counts;
  }

  getBondsForOrganism(id: string): SymbioticBond[] {
    return this.bonds.filter(b => b.hostId === id || b.symbiontId === id);
  }
}
