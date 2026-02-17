export interface MemoryEntry {
  type: string;
  position: { x: number; y: number };
  value: number;
  tick: number;
}

export class OrganismMemory {
  entries: MemoryEntry[] = [];
  capacity: number;

  constructor(capacity: number = 10) {
    this.capacity = capacity;
  }

  remember(entry: MemoryEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.capacity) {
      this.entries.shift();
    }
  }

  recall(type: string): MemoryEntry | null {
    for (let i = this.entries.length - 1; i >= 0; i--) {
      if (this.entries[i].type === type) return this.entries[i];
    }
    return null;
  }

  forget(maxAge: number, currentTick: number): void {
    this.entries = this.entries.filter(e => currentTick - e.tick < maxAge);
  }
}
