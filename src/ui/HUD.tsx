import React, { useMemo } from 'react';
import { useGameStore } from '../store';

export default function HUD() {
  const { tick, population, speciesCount, moleculeCount, simulation, fps, tps } = useGameStore();

  if (!simulation) return null;

  const orgs = simulation.organismManager.organisms;
  const energyPct = useMemo(() => {
    if (population <= 0) return 0;
    let totalEnergy = 0;
    let totalCapacity = 0;
    for (const o of orgs) {
      totalEnergy += o.energy;
      totalCapacity += o.phenotype.energyCapacity;
    }
    return Math.round(totalEnergy / Math.max(1, totalCapacity) * 100);
  }, [orgs, population]);

  const fpsColor = fps >= 50 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-black/60 text-xs font-mono z-20 pointer-events-none">
      <span className="text-gray-400">Epoch: <span className="text-white">{tick.toLocaleString()}</span></span>
      <span className="text-gray-400">Pop: <span className="text-cyan-400">{population}</span></span>
      <span className="text-gray-400">Species: <span className="text-green-400">{speciesCount}</span></span>
      <span className="text-gray-400">Mol: <span className="text-amber-400">{moleculeCount}</span></span>
      <span className="text-gray-400">⚡ <span className="text-yellow-400">{energyPct}%</span></span>
      <span className="text-gray-400"><span className={fpsColor}>{fps}</span> fps · <span className="text-gray-300">{tps}</span> tps</span>
    </div>
  );
}
