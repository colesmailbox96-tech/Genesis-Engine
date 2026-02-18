import React, { useState } from 'react';
import { useGameStore } from '../store';
import { SimConfig, DEFAULT_CONFIG, applyPreset, PresetName } from '../engine/Config';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}

function getDecimalPlaces(step: number): number {
  // Guard against non-positive steps
  if (step <= 0) return 0;

  let dynamicPlaces = 0;
  if (step < 1) {
    // Number of decimal digits implied by the step's magnitude
    dynamicPlaces = Math.ceil(-Math.log10(step));
  }

  let places: number;
  if (step < 0.01) {
    // Preserve at least 4 decimals for very small steps, but allow more if needed
    places = Math.max(4, dynamicPlaces);
  } else if (step < 1) {
    // Preserve at least 2 decimals for fractional steps
    places = Math.max(2, dynamicPlaces);
  } else {
    places = 0;
  }

  // Avoid excessively long numbers in the UI
  return Math.min(8, places);
}

function Slider({ label, value, min, max, step, unit = '', onChange }: SliderProps) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
        <span>{label}</span>
        <span className="text-white">{value.toFixed(getDecimalPlaces(step))}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 accent-cyan-400"
      />
    </div>
  );
}

interface LabPanelProps {
  onClose: () => void;
}

export default function LabPanel({ onClose }: LabPanelProps) {
  const { initSimulation, startSimulation, seed } = useGameStore();
  const [config, setConfig] = useState<SimConfig>(DEFAULT_CONFIG);

  const update = (key: keyof SimConfig, value: number) =>
    setConfig(prev => ({ ...prev, [key]: value }));

  const applyAndRestart = () => {
    initSimulation(seed, config);
    startSimulation();
    onClose();
  };

  const handlePreset = (preset: PresetName) => {
    setConfig(applyPreset(DEFAULT_CONFIG, preset));
  };

  const presets: { label: string; key: PresetName; icon: string }[] = [
    { label: 'Primordial Soup', key: 'primordial_soup', icon: '🍲' },
    { label: 'Hydrothermal Vent', key: 'hydrothermal_vent', icon: '🌋' },
    { label: 'Ice World', key: 'ice_world', icon: '🧊' },
    { label: 'Tidal Flats', key: 'tidal_flats', icon: '🌊' },
    { label: 'Storm Planet', key: 'storm_planet', icon: '⚡' },
  ];

  return (
    <div className="absolute inset-4 bg-gray-900/95 border border-gray-700 rounded-lg z-40 overflow-y-auto p-4 font-mono text-xs">
      <div className="flex justify-between items-center mb-4">
        <span className="text-cyan-400 text-sm">🔬 Lab Mode</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
      </div>

      {/* Presets */}
      <div className="mb-4">
        <div className="text-gray-500 text-[10px] mb-2 uppercase tracking-wider">Presets</div>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <button
              key={p.key}
              onClick={() => handlePreset(p.key)}
              className="px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-gray-300 hover:text-white transition-colors"
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <div>
          <div className="text-gray-500 text-[10px] mb-2 uppercase tracking-wider">Environment</div>
          <Slider label="UV Intensity" value={config.uvIntensityMax} min={0} max={20} step={0.5} onChange={v => update('uvIntensityMax', v)} />
          <Slider label="Vent Count" value={config.ventCount} min={0} max={20} step={1} onChange={v => update('ventCount', v)} />
          <Slider label="Vent Power" value={config.ventPower} min={1} max={50} step={1} onChange={v => update('ventPower', v)} />
          <Slider label="Wet/Dry Cycle" value={config.wetDryCyclePeriod} min={500} max={20000} step={500} unit=" ticks" onChange={v => update('wetDryCyclePeriod', v)} />
          <Slider label="Diffusion Rate" value={config.diffusionRate} min={0.01} max={0.5} step={0.01} onChange={v => update('diffusionRate', v)} />
        </div>
        <div>
          <div className="text-gray-500 text-[10px] mb-2 uppercase tracking-wider">Chemistry</div>
          <Slider label="Lightning Prob" value={config.lightningProbability} min={0} max={0.05} step={0.001} onChange={v => update('lightningProbability', v)} />
          <Slider label="Lightning Energy" value={config.lightningEnergy} min={10} max={500} step={10} onChange={v => update('lightningEnergy', v)} />
          <Slider label="Redox Gradient" value={config.redoxGradientStrength} min={0} max={1} step={0.05} onChange={v => update('redoxGradientStrength', v)} />
          <Slider label="Autocatalysis Boost" value={config.autocatalysisBoost} min={1} max={10} step={0.5} onChange={v => update('autocatalysisBoost', v)} />
          <Slider label="Molecule Decay" value={config.moleculeDecayRate} min={0.00001} max={0.001} step={0.00001} onChange={v => update('moleculeDecayRate', v)} />
        </div>
        <div>
          <div className="text-gray-500 text-[10px] mb-2 uppercase tracking-wider">Biology</div>
          <Slider label="Mutation Rate" value={config.mutationRateBase} min={0.001} max={0.1} step={0.001} onChange={v => update('mutationRateBase', v)} />
          <Slider label="Max Population" value={config.maxPopulation} min={100} max={10000} step={100} onChange={v => update('maxPopulation', v)} />
          <Slider label="Metabolism Rate" value={config.basalMetabolicRate} min={0.001} max={0.1} step={0.001} onChange={v => update('basalMetabolicRate', v)} />
        </div>
        <div>
          <div className="text-gray-500 text-[10px] mb-2 uppercase tracking-wider">Catastrophes</div>
          <Slider label="Volcanic Rate" value={config.volcanicEruptionRate} min={0} max={0.00001} step={0.000001} onChange={v => update('volcanicEruptionRate', v)} />
          <Slider label="Asteroid Rate" value={config.asteroidImpactRate} min={0} max={0.000001} step={0.0000001} onChange={v => update('asteroidImpactRate', v)} />
          <Slider label="Storm Prob" value={config.electricalStormProbability} min={0} max={0.01} step={0.0001} onChange={v => update('electricalStormProbability', v)} />
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={applyAndRestart}
          className="flex-1 bg-cyan-700 hover:bg-cyan-600 text-white py-2 rounded transition-colors"
        >
          ▶ Apply & Restart
        </button>
        <button
          onClick={() => setConfig(DEFAULT_CONFIG)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
        >
          Reset
        </button>
      </div>

      <p className="text-gray-600 text-[10px] mt-2">Changes take effect on restart.</p>
    </div>
  );
}
