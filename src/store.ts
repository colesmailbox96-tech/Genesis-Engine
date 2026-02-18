import { create } from 'zustand';
import { Simulation, MilestoneEvent } from './engine/Simulation';
import { SimConfig, DEFAULT_CONFIG } from './engine/Config';
import { Organism } from './organisms/Organism';
import { Molecule } from './chemistry/Molecule';
import { Protocell } from './proto/Protocell';
import { SaveSystem, SaveData } from './data/SaveSystem';

export interface GameStore {
  // Simulation
  simulation: Simulation | null;
  isRunning: boolean;
  speed: number;
  tick: number;

  // Selection
  selectedEntity: Organism | Molecule | Protocell | null;
  selectedEntityType: 'organism' | 'molecule' | 'protocell' | null;

  // UI state
  showWelcome: boolean;
  showInspector: boolean;
  showMilestones: boolean;
  showStats: boolean;
  showResearch: boolean;
  seed: number;
  volume: number;

  // Stats
  population: number;
  speciesCount: number;
  moleculeCount: number;
  milestones: MilestoneEvent[];
  fps: number;
  tps: number;

  // Actions
  initSimulation: (seed?: number, config?: SimConfig) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  setSpeed: (speed: number) => void;
  skipTicks: (count: number) => void;
  selectEntity: (entity: Organism | Molecule | Protocell | null, type: 'organism' | 'molecule' | 'protocell' | null) => void;
  setShowWelcome: (show: boolean) => void;
  setShowInspector: (show: boolean) => void;
  setShowMilestones: (show: boolean) => void;
  setShowStats: (show: boolean) => void;
  setShowResearch: (show: boolean) => void;
  setVolume: (volume: number) => void;
  updateStats: () => void;
  updatePerf: (fps: number, tps: number) => void;
  saveState: () => boolean;
  loadSavedState: () => SaveData | null;
  hasSavedState: () => boolean;
  clearSavedState: () => void;
  restoreFromSave: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  simulation: null,
  isRunning: false,
  speed: 1,
  tick: 0,
  selectedEntity: null,
  selectedEntityType: null,
  showWelcome: true,
  showInspector: false,
  showMilestones: false,
  showStats: false,
  showResearch: false,
  seed: Math.floor(Math.random() * 999999),
  volume: 0.3,
  population: 0,
  speciesCount: 0,
  moleculeCount: 0,
  fps: 0,
  tps: 0,
  milestones: [],

  initSimulation: (seed, config) => {
    const s = seed ?? get().seed;
    const sim = new Simulation(config ?? DEFAULT_CONFIG, s);
    set({ simulation: sim, seed: s, showWelcome: false, tick: 0 });
  },

  startSimulation: () => set({ isRunning: true }),
  pauseSimulation: () => set({ isRunning: false }),

  setSpeed: (speed) => set({ speed }),

  skipTicks: (count) => {
    const sim = get().simulation;
    if (sim) {
      for (let i = 0; i < count; i++) sim.update();
      get().updateStats();
    }
  },

  selectEntity: (entity, type) => set({
    selectedEntity: entity,
    selectedEntityType: type,
    showInspector: entity !== null,
  }),

  setShowWelcome: (show) => set({ showWelcome: show }),
  setShowInspector: (show) => set({ showInspector: show }),
  setShowMilestones: (show) => set({ showMilestones: show }),
  setShowStats: (show) => set({ showStats: show }),
  setShowResearch: (show) => set({ showResearch: show }),
  setVolume: (volume) => set({ volume }),

  updateStats: () => {
    const sim = get().simulation;
    if (!sim) return;
    const stats = sim.getStats();
    const currentMilestones = get().milestones;
    const newState: Partial<GameStore> = {
      tick: stats.tick,
      population: stats.population,
      speciesCount: stats.speciesCount,
      moleculeCount: stats.moleculeCount,
    };
    // Only create new milestones array if it has changed
    if (sim.milestones.length !== currentMilestones.length) {
      newState.milestones = [...sim.milestones];
    }
    set(newState);
  },

  updatePerf: (fps, tps) => set({ fps, tps }),

  saveState: () => {
    const sim = get().simulation;
    if (!sim) return false;
    const stats = sim.getStats();
    return SaveSystem.save({
      seed: get().seed,
      tick: stats.tick,
      milestoneCount: stats.milestoneCount,
      population: stats.population,
      speciesCount: stats.speciesCount,
      moleculeCount: stats.moleculeCount,
    });
  },

  loadSavedState: () => SaveSystem.load(),

  hasSavedState: () => SaveSystem.hasSave(),

  clearSavedState: () => SaveSystem.clear(),

  restoreFromSave: () => {
    const save = SaveSystem.load();
    if (!save) return;
    const sim = new Simulation(DEFAULT_CONFIG, save.seed);

    // Fast-forward in batches to avoid blocking the UI thread
    const BATCH_SIZE = 500;
    let i = 0;

    const processBatch = () => {
      const end = Math.min(i + BATCH_SIZE, save.tick);
      while (i < end) {
        sim.update();
        i++;
      }

      if (i < save.tick) {
        // Yield to browser, then continue
        setTimeout(processBatch, 0);
      } else {
        // Restoration complete
        set({
          simulation: sim,
          seed: save.seed,
          showWelcome: false,
          tick: save.tick,
        });
        get().updateStats();
      }
    };

    processBatch();
  },
}));
