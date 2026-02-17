import React, { useState } from 'react';
import { useGameStore } from '../store';

export default function TimeControls() {
  const { isRunning, speed, startSimulation, pauseSimulation, setSpeed, skipTicks, simulation, saveState } = useGameStore();
  const [saveFlash, setSaveFlash] = useState(false);

  if (!simulation) return null;

  const speeds = [
    { label: '⏸', speed: 0, action: () => pauseSimulation() },
    { label: '▶', speed: 1, action: () => { setSpeed(1); startSimulation(); } },
    { label: '▶▶', speed: 5, action: () => { setSpeed(5); startSimulation(); } },
    { label: '▶▶▶', speed: 20, action: () => { setSpeed(20); startSimulation(); } },
    { label: '⏭', speed: 100, action: () => { setSpeed(100); startSimulation(); } },
  ];

  const handleSave = () => {
    const success = saveState();
    if (success) {
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 1200);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-black/60 z-20">
      <div className="flex gap-1">
        {speeds.map((s, i) => (
          <button
            key={i}
            onClick={s.action}
            className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
              (s.speed === 0 && !isRunning) || (s.speed === speed && isRunning)
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => skipTicks(10000)}
          className="px-2 py-1 rounded text-xs font-mono bg-gray-800 text-gray-400 hover:bg-gray-700 ml-2"
          title="Skip 10K ticks"
        >
          +10K
        </button>
        <button
          onClick={handleSave}
          className={`px-2 py-1 rounded text-xs font-mono ml-1 transition-colors ${
            saveFlash
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
          title="Save simulation"
        >
          {saveFlash ? '✓' : '💾'}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <ZoomIndicator />
        <VolumeControl />
        <MilestoneToggle />
      </div>
    </div>
  );
}

function ZoomIndicator() {
  return (
    <span className="text-gray-500 text-xs font-mono">
      🔬
    </span>
  );
}

function VolumeControl() {
  const { volume, setVolume } = useGameStore();
  return (
    <input
      type="range"
      min="0"
      max="100"
      value={volume * 100}
      onChange={(e) => setVolume(Number(e.target.value) / 100)}
      className="w-16 h-1 accent-cyan-500"
      title="Volume"
    />
  );
}

function MilestoneToggle() {
  const { showMilestones, setShowMilestones } = useGameStore();
  return (
    <button
      onClick={() => setShowMilestones(!showMilestones)}
      className={`px-2 py-1 rounded text-xs font-mono ${
        showMilestones ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      }`}
    >
      📜
    </button>
  );
}
