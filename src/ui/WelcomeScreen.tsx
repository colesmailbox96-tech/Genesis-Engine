import React, { useState } from 'react';
import { useGameStore } from '../store';

export default function WelcomeScreen() {
  const { showWelcome, initSimulation, startSimulation, seed } = useGameStore();
  const [seedInput, setSeedInput] = useState(seed.toString());

  if (!showWelcome) return null;

  const handleStart = () => {
    const s = parseInt(seedInput) || Math.floor(Math.random() * 999999);
    initSimulation(s);
    startSimulation();
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
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded font-mono text-sm transition-colors"
        >
          ▶ Begin Simulation
        </button>
        <p className="text-gray-500 text-xs text-center mt-4 font-mono">
          Watch life emerge from chemistry.
        </p>
      </div>
    </div>
  );
}
