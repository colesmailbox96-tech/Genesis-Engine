import { Organism } from '../organisms/Organism';
import { Random } from '../utils/Random';

export type ExtinctionType = 'volcanic' | 'asteroid' | 'oxygen_crisis';

export interface ExtinctionRecord {
  type: ExtinctionType;
  tick: number;
  speciesLost: number;
  populationBefore: number;
  populationAfter: number;
  duration: number;
}

export class ExtinctionEventSystem {
  records: ExtinctionRecord[] = [];
  activeEvent: { type: ExtinctionType; startTick: number; duration: number; severity: number } | null = null;

  checkForEvent(tick: number, rng: Random, volcanicRate: number, asteroidRate: number, o2Level: number, o2Threshold: number): ExtinctionType | null {
    if (this.activeEvent) return null;

    if (rng.next() < volcanicRate) return 'volcanic';
    if (rng.next() < asteroidRate) return 'asteroid';
    if (o2Level > o2Threshold) return 'oxygen_crisis';
    return null;
  }

  startEvent(type: ExtinctionType, tick: number): void {
    const durations: Record<ExtinctionType, number> = {
      volcanic: 2000,
      asteroid: 5000,
      oxygen_crisis: 10000,
    };
    const severities: Record<ExtinctionType, number> = {
      volcanic: 0.3,
      asteroid: 0.7,
      oxygen_crisis: 0.5,
    };
    this.activeEvent = {
      type,
      startTick: tick,
      duration: durations[type],
      severity: severities[type],
    };
  }

  applyEffects(organisms: Organism[], tick: number, rng: Random): number {
    if (!this.activeEvent) return 0;

    const elapsed = tick - this.activeEvent.startTick;
    if (elapsed > this.activeEvent.duration) {
      this.activeEvent = null;
      return 0;
    }

    let killed = 0;
    const killProb = this.activeEvent.severity * (1 - elapsed / this.activeEvent.duration) * 0.01;

    for (const org of organisms) {
      if (rng.next() < killProb) {
        org.alive = false;
        killed++;
      }
    }

    return killed;
  }

  recordExtinction(type: ExtinctionType, tick: number, speciesLost: number, popBefore: number, popAfter: number, duration: number): void {
    this.records.push({ type, tick, speciesLost, populationBefore: popBefore, populationAfter: popAfter, duration });
  }
}
