
import React from 'react';
import { formatPayouts } from '../lib/pokerUtils.ts';

interface PayoutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payouts: number[];
}

export const PayoutsModal: React.FC<PayoutsModalProps> = ({ isOpen, onClose, payouts }) => {
  if (!isOpen) return null;

  const formattedPayouts = formatPayouts(payouts);

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[#282c33] rounded-lg shadow-xl w-full max-w-xs text-white p-4 border border-gray-700"
        onClick={(e) => e.stopPropagation()} // Prevent modal close when clicking inside
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Payout Structure</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {formattedPayouts.length > 0 ? (
            <ul className="space-y-1">
              {formattedPayouts.map(({ position, prize }) => (
                <li key={position} className="flex justify-between text-base font-mono">
                  <span className="text-gray-300">{position}</span>
                  <span className="font-semibold">{prize}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">No payout information available.</p>
          )}
        </div>
      </div>
    </div>
  );
};