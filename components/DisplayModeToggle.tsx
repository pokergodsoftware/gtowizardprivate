import React from 'react';

interface DisplayModeToggleProps {
  displayMode: 'bb' | 'chips';
  onToggle: () => void;
}

export const DisplayModeToggle: React.FC<DisplayModeToggleProps> = ({ displayMode, onToggle }) => {
  return (
    <div className="inline-flex p-0.5 bg-[#1e2227] rounded-md" role="group">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={displayMode === 'bb'}
        disabled={displayMode === 'bb'}
        className={`px-3 py-1 text-xs font-bold rounded-l-md transition-colors ${
          displayMode === 'bb' 
            ? 'bg-teal-500 text-white cursor-default' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 cursor-pointer'
        }`}
      >
        bb
      </button>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={displayMode === 'chips'}
        disabled={displayMode === 'chips'}
        className={`px-3 py-1 text-xs font-bold rounded-r-md transition-colors ${
          displayMode === 'chips' 
            ? 'bg-teal-500 text-white cursor-default' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 cursor-pointer'
        }`}
      >
        chips
      </button>
    </div>
  );
};