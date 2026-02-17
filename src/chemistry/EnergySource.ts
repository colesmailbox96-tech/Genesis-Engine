import { Vector2 } from '../utils/Vector2';
import { Random } from '../utils/Random';
import { Element } from './Element';

export type EnergySourceType = 'thermal_vent' | 'uv_radiation' | 'lightning' | 'chemical_gradient';

export class EnergySource {
  type: EnergySourceType;
  position: Vector2;
  radius: number;
  power: number;
  reliability: number;
  mineralOutput: Element[];
  temperature: number;

  constructor(
    type: EnergySourceType,
    position: Vector2,
    radius: number,
    power: number,
    reliability: number,
    mineralOutput: Element[],
    temperature: number,
  ) {
    this.type = type;
    this.position = position;
    this.radius = radius;
    this.power = power;
    this.reliability = reliability;
    this.mineralOutput = mineralOutput;
    this.temperature = temperature;
  }

  getEnergyAt(position: Vector2, tick: number): number {
    const dist = this.position.distanceTo(position);
    if (dist > this.radius) return 0;

    const distanceFactor = 1 - dist / this.radius;
    // Reliability cycling: sine-based fluctuation
    const cycle = (Math.sin(tick * 0.01 * this.reliability) + 1) * 0.5;
    const reliabilityFactor = this.reliability + (1 - this.reliability) * cycle;

    return this.power * distanceFactor * reliabilityFactor;
  }

  emitMinerals(rng: Random): Element[] {
    if (this.mineralOutput.length === 0) return [];
    const emitted: Element[] = [];
    for (const mineral of this.mineralOutput) {
      if (rng.bool(0.3)) {
        emitted.push(mineral);
      }
    }
    return emitted;
  }

  static createVent(position: Vector2, power: number = 10): EnergySource {
    return new EnergySource(
      'thermal_vent',
      position,
      40,
      power,
      0.8,
      [Element.S, Element.H, Element.P],
      350,
    );
  }

  static createUV(position: Vector2, power: number = 5): EnergySource {
    return new EnergySource(
      'uv_radiation',
      position,
      100,
      power,
      0.6,
      [],
      50,
    );
  }

  static createLightning(position: Vector2, power: number = 100): EnergySource {
    return new EnergySource(
      'lightning',
      position,
      20,
      power,
      0.1,
      [Element.N, Element.O],
      1000,
    );
  }
}
