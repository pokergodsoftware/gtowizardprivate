import React from 'react';

interface HomePageProps {
    onNavigate: (page: 'solutions' | 'trainer') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1a1d23] via-[#23272f] to-[#2d3238]">
            <div className="text-center space-y-12 p-8">
                {/* Logo/Title */}
                <div className="space-y-4">
                    <h1 className="text-6xl font-bold text-white tracking-tight">
                        GTO Wizard
                        <span className="text-teal-400"> Private</span>
                    </h1>
                    <p className="text-xl text-gray-400">
                        Aprimore sua estratégia de poker com soluções GTO e treinamento
                    </p>
                </div>

                {/* Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {/* Solutions Card */}
                    <button
                        onClick={() => onNavigate('solutions')}
                        className="group relative overflow-hidden bg-[#2d3238] hover:bg-[#353a42] rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-teal-400"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="relative z-10 space-y-4">
                            <div className="flex justify-center">
                                <div className="p-4 bg-teal-500/20 rounded-full group-hover:bg-teal-500/30 transition-colors duration-300">
                                    <svg className="w-16 h-16 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                            </div>
                            
                            <h2 className="text-3xl font-bold text-white">
                                Solutions
                            </h2>
                            
                            <p className="text-gray-400 text-lg">
                                Explore soluções GTO completas para diferentes cenários de torneio
                            </p>
                            
                            <div className="pt-4">
                                <span className="inline-flex items-center text-teal-400 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                    Acessar biblioteca
                                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </button>

                    {/* Trainer Card */}
                    <button
                        onClick={() => onNavigate('trainer')}
                        className="group relative overflow-hidden bg-[#2d3238] hover:bg-[#353a42] rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-purple-400"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="relative z-10 space-y-4">
                            <div className="flex justify-center">
                                <div className="p-4 bg-purple-500/20 rounded-full group-hover:bg-purple-500/30 transition-colors duration-300">
                                    <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                    </svg>
                                </div>
                            </div>
                            
                            <h2 className="text-3xl font-bold text-white">
                                Trainer
                            </h2>
                            
                            <p className="text-gray-400 text-lg">
                                Pratique suas decisões e aprenda com feedback instantâneo
                            </p>
                            
                            <div className="pt-4">
                                <span className="inline-flex items-center text-purple-400 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                    Começar treino
                                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Footer Info */}
                <div className="pt-8 text-gray-500 text-sm">
                    <p>Versão 2.0 • Lazy Loading • UI Moderna</p>
                </div>
            </div>
        </div>
    );
};
