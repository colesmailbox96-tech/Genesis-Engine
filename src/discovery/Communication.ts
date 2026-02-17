import { Organism, SIGNAL_OUT } from '../organisms/Organism';

export interface SignalEvent {
  emitterId: string;
  signalType: number;
  intensity: number;
  position: { x: number; y: number };
  tick: number;
}

export class CommunicationSystem {
  signals: SignalEvent[] = [];
  protocols: Map<string, number> = new Map(); // signal-response pattern counts

  emitSignal(organism: Organism, tick: number): SignalEvent | null {
    const signalStrength = organism.actuatorOutputs[SIGNAL_OUT] ?? 0;
    if (Math.abs(signalStrength) < 0.3) return null;

    const event: SignalEvent = {
      emitterId: organism.id,
      signalType: organism.phenotype.signalType,
      intensity: Math.abs(signalStrength),
      position: { x: organism.position.x, y: organism.position.y },
      tick,
    };
    this.signals.push(event);
    
    // Keep only recent signals
    if (this.signals.length > 500) {
      this.signals = this.signals.slice(-250);
    }
    
    return event;
  }

  getSignalsNear(x: number, y: number, radius: number): SignalEvent[] {
    const r2 = radius * radius;
    return this.signals.filter(s => {
      const dx = s.position.x - x;
      const dy = s.position.y - y;
      return dx * dx + dy * dy <= r2;
    });
  }
}
