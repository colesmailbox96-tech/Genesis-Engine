import React, { useEffect } from 'react';
import { useGameStore } from './store';
import GameCanvas from './ui/GameCanvas';
import WelcomeScreen from './ui/WelcomeScreen';
import HUD from './ui/HUD';
import TimeControls from './ui/TimeControls';
import InspectorPanel from './ui/InspectorPanel';
import MilestoneLog from './ui/MilestoneLog';
import MiniMap from './ui/MiniMap';
import StatsDashboard from './ui/StatsDashboard';
import ResearchPanel from './ui/ResearchPanel';

export default function App() {
  const { simulation, showStats, setShowStats, showResearch, setShowResearch } = useGameStore();

  // F10 for stats dashboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10') {
        e.preventDefault();
        setShowStats(!showStats);
      }
      if (e.key === 'F9') {
        e.preventDefault();
        setShowResearch(!showResearch);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showStats, setShowStats, showResearch, setShowResearch]);

  // Auto-save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      useGameStore.getState().saveState();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <div className="w-full h-full relative bg-[#0a0a12] overflow-hidden">
      <WelcomeScreen />

      {simulation && (
        <>
          <GameCanvas />
          <HUD />
          <MiniMap />
          <InspectorPanel />
          <MilestoneLog />
          <TimeControls />
          <StatsDashboard />
          <ResearchPanel />
        </>
      )}
    </div>
  );
}
