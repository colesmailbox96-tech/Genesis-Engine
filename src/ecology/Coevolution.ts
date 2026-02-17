import { Organism } from '../organisms/Organism';
import { FoodWeb, FoodWebLink } from './FoodWeb';
import { Random } from '../utils/Random';
import { clamp } from '../utils/Math';

/**
 * Predator-Prey Coevolution: implements Red Queen dynamics where predators
 * and prey co-evolve in an arms race. Selection pressure from predation
 * drives evolution of defensive and offensive traits.
 *
 * Builds on the existing FoodWeb, SelectionPressure, and organism defense
 * traits (toxin, shell, speed, camouflage) to create dynamic coevolutionary
 * feedback loops.
 */

export interface ArmsRaceMetrics {
  predatorPressure: number;    // average predation stress on prey species
  preyDefenseLevel: number;    // average defense investment in prey
  predatorOffenseLevel: number; // average offense investment in predators
  escalationRate: number;       // rate of trait change (Red Queen speed)
}

export interface CoevolutionaryPair {
  predatorSpecies: number;
  preySpecies: number;
  interactionCount: number;
  predatorTraitSum: number;
  preyDefenseSum: number;
  lastUpdateTick: number;
}

export class CoevolutionSystem {
  pairs: CoevolutionaryPair[] = [];
  private previousMetrics: ArmsRaceMetrics | null = null;
  private readonly maxPairs = 200;
  /** Minimum predation events before tracking a coevolutionary relationship */
  private readonly minEstablishedPredation = 2;

  /**
   * Update coevolutionary relationships based on current food web data.
   * Identifies predator-prey pairs and tracks trait escalation.
   */
  update(
    organisms: Organism[],
    foodWeb: FoodWeb,
    tick: number
  ): ArmsRaceMetrics {
    // Build species lookup
    const speciesMap = new Map<number, Organism[]>();
    for (const org of organisms) {
      if (!org.alive) continue;
      const list = speciesMap.get(org.species) ?? [];
      list.push(org);
      speciesMap.set(org.species, list);
    }

    // Update coevolutionary pairs from food web links
    for (const link of foodWeb.links) {
      if (link.strength < this.minEstablishedPredation) continue;

      let pair = this.pairs.find(
        p => p.predatorSpecies === link.predatorSpecies && p.preySpecies === link.preySpecies
      );

      if (!pair) {
        pair = {
          predatorSpecies: link.predatorSpecies,
          preySpecies: link.preySpecies,
          interactionCount: 0,
          predatorTraitSum: 0,
          preyDefenseSum: 0,
          lastUpdateTick: tick,
        };
        this.pairs.push(pair);
      }

      pair.interactionCount = link.strength;
      pair.lastUpdateTick = tick;

      // Compute average traits for each side
      const predators = speciesMap.get(link.predatorSpecies) ?? [];
      const prey = speciesMap.get(link.preySpecies) ?? [];

      if (predators.length > 0) {
        pair.predatorTraitSum = predators.reduce(
          (s, o) => s + getOffensiveScore(o), 0
        ) / predators.length;
      }
      if (prey.length > 0) {
        pair.preyDefenseSum = prey.reduce(
          (s, o) => s + getDefensiveScore(o), 0
        ) / prey.length;
      }
    }

    // Remove stale pairs
    this.pairs = this.pairs.filter(p => tick - p.lastUpdateTick < 5000);
    if (this.pairs.length > this.maxPairs) {
      this.pairs.sort((a, b) => b.interactionCount - a.interactionCount);
      this.pairs = this.pairs.slice(0, this.maxPairs);
    }

    // Compute metrics
    const metrics = this.computeMetrics(organisms);
    this.previousMetrics = metrics;
    return metrics;
  }

  /**
   * Apply coevolutionary selection pressure: organisms involved in active
   * arms races receive fitness bonuses for relevant traits.
   * Prey with higher defense survive better; predators with higher offense hunt better.
   */
  applyCoevolutionaryPressure(organisms: Organism[], rng: Random): void {
    const preySpecies = new Set(this.pairs.map(p => p.preySpecies));
    const predatorSpecies = new Set(this.pairs.map(p => p.predatorSpecies));

    for (const org of organisms) {
      if (!org.alive) continue;

      // Prey species benefit from defense investment
      if (preySpecies.has(org.species)) {
        const defenseScore = getDefensiveScore(org);
        // Well-defended prey lose less energy to predation stress
        org.energy += defenseScore * 0.001;
      }

      // Predator species benefit from offense investment
      if (predatorSpecies.has(org.species)) {
        const offenseScore = getOffensiveScore(org);
        // Effective predators get small efficiency bonus
        org.energy += offenseScore * 0.0005;
      }
    }
  }

  private computeMetrics(organisms: Organism[]): ArmsRaceMetrics {
    if (organisms.length === 0 || this.pairs.length === 0) {
      return { predatorPressure: 0, preyDefenseLevel: 0, predatorOffenseLevel: 0, escalationRate: 0 };
    }

    const avgPredatorTrait = this.pairs.reduce((s, p) => s + p.predatorTraitSum, 0) / this.pairs.length;
    const avgPreyDefense = this.pairs.reduce((s, p) => s + p.preyDefenseSum, 0) / this.pairs.length;
    const predatorPressure = this.pairs.reduce((s, p) => s + p.interactionCount, 0) / this.pairs.length;

    let escalationRate = 0;
    if (this.previousMetrics) {
      escalationRate = Math.abs(avgPredatorTrait - this.previousMetrics.predatorOffenseLevel)
        + Math.abs(avgPreyDefense - this.previousMetrics.preyDefenseLevel);
    }

    return {
      predatorPressure,
      preyDefenseLevel: avgPreyDefense,
      predatorOffenseLevel: avgPredatorTrait,
      escalationRate,
    };
  }

  getActivePairCount(): number {
    return this.pairs.length;
  }
}

/** Compute a composite offensive score for a predator */
function getOffensiveScore(org: Organism): number {
  return clamp(
    org.phenotype.mass * 0.3 +
    org.phenotype.maxSpeed * 0.4 +
    org.phenotype.toxicity * 0.3,
    0, 2
  );
}

/** Compute a composite defensive score for prey */
function getDefensiveScore(org: Organism): number {
  return clamp(
    org.phenotype.shellThickness * 0.3 +
    org.phenotype.maxSpeed * 0.3 +
    org.phenotype.camouflageLevel * 0.2 +
    org.phenotype.toxicity * 0.2,
    0, 2
  );
}
