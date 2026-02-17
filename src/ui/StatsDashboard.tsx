import React from 'react';
import { useGameStore } from '../store';

export default function StatsDashboard() {
  const { showStats, setShowStats, simulation } = useGameStore();

  if (!showStats || !simulation) return null;

  const snapshots = simulation.metricsCollector.snapshots;
  const lastSnapshot = snapshots[snapshots.length - 1];

  return (
    <div className="absolute inset-4 bg-gray-900/95 border border-gray-700 rounded-lg z-40 overflow-y-auto p-4 font-mono text-xs">
      <div className="flex justify-between items-center mb-4">
        <span className="text-cyan-400 text-sm">📊 Statistics</span>
        <button onClick={() => setShowStats(false)} className="text-gray-500 hover:text-white">✕</button>
      </div>

      {lastSnapshot && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Population" value={lastSnapshot.population} />
          <StatCard label="Species" value={lastSnapshot.speciesCount} />
          <StatCard label="Total Energy" value={Math.round(lastSnapshot.totalEnergy)} />
          <StatCard label="Avg Genome" value={lastSnapshot.avgGenomeLength.toFixed(1)} />
          <StatCard label="Avg Neural Nodes" value={lastSnapshot.avgNeuralNodes.toFixed(1)} />
          <StatCard label="Total Born" value={lastSnapshot.births} />
          <StatCard label="Total Died" value={lastSnapshot.deaths} />
          <StatCard label="Molecules" value={simulation.molecules.length} />
          <StatCard label="Protocells" value={simulation.protocells.length} />
          <StatCard label="O₂ Level" value={(simulation.ecosystem.oxygenLevel * 100).toFixed(1) + '%'} />
          <StatCard label="Trophic Levels" value={simulation.ecosystem.trophicLevelCount} />
          <StatCard label="Food Web Links" value={simulation.foodWeb.links.length} />
          <StatCard label="Diversity Index" value={lastSnapshot.diversityIndex.toFixed(3)} />
          <StatCard label="Avg Chain Length" value={lastSnapshot.avgChainLength.toFixed(1)} />
          <StatCard label="Energy Flux" value={lastSnapshot.energyFlux.toFixed(1)} />
          <StatCard label="Extinction Rate" value={lastSnapshot.extinctionRate} />
        </div>
      )}

      <div className="mt-4 text-gray-500">
        <p>Snapshots collected: {snapshots.length}</p>
        <p>Press F10 to toggle this panel</p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-800 rounded p-2">
      <div className="text-gray-500 text-[10px]">{label}</div>
      <div className="text-white text-sm">{value}</div>
    </div>
  );
}
