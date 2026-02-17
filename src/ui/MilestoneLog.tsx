import React from 'react';
import { useGameStore } from '../store';

const MILESTONE_ICONS: Record<string, string> = {
  AMINO_ACID: '🧪',
  FATTY_ACID: '🧪',
  NUCLEOTIDE: '🧪',
  POLYMER: '🧪',
  CATALYST: '⚗️',
  PROTOCELL: '🫧',
  REPLICATOR: '⚗️',
  PROTOCELL_DIVISION: '🫧',
  METABOLISM: '⚗️',
  HEREDITY: '🧬',
  FIRST_ORGANISM: '🔬',
  CHEMOTAXIS: '🔬',
  PREDATION: '💀',
  PHOTOSYNTHESIS: '🌿',
  SPECIATION: '🧬',
  DEFENSE: '🛡️',
  NEURAL_HIDDEN: '🧠',
  FOOD_WEB: '🕸️',
  ECOSYSTEM: '🌍',
  MASS_EXTINCTION: '💀',
  RECOVERY: '🌱',
  SYMBIOSIS: '🤝',
  MULTICELLULAR: '🧬',
  TOOL_USE: '🔧',
  COOPERATION: '🤝',
  COMMUNICATION: '📡',
  CULTURE: '🎭',
  INTELLIGENCE: '✨',
};

export default function MilestoneLog() {
  const { showMilestones, milestones, setShowMilestones } = useGameStore();

  if (!showMilestones) return null;

  return (
    <div className="absolute left-0 top-8 bottom-10 w-72 bg-gray-900/90 border-r border-gray-700 overflow-y-auto z-30 p-3 font-mono text-xs">
      <div className="flex justify-between items-center mb-3">
        <span className="text-cyan-400 text-sm">📜 Milestones</span>
        <button
          onClick={() => setShowMilestones(false)}
          className="text-gray-500 hover:text-white"
        >✕</button>
      </div>

      {milestones.length === 0 ? (
        <p className="text-gray-500">No milestones yet. Watch and wait...</p>
      ) : (
        <div className="space-y-3">
          {[...milestones].reverse().map((m, i) => (
            <div key={i} className="border-b border-gray-800 pb-2">
              <div className="text-gray-500">
                {MILESTONE_ICONS[m.type] ?? '✨'} Tick {m.tick.toLocaleString()}
              </div>
              <div className="text-yellow-400">{m.type}</div>
              <div className="text-gray-400">{m.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
