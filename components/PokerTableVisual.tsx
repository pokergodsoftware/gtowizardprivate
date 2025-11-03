import React from 'react';
import type { NodeData, SettingsData } from '../types.ts';
import { getPlayerPositions } from '../lib/pokerUtils.ts';
import { getTrainerAssetUrl } from '../src/config.ts';

// Versão 2.0 - Com fichas visuais

interface VillainAction {
    position: number;
    action: string; // 'Fold', 'Call', 'Raise X', 'Allin'
    amount?: number; // Valor da aposta (se aplicável)
    combo?: string; // Combo usado pelo vilão (ex: "AhKd")
}

interface PokerTableVisualProps {
    currentNode: NodeData;
    settings: SettingsData;
    bigBlind: number;
    displayMode: 'bb' | 'chips';
    onToggleDisplayMode?: () => void;
    solutionFileName?: string; // Nome da solução para determinar bounty inicial
    tournamentPhase?: string; // Fase do torneio
    raiserPosition?: number; // Posição do jogador que deu raise/shove (para vs Open/vs Shove)
    shoverPositions?: number[]; // Posições dos jogadores que deram shove (para vs Multiway shove)
    spotType?: string; // Tipo de spot (RFI, vs Open, vs Shove, Any, etc)
    villainActions?: VillainAction[]; // Histórico de ações dos vilões (para tipo Any)
}

export const PokerTableVisual: React.FC<PokerTableVisualProps> = ({
    currentNode,
    settings,
    bigBlind,
    displayMode,
    onToggleDisplayMode,
    solutionFileName,
    tournamentPhase,
    raiserPosition,
    shoverPositions,
    spotType,
    villainActions
}) => {
    // DEBUG: Log props
    console.log('🎨 PokerTableVisual - spotType:', spotType);
    console.log('🎨 PokerTableVisual - raiserPosition:', raiserPosition);
    
    // ========================================
    // ⚙️ CONFIGURAÇÃO DE POSICIONAMENTO DAS FICHAS DOS BLINDS
    // ========================================
    // 📍 As fichas são posicionadas radialmente em direção a cada jogador
    // 📐 FUNCIONA AUTOMATICAMENTE para qualquer número de jogadores (3-9)
    //    e qualquer posição do hero
    //
    // ⚠️ IMPORTANTE: Ajuste APENAS o radiusPercent
    //    NÃO use valores grandes - apenas 0.0 a 0.6
    //
    // VALORES SUGERIDOS:
    //    - 0.55 = Próximo ao jogador (borda interna da mesa)
    //    - 0.45 = Meio do caminho
    //    - 0.35 = Mais perto do centro
    //    - 0.25 = Bem perto do centro
    //
    const CHIPS_CONFIG = {
        radiusPercent: -2.2,  // 🎯 Ajuste AQUI (teste 0.45 a 0.60)
    };
    // ========================================
    
    const { stacks, bounties, blinds } = settings.handdata;
    const numPlayers = stacks.length;
    const positions = getPlayerPositions(numPlayers);
    
    // Posição do jogador atual (hero)
    const heroPosition = currentNode.player;
    
    // Identifica SB, BB e BTN
    const bbPosition = numPlayers - 1; // BB é sempre o último
    const sbPosition = numPlayers === 2 ? 0 : numPlayers - 2; // SB é penúltimo (ou BTN em HU)
    const btnPosition = numPlayers === 2 ? 0 : numPlayers - 3; // BTN é antes do SB
    const smallBlind = blinds.length > 1 ? Math.min(blinds[0], blinds[1]) : (blinds[0] / 2 || 0);
    
    // Pega o ante (terceiro elemento do array blinds)
    const ante = blinds.length > 2 ? blinds[2] : 0;
    
    // Calcula o pot total (SB + BB + antes de todos os jogadores)
    const totalPot = smallBlind + bigBlind + (ante * numPlayers);
    
    // Identifica jogadores que já foldaram (agiram antes do hero)
    // Em poker, a ação vai em ordem: 0, 1, 2, ..., heroPosition
    // Todos com index < heroPosition já agiram (e foldaram, já que o hero está agindo)
    const hasPlayerFolded = (index: number): boolean => {
        // Se é o hero, não foldou
        if (index === heroPosition) return false;
        
        // Jogadores antes do hero na ordem de ação foldaram
        // A ordem é circular, começa no 0 e vai até heroPosition
        if (index < heroPosition) return true;
        
        return false;
    };

    // Posições dos jogadores ao redor da mesa (em porcentagem)
    // ROTACIONA a mesa para que o hero sempre fique embaixo (centro inferior)
    const getPlayerPosition = (index: number, total: number): { top: string; left: string } => {
        // Calcula o offset para rotacionar a mesa
        // Hero deve ficar em 90 graus (embaixo, centro)
        const heroAngleOffset = (heroPosition / total) * 2 * Math.PI;
        
        // Ângulo base do jogador
        const baseAngle = (index / total) * 2 * Math.PI;
        
        // Ângulo rotacionado para colocar hero embaixo
        // 90 graus = Math.PI / 2 (posição inferior)
        // Subtrai para girar em sentido horário na tela
        const angle = baseAngle - heroAngleOffset + Math.PI / 2;
        
        // Raios da elipse (ajustados para a mesa)
        const radiusX = 42; // Horizontal
        const radiusY = 35; // Vertical
        
        const x = 50 + radiusX * Math.cos(angle);
        const y = 50 + radiusY * Math.sin(angle);
        
        return {
            top: `${y}%`,
            left: `${x}%`
        };
    };

    const formatStack = (stack: number, isBB: boolean = false, isSB: boolean = false, villainBet: number = 0): string => {
        // Desconta o ante do stack (todos pagaram ante)
        let effectiveStack = stack - ante;
        
        // Desconta os blinds se o jogador for BB ou SB
        if (isBB) {
            effectiveStack -= bigBlind;
        } else if (isSB) {
            effectiveStack -= smallBlind;
        }
        
        // Desconta a aposta do vilão (para tipo "Any")
        if (villainBet > 0) {
            effectiveStack -= villainBet;
        }
        
        // Garante que o stack nunca seja negativo
        effectiveStack = Math.max(0, effectiveStack);
        
        if (displayMode === 'bb') {
            const stackBB = bigBlind > 0 ? (effectiveStack / bigBlind).toFixed(1) : '0';
            return `${stackBB}bb`;
        }
        // Divide por 1000 quando exibir em fichas
        return (effectiveStack / 100).toLocaleString();
    };

    // Determina o bounty inicial baseado no nome da solução
    const getInitialBounty = (): number => {
        if (!solutionFileName) return 7.5; // Default
        
        const fileName = solutionFileName.toLowerCase();
        if (fileName.includes('speed32')) return 7.5;
        if (fileName.includes('speed50')) return 12.5;
        if (fileName.includes('speed108')) return 25;
        if (fileName.includes('speed20')) return 5;
        
        return 7.5; // Default
    };

    const formatBounty = (bounty: number): string => {
        const actualBounty = bounty / 2; // Bounty real em dólar
        
        if (displayMode === 'bb') {
            // Modo BB: exibir como multiplicador do bounty inicial
            const initialBounty = getInitialBounty();
            const multiplier = actualBounty / initialBounty;
            return `${multiplier.toFixed(1)}x`;
        }
        
        // Modo chips: exibir em dólar
        return `$${actualBounty.toFixed(2)}`;
    };

    // Determina qual imagem da mesa usar
    const tableImage = tournamentPhase === 'Final table' 
        ? getTrainerAssetUrl('final_table.png')
        : getTrainerAssetUrl('table.png');

    // Extrai e formata o nome do torneio a partir do nome do arquivo
    const getTournamentName = (): string => {
        if (!solutionFileName) return '';
        
        const fileName = solutionFileName.toLowerCase();
        
        // Extrai o tipo e valor do torneio
        if (fileName.includes('speed32')) return 'Speed Racer $32';
        if (fileName.includes('speed50')) return 'Speed Racer $50';
        if (fileName.includes('speed108')) return 'Speed Racer $108';
        if (fileName.includes('speed20')) return 'Speed Racer $20';
        if (fileName.includes('speed')) return 'Speed Racer';
        
        // Fallback: tenta extrair valor numérico
        const match = fileName.match(/\$?(\d+)/);
        if (match) {
            return `Tournament $${match[1]}`;
        }
        
        return 'Tournament';
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Payouts à ESQUERDA da mesa - centralizado no espaço vazio */}
            <div className="absolute left-[8%] top-1/2 transform -translate-y-1/2 z-40 bg-[#23272f] border border-purple-400 rounded-lg p-3.5 shadow-xl min-w-[212px] max-w-[300px]">
                <h3 className="text-white font-bold text-sm mb-2">💰 Payouts</h3>
                
                <div className="space-y-1.5 max-h-[225px] overflow-y-auto">
                    {settings.eqmodel?.structure?.prizes ? (
                        Object.entries(settings.eqmodel.structure.prizes)
                            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                            .map(([position, prize], index) => (
                                <div 
                                    key={position}
                                    className="flex items-center justify-between bg-[#2d3238] px-2.5 py-1.5 rounded"
                                >
                                    <span className="text-gray-300 font-semibold text-sm">
                                        {index === 0 ? '1º-2º' : `${position}º`}
                                    </span>
                                    <span className="text-green-400 font-bold text-sm">
                                        ${(prize as number).toFixed(2)}
                                    </span>
                                </div>
                            ))
                    ) : (
                        <div className="text-gray-400 text-sm text-center py-1.5">
                            Payouts N/A
                        </div>
                    )}
                </div>
            </div>
            
            {/* Mesa de poker */}
            <div className="relative w-full max-w-3xl aspect-[16/10]">
                <img 
                    src={tableImage} 
                    alt="Poker Table" 
                    className="w-full h-full object-contain"
                />
                
                {/* Nome do Torneio - Canto superior ESQUERDO da mesa */}
                {getTournamentName() && (
                    <div className="absolute top-3 left-3 z-40 bg-[#23272f] border-2 border-yellow-400 rounded-lg px-4 py-2 shadow-lg">
                        <div className="text-yellow-400 font-bold text-[15px] whitespace-nowrap">
                            {getTournamentName()}
                        </div>
                    </div>
                )}
                
                {/* Stage - Canto superior DIREITO da mesa */}
                {tournamentPhase && (
                    <div className="absolute top-3 right-3 z-40 bg-[#23272f] border-2 border-teal-400 rounded-lg px-4 py-2 shadow-lg">
                        <div className="text-teal-400 font-bold text-[15px] whitespace-nowrap">
                            Stage: {tournamentPhase}
                        </div>
                    </div>
                )}
                
                {/* Players ao redor da mesa */}
                {stacks.map((stack, index) => {
                    const pos = getPlayerPosition(index, numPlayers);
                    const isCurrentPlayer = index === currentNode.player;
                    const position = positions[index];
                    const bounty = bounties?.[index] || 0;
                    const isBB = index === bbPosition;
                    const isSB = index === sbPosition;
                    const isBTN = index === btnPosition;
                    const isRaiser = spotType === 'vs Open' && raiserPosition !== undefined && index === raiserPosition;
                    const isShover = spotType === 'vs Shove' && raiserPosition !== undefined && index === raiserPosition;
                    const isMultiwayShover = spotType === 'vs Multiway shove' && shoverPositions !== undefined && shoverPositions.includes(index);
                    
                    // Para tipo "Any", busca ação do vilão no histórico
                    const villainAction = spotType === 'Any' && villainActions ? villainActions.find(va => va.position === index) : undefined;
                    
                    // Detecta jogadores com stack negativo ou zero (all-in automático)
                    const isAutoAllin = stack <= 0;
                    
                    // DEBUG
                    if (index === raiserPosition && raiserPosition !== undefined) {
                        console.log(`🎨 Position ${index}: isRaiser=${isRaiser}, isShover=${isShover}, spotType=${spotType}`);
                    }
                    
                    // Calcula o ângulo do jogador (reutilizar para fichas)
                    const heroAngleOffset = (heroPosition / numPlayers) * 2 * Math.PI;
                    const baseAngle = (index / numPlayers) * 2 * Math.PI;
                    const playerAngle = baseAngle - heroAngleOffset + Math.PI / 2;
                    
                    // Calcula aposta do jogador (blinds, raise ou shove)
                    let playerBet = 0;
                    
                    // Para tipo "Any", usa o amount da ação do vilão
                    if (villainAction && villainAction.amount !== undefined) {
                        playerBet = villainAction.amount;
                        
                        // Se for um Call e o jogador é SB ou BB, adicionar o blind inicial
                        if (villainAction.action === 'Call') {
                            if (isSB) {
                                playerBet += smallBlind; // SB call = 0.5 BB (blind) + 0.5 BB (call) = 1 BB
                            } else if (isBB) {
                                playerBet += bigBlind; // BB call = 1 BB (blind) + call adicional
                            }
                        }
                    }
                    // Raiser e Shovers sempre mostram aposta (independente do pot)
                    else if (isRaiser) {
                        playerBet = bigBlind * 2;
                    } else if (isShover || isMultiwayShover) {
                        playerBet = stack;
                    } else if (isAutoAllin) {
                        // Jogador com stack negativo/zero: all-in automático (paga apenas o ante)
                        playerBet = ante;
                    } else if (totalPot > 0) {
                        // Blinds só aparecem se há pot
                        if (isBB) {
                            playerBet = bigBlind;
                        } else if (isSB) {
                            playerBet = smallBlind;
                        }
                    }
                    
                    return (
                        <div
                            key={index}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                            style={{ top: pos.top, left: pos.left }}
                        >
                            {/* Aposta do jogador com fichas visuais (se houver) - na direção radial do jogador */}
                            {playerBet > 0 && (() => {
                                // USA O MESMO ÂNGULO DO JOGADOR
                                // Raios da mesa (mesmos usados para posicionar jogadores)
                                const tableRadiusX = 42; // Raio horizontal da elipse
                                const tableRadiusY = 35; // Raio vertical da elipse
                                
                                // Distância das fichas usando configuração
                                const betRadiusX = tableRadiusX * CHIPS_CONFIG.radiusPercent;
                                const betRadiusY = tableRadiusY * CHIPS_CONFIG.radiusPercent;
                                
                                // Posição absoluta partindo do centro (50%, 50%)
                                const centerX = 50;
                                const centerY = 50;
                                const betX = centerX + betRadiusX * Math.cos(playerAngle);
                                const betY = centerY + betRadiusY * Math.sin(playerAngle);
                                
                                const hasFolded = hasPlayerFolded(index);
                                // SB e BB SEMPRE têm fichas visíveis (opacity 100%)
                                const isSB = index === sbPosition;
                                const isBB = index === bbPosition;
                                // Raiser, shovers, auto all-ins, SB, BB e vilões com ações (tipo Any) não têm transparência nas fichas
                                // Exceto se a ação for Fold
                                const hasVillainFolded = villainAction && villainAction.action === 'Fold';
                                const hasVillainAction = villainAction && villainAction.action !== 'Fold';
                                const shouldShowChipsTransparent = (hasFolded || hasVillainFolded) && !isRaiser && !isShover && !isMultiwayShover && !isAutoAllin && !hasVillainAction && !isSB && !isBB;
                                
                                return (
                                    <div 
                                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 transition-opacity duration-300 ${
                                            shouldShowChipsTransparent ? 'opacity-40' : 'opacity-100'
                                        }`}
                                        style={{ 
                                            top: `${betY}%`, 
                                            left: `${betX}%`,
                                            pointerEvents: 'none' // Não interfere com cliques
                                        }}
                                    >
                                        {/* Fichas empilhadas */}
                                    <div className="flex items-center gap-0.5">
                                        {/* Ficha roxa */}
                                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 border border-purple-300 shadow-md flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                        </div>
                                        
                                        {/* Ficha amarela (se aposta >= BB) */}
                                        {playerBet >= bigBlind && (
                                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border border-yellow-300 shadow-md flex items-center justify-center -ml-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                            </div>
                                        )}
                                        
                                        {/* Fichas extras para raise (2BB) - mais amarelas empilhadas */}
                                        {isRaiser && (
                                            <>
                                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border border-yellow-300 shadow-md flex items-center justify-center -ml-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                                </div>
                                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border border-orange-300 shadow-md flex items-center justify-center -ml-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                                </div>
                                            </>
                                        )}
                                        
                                        {/* Fichas extras para shove (all-in) - pilha com cores variadas */}
                                        {(isShover || isMultiwayShover) && (
                                            <>
                                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border border-yellow-300 shadow-md flex items-center justify-center -ml-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                                </div>
                                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-400 to-red-600 border border-red-300 shadow-md flex items-center justify-center -ml-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                                </div>
                                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border border-purple-300 shadow-md flex items-center justify-center -ml-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    
                                    {/* Valor da aposta */}
                                    <div className={`bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded border ${
                                        isRaiser ? 'border-orange-500/70' : (isShover || isMultiwayShover) ? 'border-purple-500/70' : isAutoAllin ? 'border-green-500/70' : 'border-yellow-500/50'
                                    }`}>
                                        <span className={`font-bold text-[10px] whitespace-nowrap ${
                                            isRaiser ? 'text-orange-400' : (isShover || isMultiwayShover) ? 'text-purple-400' : isAutoAllin ? 'text-green-400' : 'text-yellow-400'
                                        }`}>
                                            {displayMode === 'bb' 
                                                ? isBB && playerBet === bigBlind
                                                    ? '1 BB'  // BB mostra "1 BB" sem decimais
                                                    : `${(playerBet / bigBlind).toFixed(1)} BB`
                                                : (playerBet / 100).toLocaleString()
                                            }
                                        </span>
                                    </div>
                                </div>
                                );
                            })()}
                            
                            {/* Card do jogador - Novo design compacto */}
                            {/* NÃO mostrar card para o hero (jogador atual) */}
                            {!isCurrentPlayer && (() => {
                                const hasFolded = hasPlayerFolded(index);
                                // SB e BB SEMPRE são visíveis (opacity 100%)
                                const isSB = index === sbPosition;
                                const isBB = index === bbPosition;
                                // Raiser, shovers, auto all-ins, SB, BB e vilões com ações (tipo Any) não têm transparência
                                // Exceto se a ação for Fold
                                const hasVillainFolded = villainAction && villainAction.action === 'Fold';
                                const hasVillainAction = villainAction && villainAction.action !== 'Fold';
                                const shouldShowTransparent = (hasFolded || hasVillainFolded) && !isRaiser && !isShover && !isMultiwayShover && !isAutoAllin && !hasVillainAction && !isSB && !isBB;
                                
                                return (
                                <div className={`relative flex flex-col items-center transition-opacity duration-300 ${
                                    shouldShowTransparent ? 'opacity-80' : 'opacity-100'
                                }`}>
                                    {/* Badges no canto superior direito */}
                                    <div className="absolute top-10 right-0 z-30">
                                        {/* Badge RAISE para o raiser */}
                                        {isRaiser && (
                                            <div className="bg-orange-500/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[8px] font-bold">
                                                RAISE
                                            </div>
                                        )}
                                        
                                        {/* Badge SHOVE para shovers (single ou multiway) */}
                                        {(isShover || isMultiwayShover) && (
                                            <div className="bg-purple-500/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[8px] font-bold">
                                                SHOVE
                                            </div>
                                        )}
                                        
                                        {/* Badge CALL para jogadores com stack negativo/zero (all-in automático) */}
                                        {isAutoAllin && (
                                            <div className="bg-green-500/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[8px] font-bold">
                                                CALL
                                            </div>
                                        )}
                                        
                                        {/* Badge FOLD para jogadores que foldaram */}
                                        {hasFolded && !isRaiser && !isShover && !isMultiwayShover && !isAutoAllin && !villainAction && (
                                            <div className="bg-red-500/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[8px] font-bold">
                                                FOLD
                                            </div>
                                        )}
                                        
                                        {/* Badges para tipo "Any" - mostra ação do vilão */}
                                        {villainAction && (() => {
                                            const action = villainAction.action;
                                            
                                            if (action === 'Fold') {
                                                return (
                                                    <div className="bg-red-500/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[8px] font-bold">
                                                        FOLD
                                                    </div>
                                                );
                                            } else if (action === 'Call') {
                                                return (
                                                    <div className="bg-green-500/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[8px] font-bold">
                                                        CALL
                                                    </div>
                                                );
                                            } else if (action === 'Check') {
                                                return (
                                                    <div className="bg-gray-500/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[8px] font-bold">
                                                        CHECK
                                                    </div>
                                                );
                                            } else if (action === 'Allin') {
                                                return (
                                                    <div className="bg-purple-500/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[8px] font-bold">
                                                        ALLIN
                                                    </div>
                                                );
                                            } else if (action.startsWith('Raise')) {
                                                return (
                                                    <div className="bg-orange-500/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[8px] font-bold">
                                                        RAISE
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                    
                                    {/* Bounty acima (se houver) */}
                                    {bounty > 0 && (
                                        <div className="mb-0.5 bg-gradient-to-r from-yellow-500 to-yellow-600 px-2 py-0.5 rounded-full border border-yellow-400 shadow-md">
                                            <span className="text-white font-bold text-[10px]">
                                                {formatBounty(bounty)}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Avatar (quando foldado) ou Cartas (quando na ação ou já agiu) - atrás do card */}
                                    {(() => {
                                        // Jogador foldou se: hasFolded E não é raiser/shover/autoallin E (não tem villainAction OU villainAction é Fold)
                                        const playerHasFolded = hasFolded && !isRaiser && !isShover && !isMultiwayShover && !isAutoAllin && (!villainAction || villainAction.action === 'Fold');
                                        
                                        if (playerHasFolded) {
                                            // Mostra avatar quando foldado
                                            const avatarNumber = (index % 8) + 1;
                                            return (
                                                <div className="relative z-0 -mb-5">
                                                    <img 
                                                        src={getTrainerAssetUrl(`avatar${avatarNumber}.png`)}
                                                        alt={position}
                                                        className="w-20 h-20 rounded-full"
                                                    />
                                                </div>
                                            );
                                        } else {
                                            // Mostra cartas quando não foldou (na ação ou já agiu)
                                            return (
                                                <div className="relative z-0 -mb-3">
                                                    <img 
                                                        src={getTrainerAssetUrl('cards.png')}
                                                        alt="cards"
                                                        className="w-16"
                                                    />
                                                </div>
                                            );
                                        }
                                    })()}

                                    {/* Card principal - na frente do avatar */}
                                    <div className="relative z-10 rounded-xl overflow-hidden ring-1 ring-gray-600 min-w-[60px]">
                                        {/* Símbolo do Button (D) - posicionado ao lado do card */}
                                        {isBTN && (
                                            <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full bg-white border border-gray-700 shadow-md flex items-center justify-center z-10">
                                                <span className="text-gray-900 font-black text-[9px]">D</span>
                                            </div>
                                        )}
                                        
                                        {/* Card estilo herói - posição e stack */}
                                        <div className="bg-black/90 backdrop-blur-sm rounded-b-lg px-2.5 py-1 border border-gray-600">
                                            <div className="text-center">
                                                <div className="text-white font-bold text-[10px] mb-0.5">{position}</div>
                                                <button
                                                    onClick={onToggleDisplayMode}
                                                    className="text-blue-400 font-bold text-xs cursor-pointer hover:text-blue-300 transition-colors"
                                                >
                                                    {(isShover || isMultiwayShover || isAutoAllin)
                                                        ? (displayMode === 'bb' ? '0bb' : '0')
                                                        : formatStack(stack, isBB, isSB, villainAction?.amount || 0)
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                );
                            })()}
                        </div>
                    );
                })}

                {/* Pot no centro com fichas (se houver) */}
                {totalPot > 0 && (
                    <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="flex flex-col items-center gap-0.5">
                            {/* Fichas empilhadas no centro */}
                            <div className="flex items-center justify-center gap-0.5">
                                {/* Ficha roxa */}
                                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 border border-purple-300 shadow-md flex items-center justify-center">
                                    <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
                                </div>
                                {/* Ficha amarela */}
                                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border border-yellow-200 shadow-md flex items-center justify-center -ml-1">
                                    <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
                                </div>
                                {/* Ficha verde */}
                                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-green-500 to-green-700 border border-green-300 shadow-md flex items-center justify-center -ml-1">
                                    <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
                                </div>
                            </div>
                            
                            {/* Valor do pot */}
                            <div className="bg-black/90 backdrop-blur-sm border border-yellow-500 rounded px-3 py-1 shadow-md">
                                <div className="text-center">
                                    <div className="text-yellow-400 font-bold text-xs">
                                        Total Pot : {displayMode === 'bb' 
                                            ? `${(totalPot / bigBlind).toFixed(1)} BB`
                                            : (totalPot / 100).toLocaleString()
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
