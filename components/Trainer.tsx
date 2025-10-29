import React, { useState } from 'react';
import type { AppData } from '../types.ts';
import { TrainerSimulator } from './TrainerSimulator.tsx';

interface TrainerProps {
    solutions: AppData[];
    onBack: () => void;
    loadNode: (nodeId: number) => Promise<void>;
    loadMultipleNodes: (nodeIds: number[]) => Promise<void>;
}

const tournamentPhases = [
    '100~60% left',
    '60~40% left',
    '40~20% left',
    'Near bubble',
    '3 tables',
    '2 tables',
    'Final table'
];

export const Trainer: React.FC<TrainerProps> = ({ solutions, onBack, loadNode }) => {
    const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

    // Tela de seleção de fase
    if (!selectedPhase) {
        return (
            <div className="flex flex-col h-screen bg-[#1a1d23]">
                {/* Header */}
                <div className="bg-[#282c33] border-b border-gray-700 p-4">
                    <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBack}
                                className="px-4 py-2 bg-[#2d3238] hover:bg-[#353a42] text-white rounded-lg transition-colors"
                            >
                                ← Voltar
                            </button>
                            <h1 className="text-2xl font-bold text-white">Trainer - Selecione a Fase do Torneio</h1>
                        </div>
                    </div>
                </div>

                {/* Seleção de fase */}
                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tournamentPhases.map(phase => {
                                const phaseSolutions = solutions.filter(s => s.tournamentPhase === phase);
                                if (phaseSolutions.length === 0) return null;

                                return (
                                    <button
                                        key={phase}
                                        onClick={() => setSelectedPhase(phase)}
                                        className="group bg-gradient-to-br from-[#2d3238] to-[#23272f] hover:from-[#353a42] hover:to-[#2d3238] rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-purple-400 shadow-lg"
                                    >
                                        <div className="space-y-4">
                                            <div className="flex justify-center">
                                                <div className="p-4 bg-purple-500/20 rounded-full group-hover:bg-purple-500/30 transition-colors duration-300">
                                                    <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            
                                            <h3 className="text-xl font-bold text-white text-center">
                                                {phase}
                                            </h3>
                                            
                                            <div className="text-center text-gray-400">
                                                {phaseSolutions.length} {phaseSolutions.length === 1 ? 'solução' : 'soluções'}
                                            </div>

                                            <div className="pt-2 text-purple-400 font-semibold text-sm text-center group-hover:translate-x-2 transition-transform duration-300">
                                                Selecionar →
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Se uma fase foi selecionada, mostra o simulador
    if (selectedPhase) {
        return (
            <TrainerSimulator 
                solutions={solutions}
                selectedPhase={selectedPhase}
                onBack={() => setSelectedPhase(null)}
                loadNode={loadNode}
            />
        );
    }

    // Nunca deve chegar aqui, mas retorna null por segurança
    return null;
};
