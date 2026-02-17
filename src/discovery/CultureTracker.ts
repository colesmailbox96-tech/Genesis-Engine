export enum DiscoveryType {
  TOOL_USE = 'TOOL_USE',
  COOPERATIVE_HUNTING = 'COOPERATIVE_HUNTING',
  COMMUNICATION_PROTOCOL = 'COMMUNICATION_PROTOCOL',
  AGRICULTURE = 'AGRICULTURE',
  TERRITORY = 'TERRITORY',
  MOURNING = 'MOURNING',
  PLAY = 'PLAY',
  MIGRATION = 'MIGRATION',
  TEACHING = 'TEACHING',
}

export interface DiscoveryEvent {
  type: DiscoveryType;
  organismId: string;
  species: number;
  tick: number;
  description: string;
  evidence: string[];
}

export class CultureTracker {
  discoveries: DiscoveryEvent[] = [];

  record(event: DiscoveryEvent): void {
    this.discoveries.push(event);
  }

  hasDiscovery(type: DiscoveryType): boolean {
    return this.discoveries.some(d => d.type === type);
  }

  getDiscoveriesBySpecies(speciesId: number): DiscoveryEvent[] {
    return this.discoveries.filter(d => d.species === speciesId);
  }

  getAll(): DiscoveryEvent[] {
    return this.discoveries;
  }
}
