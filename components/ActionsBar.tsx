
import React from 'react';
import type { NodeData, HandData, SettingsData } from '../types.ts';
import { getActionColor, getActionName, getHandTypeMaxCombos } from '../lib/pokerUtils.ts';

interface ActionsBarProps {
  currentNode: NodeData;
  bigBlind: number;
  settings: SettingsData;
  displayMode: 'bb' | 'chips';
}

export const ActionsBar: React.FC<ActionsBarProps> = ({ currentNode, bigBlind, settings, displayMode }) => {
  const playerStack = settings.handdata.stacks[currentNode.player];
  const numPlayers = settings.handdata.stacks.length;

  // Step 1: Calculate the raw combo count for each action, correctly weighted.
  const actionStatsRaw = currentNode.actions.map((action, index) => {
    let comboCount = 0;
    // Iterate over hands to correctly weight them by their combo counts
    // FIX: Cast `handDataValue` to the `HandData` type to resolve type errors.
    Object.entries(currentNode.hands).forEach(([handName, handDataValue]) => {
      const handData = handDataValue as HandData;
      const freq = handData.played[index];
      if (freq > 0) {
        const maxCombos = getHandTypeMaxCombos(handName);
        // handData.weight is a multiplier (0-1) for the max combos
        const actualCombos = handData.weight * maxCombos;
        comboCount += freq * actualCombos;
      }
    });

    const name = getActionName(action, bigBlind, playerStack, displayMode, settings.handdata.stacks);
    const color = getActionColor(name, currentNode.player, numPlayers);

    return {
      action,
      comboCount,
      color,
      name,
    };
  });

  // Step 2: Calculate the true total combos by summing the combos of all actions.
  const totalActionCombos = actionStatsRaw.reduce((acc, stat) => acc + stat.comboCount, 0);

  // Step 3: Calculate the final frequency based on the correct total and filter out negligible actions.
  const actionStats = actionStatsRaw.map(stat => ({
    ...stat,
    frequency: totalActionCombos > 0 ? (stat.comboCount / totalActionCombos) * 100 : 0,
  })).filter(stat => stat.frequency > 0.01);


  return (
    <div className="flex flex-col space-y-1">
      {/* Action Blocks */}
      <div className="flex h-20 rounded-md overflow-hidden text-white">
        {actionStats.map(({ name, frequency, color }, index) => (
          <div
            key={index}
            className={`${color} p-2 flex flex-col justify-between border-r border-black/30 last:border-r-0 flex-1`}
          >
            <div className="font-bold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
              {name}
            </div>
            <div className="flex justify-between items-end" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
              <span className="text-3xl font-bold leading-none">
                {frequency.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="flex h-1.5 rounded-sm overflow-hidden">
        {actionStats.map(({ frequency, color }, index) => (
          <div
            key={index}
            className={`${color}`}
            style={{ width: `${frequency}%` }}
          />
        ))}
      </div>
    </div>
  );
};
