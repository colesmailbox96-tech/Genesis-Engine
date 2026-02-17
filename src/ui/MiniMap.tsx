import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../store';

export default function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { simulation, tick } = useGameStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !simulation) return;

    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;
    const ws = simulation.config.worldSize;

    // Background
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, w, h);

    // Energy sources
    for (const src of simulation.energySources) {
      const sx = (src.position.x / ws) * w;
      const sy = (src.position.y / ws) * h;
      ctx.fillStyle = src.type === 'thermal_vent' ? '#ff6b35' : '#66aaff';
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Organisms
    for (const org of simulation.organismManager.organisms) {
      const sx = (org.position.x / ws) * w;
      const sy = (org.position.y / ws) * h;
      const c = org.phenotype.bodyColor;
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.fillRect(sx - 0.5, sy - 0.5, 1, 1);
    }
  }, [simulation, tick]);

  return (
    <canvas
      ref={canvasRef}
      width={80}
      height={80}
      className="absolute top-10 right-2 border border-gray-700 rounded z-20 opacity-80"
    />
  );
}
