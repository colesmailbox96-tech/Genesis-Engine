import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../store';
import { Renderer } from '../rendering/Renderer';
import { GameLoop } from '../engine/GameLoop';
import { InputManager } from '../input/InputManager';
import { Vector2 } from '../utils/Vector2';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer>(new Renderer());
  const gameLoopRef = useRef<GameLoop | null>(null);
  const inputManagerRef = useRef<InputManager | null>(null);

  const { simulation } = useGameStore();

  const handleEntityClick = useCallback((worldX: number, worldY: number) => {
    const sim = useGameStore.getState().simulation;
    if (!sim) return;

    const clickPos = new Vector2(worldX, worldY);

    // Check organisms first
    const nearbyOrgs = sim.organismManager.getNearby(worldX, worldY, 10);
    if (nearbyOrgs.length > 0) {
      let closest = nearbyOrgs[0];
      let closestDist = Infinity;
      for (const org of nearbyOrgs) {
        const d = org.position.distanceSqTo(clickPos);
        if (d < closestDist) { closestDist = d; closest = org; }
      }
      useGameStore.getState().selectEntity(closest, 'organism');
      return;
    }

    // Check protocells
    for (const cell of sim.protocells) {
      if (cell.position.distanceTo(clickPos) < cell.size + 5) {
        useGameStore.getState().selectEntity(cell, 'protocell');
        return;
      }
    }

    // Check molecules
    const nearbyMols = sim.moleculeSpatialHash.query(worldX, worldY, 5);
    if (nearbyMols.length > 0) {
      useGameStore.getState().selectEntity(nearbyMols[0], 'molecule');
      return;
    }

    // Deselect
    useGameStore.getState().selectEntity(null, null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !simulation) return;

    const ctx = canvas.getContext('2d')!;
    const renderer = rendererRef.current;

    // Input
    const input = new InputManager(renderer.camera);
    input.attach(canvas, handleEntityClick);
    inputManagerRef.current = input;

    // Center camera on world
    renderer.camera.setTarget(simulation.config.worldSize / 2, simulation.config.worldSize / 2);

    // Game loop
    const loop = new GameLoop(
      simulation.config.tickRate,
      (_dt: number) => {
        const state = useGameStore.getState();
        if (state.isRunning && state.simulation) {
          state.simulation.update();
        }
      },
      (_interpolation: number) => {
        const state = useGameStore.getState();
        if (!state.simulation) return;

        // Resize canvas
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        }

        renderer.render(
          ctx,
          state.simulation.config,
          state.simulation.tick,
          state.simulation.environmentMap,
          state.simulation.chemicalField,
          state.simulation.molecules,
          state.simulation.protocells,
          state.simulation.organismManager.organisms,
          state.simulation.energySources,
        );

        // Update store stats periodically
        if (state.simulation.tick % 30 === 0) {
          state.updateStats();
        }
      }
    );

    gameLoopRef.current = loop;
    loop.start();

    return () => {
      loop.stop();
      input.detach();
    };
  }, [simulation, handleEntityClick]);

  // Update speed
  useEffect(() => {
    const { speed } = useGameStore.getState();
    if (gameLoopRef.current) {
      gameLoopRef.current.setSpeed(speed);
    }
  });

  // Subscribe to speed changes
  useEffect(() => {
    const unsub = useGameStore.subscribe(
      (state) => {
        if (gameLoopRef.current) {
          gameLoopRef.current.setSpeed(state.speed);
        }
      }
    );
    return unsub;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
}
