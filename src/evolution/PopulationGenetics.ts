import { Organism } from '../organisms/Organism';
import { GeneType } from '../organisms/Genome';
import { Random } from '../utils/Random';

/**
 * Population Genetics: tracks allele frequencies across the population and
 * applies genetic drift mechanics (random allele frequency changes in small
 * populations, founder effects, bottleneck effects).
 *
 * This builds on the speciation system by providing population-level
 * evolutionary dynamics beyond individual mutation and selection.
 */

export interface AlleleFrequency {
  geneType: GeneType;
  frequency: number;      // 0-1 proportion of enabled gene copies in the population for this gene type (allele frequency)
  previousFrequency: number;
  drift: number;           // rate of change
}

export interface PopulationSnapshot {
  tick: number;
  populationSize: number;
  effectivePopulationSize: number;
  alleleFrequencies: AlleleFrequency[];
  heterozygosity: number;  // genetic diversity within population
  fixationEvents: number;  // alleles that reached near-fixation (>95% frequency)
}

export class PopulationGenetics {
  snapshots: PopulationSnapshot[] = [];
  private previousFrequencies = new Map<GeneType, number>();
  private previousOffspring = new Map<string, number>();
  private totalFixations: number = 0;
  private readonly maxSnapshots = 200;

  /**
   * Analyze the current population and compute allele frequencies,
   * effective population size, and genetic drift.
   */
  analyze(organisms: Organism[], tick: number): PopulationSnapshot {
    if (organisms.length === 0) {
      return {
        tick,
        populationSize: 0,
        effectivePopulationSize: 0,
        alleleFrequencies: [],
        heterozygosity: 0,
        fixationEvents: 0,
      };
    }

    // Count gene type frequencies
    const geneCounts = new Map<GeneType, number>();
    let totalGenes = 0;

    for (const org of organisms) {
      for (const gene of org.genome.genes) {
        if (!gene.enabled) continue;
        geneCounts.set(gene.type, (geneCounts.get(gene.type) ?? 0) + 1);
        totalGenes++;
      }
    }

    // Compute allele frequencies (proportion of this allele among all active genes)
    const alleleFrequencies: AlleleFrequency[] = [];
    let fixationEvents = 0;

    for (const [geneType, count] of geneCounts) {
      const freq = totalGenes > 0 ? count / totalGenes : 0;
      const prevFreq = this.previousFrequencies.get(geneType) ?? freq;
      const drift = freq - prevFreq;

      alleleFrequencies.push({
        geneType,
        frequency: freq,
        previousFrequency: prevFreq,
        drift,
      });

      // Detect near-fixation: allele present in >95% of gene copies
      if (freq > 0.95 && prevFreq <= 0.95) {
        fixationEvents++;
        this.totalFixations++;
      }
    }

    // Update stored frequencies for next comparison
    this.previousFrequencies.clear();
    for (const af of alleleFrequencies) {
      this.previousFrequencies.set(af.geneType, af.frequency);
    }

    // Effective population size (Ne) — accounts for variance in reproductive success
    // Use per-interval offspring (births since last analysis) to avoid inflation from
    // cumulative lifetime counts
    const intervalOffspring = organisms.map(o => {
      const prev = this.previousOffspring.get(o.id) ?? 0;
      return o.offspring - prev;
    });
    // Update stored offspring counts for next interval
    this.previousOffspring.clear();
    for (const o of organisms) {
      this.previousOffspring.set(o.id, o.offspring);
    }

    const meanOffspring = intervalOffspring.reduce((s, v) => s + v, 0) / organisms.length;
    const varianceOffspring = intervalOffspring.length > 1
      ? intervalOffspring.reduce((s, v) => s + (v - meanOffspring) ** 2, 0) / (intervalOffspring.length - 1)
      : 0;

    // Ne ≈ N / (1 + Vk/k) where Vk is variance in offspring, k is mean offspring
    const effectivePopulationSize = meanOffspring > 0
      ? Math.max(1, Math.round(organisms.length / (1 + varianceOffspring / Math.max(0.01, meanOffspring))))
      : organisms.length;

    // Heterozygosity: proportion of loci that are polymorphic
    const polymorphicCount = alleleFrequencies.filter(
      af => af.frequency > 0.05 && af.frequency < 0.95
    ).length;
    const heterozygosity = alleleFrequencies.length > 0
      ? polymorphicCount / alleleFrequencies.length
      : 0;

    const snapshot: PopulationSnapshot = {
      tick,
      populationSize: organisms.length,
      effectivePopulationSize,
      alleleFrequencies,
      heterozygosity,
      fixationEvents,
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  /**
   * Apply genetic drift: in small populations, randomly shift allele frequencies
   * by toggling gene expression in randomly selected organisms.
   * Drift strength is inversely proportional to effective population size.
   */
  applyDrift(organisms: Organism[], rng: Random): void {
    if (organisms.length <= 1) return;

    const lastSnapshot = this.snapshots[this.snapshots.length - 1];
    if (!lastSnapshot) return;

    const ne = lastSnapshot.effectivePopulationSize;
    // Drift probability increases as effective population decreases
    // Very small populations (Ne < 20) experience noticeable drift
    const driftProbability = Math.min(0.05, 1 / (ne + 1));

    for (const org of organisms) {
      if (rng.next() > driftProbability) continue;
      if (org.genome.genes.length === 0) continue;

      // Randomly toggle one gene's expression
      const geneIdx = rng.int(0, org.genome.genes.length);
      const gene = org.genome.genes[geneIdx];
      gene.regulatory = Math.max(0, Math.min(1, gene.regulatory + rng.gaussian(0, 0.1)));
    }
  }

  /**
   * Simulate a bottleneck effect: when population drops sharply,
   * reduce genetic diversity by increasing drift magnitude.
   */
  checkBottleneck(): boolean {
    if (this.snapshots.length < 2) return false;
    const current = this.snapshots[this.snapshots.length - 1];
    const previous = this.snapshots[this.snapshots.length - 2];
    return current.populationSize < previous.populationSize * 0.5;
  }

  getTotalFixations(): number {
    return this.totalFixations;
  }

  getLatestHeterozygosity(): number {
    const last = this.snapshots[this.snapshots.length - 1];
    return last?.heterozygosity ?? 0;
  }
}
