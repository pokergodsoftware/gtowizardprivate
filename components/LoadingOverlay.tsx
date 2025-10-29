import React from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, message = 'Loading...' }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#282c33] rounded-lg p-6 shadow-2xl border border-gray-700 flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-gray-600 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-teal-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
        
        {/* Message */}
        <p className="text-gray-200 font-medium text-lg">{message}</p>
      </div>
    </div>
  );
};
