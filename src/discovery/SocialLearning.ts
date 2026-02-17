import { Organism } from '../organisms/Organism';

export interface SocialLearningEvent {
  learnerId: string;
  teacherId: string;
  behavior: string;
  tick: number;
}

/**
 * Behavioral profile: a snapshot of an organism's actuator output pattern.
 * Used to detect when organisms copy behaviors from successful neighbors.
 */
interface BehaviorProfile {
  outputs: number[];
  fitness: number; // energy proxy
}

/**
 * Social Learning: organisms can adopt behavioral strategies from nearby
 * successful organisms of different lineages.
 *
 * This implements non-genetic information transfer — a key requirement
 * for the "discovery" layer of the simulation. Organisms don't copy
 * genes; they bias their neural outputs toward patterns observed in
 * high-fitness neighbors.
 */
export class SocialLearningTracker {
  events: SocialLearningEvent[] = [];
  private behaviorProfiles = new Map<string, BehaviorProfile>();
  private readonly maxEvents = 500;
  private readonly proximityRadius = 8.0;
  private readonly similarityThreshold = 0.7;
  /** Minimum fitness advantage ratio for an organism to be considered a "teacher" */
  private readonly fitnessAdvantageThreshold = 1.3;

  /**
   * Record current behavioral profiles for all organisms.
   * Call this each tick before check().
   */
  recordProfiles(organisms: Organism[]): void {
    // Prune dead organisms
    const aliveIds = new Set(organisms.filter(o => o.alive).map(o => o.id));
    for (const id of this.behaviorProfiles.keys()) {
      if (!aliveIds.has(id)) this.behaviorProfiles.delete(id);
    }

    for (const org of organisms) {
      if (!org.alive) continue;
      this.behaviorProfiles.set(org.id, {
        outputs: [...org.actuatorOutputs],
        fitness: org.energy,
      });
    }
  }

  /**
   * Check for social learning events: when an organism is near a more
   * successful organism from a different lineage, it may adopt similar
   * behavioral patterns.
   */
  check(
    organisms: Organism[],
    tick: number,
    getNearby?: (x: number, y: number, r: number) => Organism[]
  ): SocialLearningEvent | null {
    if (!getNearby || organisms.length < 2) return null;

    for (const learner of organisms) {
      if (!learner.alive) continue;

      const nearby = getNearby(learner.position.x, learner.position.y, this.proximityRadius);
      let bestTeacher: Organism | null = null;
      let bestFitness = learner.energy;

      for (const other of nearby) {
        if (other.id === learner.id || !other.alive) continue;
        // Must be from different lineage (non-kin)
        if (other.parentId === learner.parentId && learner.parentId !== '') continue;

        if (other.energy > bestFitness * this.fitnessAdvantageThreshold) {
          bestTeacher = other;
          bestFitness = other.energy;
        }
      }

      if (!bestTeacher) continue;

      // Learning occurs: bias learner's outputs toward teacher's pattern
      const teacherProfile = this.behaviorProfiles.get(bestTeacher.id);
      if (!teacherProfile) continue;

      // Identify which behavior was most different (the "learned" behavior)
      let maxDiff = 0;
      let learnedBehavior = 'movement';
      const behaviorNames = ['move_x', 'move_y', 'speed', 'ingestion', 'secretion', 'division', 'signal', 'adhesion'];

      for (let i = 0; i < Math.min(learner.actuatorOutputs.length, teacherProfile.outputs.length); i++) {
        const diff = Math.abs(learner.actuatorOutputs[i] - teacherProfile.outputs[i]);
        if (diff > maxDiff) {
          maxDiff = diff;
          learnedBehavior = behaviorNames[i] ?? 'unknown';
        }
      }

      // Only learn if behaviors are meaningfully different
      if (maxDiff < 0.2) continue;

      // Apply learning: nudge learner's outputs toward teacher's pattern
      const learningRate = 0.1;
      for (let i = 0; i < Math.min(learner.actuatorOutputs.length, teacherProfile.outputs.length); i++) {
        learner.actuatorOutputs[i] += (teacherProfile.outputs[i] - learner.actuatorOutputs[i]) * learningRate;
      }

      const event: SocialLearningEvent = {
        learnerId: learner.id,
        teacherId: bestTeacher.id,
        behavior: learnedBehavior,
        tick,
      };

      this.events.push(event);
      if (this.events.length > this.maxEvents) {
        this.events = this.events.slice(-this.maxEvents);
      }

      return event; // Return first event found per call
    }

    return null;
  }

  /**
   * Compute behavioral similarity between two organisms (0-1).
   */
  getSimilarity(a: Organism, b: Organism): number {
    const profileA = this.behaviorProfiles.get(a.id);
    const profileB = this.behaviorProfiles.get(b.id);
    if (!profileA || !profileB) return 0;

    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    const len = Math.min(profileA.outputs.length, profileB.outputs.length);
    for (let i = 0; i < len; i++) {
      dotProduct += profileA.outputs[i] * profileB.outputs[i];
      magA += profileA.outputs[i] ** 2;
      magB += profileB.outputs[i] ** 2;
    }

    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom > 0 ? Math.max(0, dotProduct / denom) : 0;
  }

  getEventCount(): number {
    return this.events.length;
  }

  getRecentEvents(count: number): SocialLearningEvent[] {
    return this.events.slice(-count);
  }
}
