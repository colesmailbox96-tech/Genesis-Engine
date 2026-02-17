import React from 'react';
import { useGameStore } from '../store';
import { Organism } from '../organisms/Organism';
import { Molecule } from '../chemistry/Molecule';
import { Protocell } from '../proto/Protocell';

export default function InspectorPanel() {
  const { selectedEntity, selectedEntityType, showInspector, selectEntity } = useGameStore();

  if (!showInspector || !selectedEntity) return null;

  return (
    <div className="absolute right-0 top-8 bottom-10 w-64 bg-gray-900/90 border-l border-gray-700 overflow-y-auto z-30 p-3 font-mono text-xs">
      <div className="flex justify-between items-center mb-3">
        <span className="text-cyan-400 text-sm">Inspector</span>
        <button
          onClick={() => selectEntity(null, null)}
          className="text-gray-500 hover:text-white"
        >✕</button>
      </div>

      {selectedEntityType === 'organism' && <OrganismInspector org={selectedEntity as Organism} />}
      {selectedEntityType === 'molecule' && <MoleculeInspector mol={selectedEntity as Molecule} />}
      {selectedEntityType === 'protocell' && <ProtocellInspector cell={selectedEntity as Protocell} />}
    </div>
  );
}

function OrganismInspector({ org }: { org: Organism }) {
  const nodeCount = org.genome.neuralGenome.nodeGenes.length;
  const connCount = org.genome.neuralGenome.connectionGenes.filter(c => c.enabled).length;
  const energyPct = Math.round((org.energy / org.phenotype.energyCapacity) * 100);
  const intPct = Math.round(org.integrity * 100);

  return (
    <div className="space-y-2 text-gray-300">
      <div className="text-white">Organism #{org.id}</div>
      <div>Species: <span className="text-cyan-400">{org.species}</span></div>
      <div>Generation: {org.generation}</div>
      <div>Age: {org.age.toLocaleString()} ticks</div>
      <div className="border-t border-gray-700 pt-2 mt-2">
        <div>Metabolism: <span className="text-green-400">{org.phenotype.metabolismType}</span></div>
        <div>Body: {org.phenotype.bodyShape}</div>
        <div>Size: {org.phenotype.bodyRadius.toFixed(1)} units</div>
      </div>
      <div className="border-t border-gray-700 pt-2 mt-2">
        <BarStat label="Energy" value={energyPct} color="yellow" />
        <BarStat label="Integrity" value={intPct} color="green" />
      </div>
      <div className="border-t border-gray-700 pt-2 mt-2">
        <div>Sensors: {org.phenotype.sensors.map(s => s.type).join(', ')}</div>
        <div>Actuators: {org.phenotype.actuators.map(a => a.type).join(', ')}</div>
      </div>
      <div className="border-t border-gray-700 pt-2 mt-2">
        <div>Brain: {nodeCount} nodes, {connCount} conns</div>
        <div>Hidden nodes: {org.genome.neuralGenome.nodeGenes.filter(n => n.type === 'hidden').length}</div>
      </div>
      <div className="border-t border-gray-700 pt-2 mt-2">
        <div>Offspring: {org.offspring}</div>
        <div>Kills: {org.killCount}</div>
        {org.phenotype.toxicity > 0 && <div>Toxicity: {(org.phenotype.toxicity * 100).toFixed(0)}%</div>}
        {org.phenotype.shellThickness > 0 && <div>Shell: {(org.phenotype.shellThickness * 100).toFixed(0)}%</div>}
        {org.phenotype.camouflageLevel > 0 && <div>Camo: {(org.phenotype.camouflageLevel * 100).toFixed(0)}%</div>}
      </div>
    </div>
  );
}

function MoleculeInspector({ mol }: { mol: Molecule }) {
  const role = mol.role !== 'unknown' ? mol.role : mol.inferRole();
  const roleColors: Record<string, string> = {
    food: 'text-green-400',
    waste: 'text-gray-500',
    catalyst: 'text-amber-400',
    membrane: 'text-blue-400',
    genome_segment: 'text-purple-400',
    toxin: 'text-red-400',
    unknown: 'text-gray-400',
  };

  return (
    <div className="space-y-2 text-gray-300">
      <div className="text-white">Molecule #{mol.id}</div>
      <div>Formula: <span className="text-cyan-400">{mol.getFormula()}</span></div>
      <div>Role: <span className={roleColors[role] ?? 'text-gray-400'}>{role}</span></div>
      <div>Mass: {mol.mass.toFixed(0)}</div>
      <div>Energy: {mol.energy.toFixed(3)}</div>
      <div>Age: {mol.age.toLocaleString()} ticks</div>
      <div>Half-life: ~{mol.halfLife.toLocaleString()} ticks</div>
      <div>Atoms: {mol.atoms.length}</div>
      <div>Bonds: {mol.bonds.length}</div>
      <div>Polarity: {mol.polarity.toFixed(2)}</div>
      <div>Chain: {mol.getChainLength()}</div>
      {mol.catalyticSites.length > 0 && (
        <div className="text-amber-400">Catalytic: {mol.catalyticSites.length} sites</div>
      )}
      {mol.formation && (
        <div className="border-t border-gray-700 pt-2 mt-2">
          <div className="text-cyan-400 text-[10px]">Formation Pathway</div>
          <div>From: {mol.formation.parentFormulas.join(' + ')}</div>
          <div>Reaction: {mol.formation.reactionType}</div>
          <div>Zone: {mol.formation.zoneName}</div>
          {mol.formation.catalystFormula && <div>Catalyst: {mol.formation.catalystFormula}</div>}
          <div>At tick: {mol.formation.tick.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}

function ProtocellInspector({ cell }: { cell: Protocell }) {
  return (
    <div className="space-y-2 text-gray-300">
      <div className="text-white">Protocell #{cell.id}</div>
      <div>Age: {cell.age.toLocaleString()} ticks</div>
      <div>Size: {cell.size.toFixed(1)}</div>
      <div>Interior: {cell.interior.length} molecules</div>
      <div>Membrane lipids: {cell.membrane.lipidCount}</div>
      <div>Integrity: {(cell.integrity * 100).toFixed(0)}%</div>
      <div>Osmotic pressure: {(cell.membrane.osmoticPressure * 100).toFixed(0)}%</div>
      <div>Capacity: {cell.interior.length}/{cell.membrane.maxCapacity}</div>
      <div>Energy: {cell.energy.toFixed(2)}</div>
      <div>Replicators: {cell.replicators.length}</div>
      <div>Complexity: {cell.complexityScore}</div>
      <div>Metabolism rate: {cell.metabolismRate.toFixed(4)}</div>
      {cell.parentId && <div className="text-cyan-400">Has parent (from division)</div>}
    </div>
  );
}

function BarStat({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClass = color === 'yellow' ? 'bg-yellow-500' : color === 'green' ? 'bg-green-500' : 'bg-cyan-500';
  return (
    <div className="mb-1">
      <div className="flex justify-between">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5">
        <div className={`${colorClass} h-1.5 rounded-full`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}
