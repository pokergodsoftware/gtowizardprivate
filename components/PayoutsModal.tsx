
import React, { useState, useRef, useEffect } from 'react';
import { formatPayouts } from '../lib/pokerUtils.ts';

interface PayoutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payouts: number[];
}

export const PayoutsModal: React.FC<PayoutsModalProps> = ({ isOpen, onClose, payouts }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset position when modal opens
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && modalRef.current) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep modal within viewport bounds
      const maxX = window.innerWidth - modalRef.current.offsetWidth;
      const maxY = window.innerHeight - modalRef.current.offsetHeight;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  const formattedPayouts = formatPayouts(payouts);

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        className="absolute bg-[#282c33] rounded-lg shadow-xl w-full max-w-xs text-white border border-gray-700"
        style={{
          left: position.x || '50%',
          top: position.y || '50%',
          transform: position.x === 0 && position.y === 0 ? 'translate(-50%, -50%)' : 'none',
          cursor: isDragging ? 'grabbing' : 'default'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="flex justify-between items-center mb-4 p-4 pb-0 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <h2 className="text-lg font-bold flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
            Payout Structure
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto pr-2 px-4 pb-4">
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