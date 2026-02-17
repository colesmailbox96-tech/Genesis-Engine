import React, { useState } from 'react';
import { useGameStore } from '../store';
import { SaveSystem } from '../data/SaveSystem';

export default function WelcomeScreen() {
  const { showWelcome, initSimulation, startSimulation, seed, restoreFromSave, clearSavedState } = useGameStore();
  const [seedInput, setSeedInput] = useState(seed.toString());
  const [isRestoring, setIsRestoring] = useState(false);

  if (!showWelcome) return null;

  const savedState = SaveSystem.load();

  const handleStart = () => {
    const s = parseInt(seedInput) || Math.floor(Math.random() * 999999);
    initSimulation(s);
    startSimulation();
  };

  const handleRestore = () => {
    setIsRestoring(true);
    // Use setTimeout to let the UI update before the blocking restore
    setTimeout(() => {
      restoreFromSave();
      startSimulation();
      setIsRestoring(false);
    }, 50);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-cyan-400 mb-2 text-center font-mono">
          ⚗️ Genesis Engine
        </h1>
        <p className="text-gray-400 text-sm text-center mb-6 font-mono">
          Origin of Life Simulator
        </p>

        {savedState && !isRestoring && (
          <div className="mb-4 p-3 bg-gray-800 border border-cyan-800 rounded">
            <p className="text-cyan-400 text-xs font-mono mb-1">💾 Saved simulation found</p>
            <p className="text-gray-400 text-xs font-mono">
              Seed: {savedState.seed} · Epoch: {savedState.tick.toLocaleString()} · Pop: {savedState.population}
            </p>
            <p className="text-gray-500 text-xs font-mono">
              Saved: {SaveSystem.formatTimestamp(savedState.timestamp)}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleRestore}
                className="flex-1 bg-cyan-700 hover:bg-cyan-600 text-white py-2 rounded font-mono text-xs transition-colors"
              >
                ▶ Resume
              </button>
              <button
                onClick={clearSavedState}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded font-mono text-xs transition-colors"
                title="Delete saved state"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {isRestoring && (
          <div className="mb-4 p-3 bg-gray-800 border border-cyan-800 rounded text-center">
            <p className="text-cyan-400 text-sm font-mono animate-pulse">
              Restoring simulation… ({savedState?.tick.toLocaleString()} ticks)
            </p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-gray-400 text-xs mb-1 font-mono">World Seed</label>
          <input
            type="text"
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
            placeholder="Enter seed number"
          />
        </div>
        <button
          onClick={handleStart}
          disabled={isRestoring}
          className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white py-3 rounded font-mono text-sm transition-colors"
        >
          ▶ Begin New Simulation
        </button>
        <p className="text-gray-500 text-xs text-center mt-4 font-mono">
          Watch life emerge from chemistry.
        </p>
      </div>
    </div>
  );
}
