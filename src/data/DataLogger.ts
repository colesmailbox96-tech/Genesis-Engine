export interface LogEntry {
  tick: number;
  type: string;
  data: Record<string, unknown>;
}

export class DataLogger {
  entries: LogEntry[] = [];
  private maxEntries: number = 10000;

  log(tick: number, type: string, data: Record<string, unknown>): void {
    this.entries.push({ tick, type, data });
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries / 2);
    }
  }

  getByType(type: string): LogEntry[] {
    return this.entries.filter(e => e.type === type);
  }

  toJSONL(): string {
    return this.entries.map(e => JSON.stringify(e)).join('\n');
  }
}
