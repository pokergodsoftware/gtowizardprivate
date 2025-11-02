import React from 'react';
import { APP_VERSION } from '../src/version.ts';

interface VersionBadgeProps {
    position?: 'bottom-left' | 'bottom-right' | 'top-right';
}

export const VersionBadge: React.FC<VersionBadgeProps> = ({ position = 'bottom-right' }) => {
    const positionClasses = {
        'bottom-left': 'bottom-3 left-3',
        'bottom-right': 'bottom-3 right-3',
        'top-right': 'top-3 right-3',
    };

    return (
        <div 
            className={`fixed ${positionClasses[position]} z-50 px-2 py-1 bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded text-gray-400 text-[10px] font-mono`}
            title={`Versão do aplicativo`}
        >
            v{APP_VERSION}
        </div>
    );
};
