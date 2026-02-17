const SAVE_KEY = 'genesis_engine_save';

export interface SaveData {
  version: number;
  seed: number;
  tick: number;
  timestamp: number;
  milestoneCount: number;
  population: number;
  speciesCount: number;
  moleculeCount: number;
}

export class SaveSystem {
  private static readonly CURRENT_VERSION = 1;

  static save(data: Omit<SaveData, 'version' | 'timestamp'>): boolean {
    try {
      const saveData: SaveData = {
        ...data,
        version: SaveSystem.CURRENT_VERSION,
        timestamp: Date.now(),
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch {
      return false;
    }
  }

  static load(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as SaveData;
      if (data.version !== SaveSystem.CURRENT_VERSION) return null;
      return data;
    } catch {
      return null;
    }
  }

  static hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  static clear(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  static formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }
}
