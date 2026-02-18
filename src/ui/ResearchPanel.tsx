import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../store';
import { ExportSystem } from '../data/ExportSystem';
import { MetricsSnapshot } from '../data/MetricsCollector';

// ── Sparkline chart drawn on a small canvas ─────────────────────────────────

interface SparklineProps {
  data: number[];
  color: string;
  label: string;
  width?: number;
  height?: number;
}

function Sparkline({ data, color, label, width = 180, height = 40 }: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Shade under the line
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = color + '22';
    ctx.fill();
  }, [data, color, width, height]);

  const latest = data[data.length - 1] ?? 0;

  return (
    <div className="bg-gray-800 rounded p-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-gray-400 text-[10px]">{label}</span>
        <span className="text-white text-[10px] font-mono">
          {Number.isInteger(latest) ? latest.toLocaleString() : latest.toFixed(2)}
        </span>
      </div>
      <canvas ref={canvasRef} width={width} height={height} className="w-full" />
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function tail<T>(arr: T[], n: number): T[] {
  return arr.length > n ? arr.slice(arr.length - n) : arr;
}

function snapshotSeries(snapshots: MetricsSnapshot[], key: keyof MetricsSnapshot, n = 80): number[] {
  return tail(snapshots, n).map(s => s[key] as number);
}

// ── Main panel ───────────────────────────────────────────────────────────────

export default function ResearchPanel() {
  const { showResearch, setShowResearch, simulation } = useGameStore();

  const handleExportCSV = useCallback(() => {
    if (!simulation) return;
    ExportSystem.downloadCSV(simulation.metricsCollector);
  }, [simulation]);

  const handleExportJSONL = useCallback(() => {
    if (!simulation) return;
    ExportSystem.downloadJSONL(simulation.dataLogger);
  }, [simulation]);

  const handleExportPhylogeny = useCallback(() => {
    if (!simulation) return;
    ExportSystem.downloadPhylogeny(simulation.phylogeneticTree);
  }, [simulation]);

  const handleExportFoodWeb = useCallback(() => {
    if (!simulation) return;
    ExportSystem.downloadFoodWeb(simulation.foodWeb);
  }, [simulation]);

  if (!showResearch || !simulation) return null;

  const snapshots = simulation.metricsCollector.snapshots;
  const discoveries = simulation.cultureTracker.getAll();

  const popSeries = snapshotSeries(snapshots, 'population');
  const spSeries = snapshotSeries(snapshots, 'speciesCount');
  const energySeries = snapshotSeries(snapshots, 'totalEnergy');
  const diversitySeries = snapshotSeries(snapshots, 'diversityIndex');

  return (
    <div className="absolute inset-4 bg-gray-900/95 border border-gray-700 rounded-lg z-40 overflow-y-auto p-4 font-mono text-xs">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-cyan-400 text-sm">🔬 Research Panel</span>
        <button onClick={() => setShowResearch(false)} className="text-gray-500 hover:text-white">
          ✕
        </button>
      </div>

      {/* Population Trends */}
      <div className="mb-4">
        <p className="text-gray-500 text-[10px] mb-2 uppercase tracking-widest">Population Trends</p>
        {snapshots.length < 2 ? (
          <p className="text-gray-600 text-[10px]">Collecting data… check back after a few ticks.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Sparkline data={popSeries} color="#22d3ee" label="Population" />
            <Sparkline data={spSeries} color="#4ade80" label="Species" />
            <Sparkline data={energySeries} color="#facc15" label="Total Energy" />
            <Sparkline data={diversitySeries} color="#a78bfa" label="Diversity Index" />
          </div>
        )}
      </div>

      {/* Data Export */}
      <div className="mb-4">
        <p className="text-gray-500 text-[10px] mb-2 uppercase tracking-widest">Export Data</p>
        <div className="grid grid-cols-2 gap-2">
          <ExportButton label="📊 Metrics CSV" onClick={handleExportCSV} disabled={snapshots.length === 0} />
          <ExportButton label="📋 Event Log JSONL" onClick={handleExportJSONL} />
          <ExportButton label="🌳 Phylogeny (.nwk)" onClick={handleExportPhylogeny} disabled={simulation.phylogeneticTree.nodes.size === 0} />
          <ExportButton label="🕸️ Food Web (.dot)" onClick={handleExportFoodWeb} disabled={simulation.foodWeb.links.length === 0} />
        </div>
        <p className="text-gray-600 text-[10px] mt-1">
          {snapshots.length} metric snapshots · {simulation.phylogeneticTree.nodes.size.toLocaleString()} phylo nodes · {simulation.foodWeb.links.length} food-web links
        </p>
      </div>

      {/* Discovery Log */}
      <div>
        <p className="text-gray-500 text-[10px] mb-2 uppercase tracking-widest">Discovery Log</p>
        {discoveries.length === 0 ? (
          <p className="text-gray-600 text-[10px]">No cultural discoveries recorded yet.</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {[...discoveries].reverse().map((d, i) => (
              <div key={i} className="border-b border-gray-800 pb-1">
                <span className="text-gray-500">Tick {d.tick.toLocaleString()} · </span>
                <span className="text-cyan-400">{d.type}</span>
                <span className="text-gray-400"> — {d.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-gray-600">
        Press <kbd className="bg-gray-800 px-1 rounded">F9</kbd> to toggle this panel
      </div>
    </div>
  );
}

function ExportButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 hover:text-white py-1.5 px-2 rounded text-[10px] text-left transition-colors"
    >
      {label}
    </button>
  );
}
