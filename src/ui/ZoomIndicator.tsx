import React from 'react';

export default function ZoomIndicator({ level }: { level: string }) {
  return (
    <span className="text-gray-500 text-xs font-mono">
      🔬 {level}
    </span>
  );
}
