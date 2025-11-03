import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FileUpload } from './components/FileUploadScreen.tsx';
import { SolutionsLibrary } from './components/SolutionsLibrary.tsx';
import { HomePage } from './components/HomePage.tsx';
import { Trainer } from './components/Trainer.tsx';
import { Header } from './components/Header.tsx';
import { RangeGrid } from './components/RangeGrid.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { LoadingOverlay } from './components/LoadingOverlay.tsx';
import { VersionBadge } from './components/VersionBadge.tsx';
import { getResourceUrl } from './config.ts';
import { decodeUrlState, updateUrl, createUrlStateFromSolution, findSolutionByPath } from './lib/urlUtils.ts';
import { ERROR_MESSAGES, AppError, ErrorType, getUserMessage, retryFetch } from './lib/errorMessages.ts';
import { appCache, CACHE_KEYS, CACHE_DURATION } from './lib/cache.ts';
import type { AppData, NodeData, EquityData, SettingsData, SolutionMetadata } from './types.ts';

/**
 * Gera um ID determinístico baseado no path
 * Isso garante que a mesma solução sempre tenha o mesmo ID
 */
function generateDeterministicId(path: string): string {
    // Usar o path como base para o ID
    // Remove caracteres especiais e mantém apenas alphanumericos
    const cleanPath = path.replace(/[^a-zA-Z0-9]/g, '-');
    return `solution-${cleanPath}`;
}


// Main Application Component
const App: React.FC = () => {
    // --- State Management ---
    const [currentPage, setCurrentPage] = useState<'home' | 'solutions' | 'trainer'>('home');
    const [solutions, setSolutions] = useState<AppData[]>([]);
    const solutionsRef = useRef<AppData[]>([]); // Ref para acesso síncrono ao estado mais recente
    const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingNode, setIsLoadingNode] = useState(false);
    const [isRestoringFromUrl, setIsRestoringFromUrl] = useState(false); // Flag para restauração de URL
    const [error, setError] = useState<string | null>(null);
    
    // Manter ref sincronizado com state
    useEffect(() => {
        solutionsRef.current = solutions;
    }, [solutions]);

    // Viewer-specific state - consolidado para reduzir re-renders
    const [viewerState, setViewerState] = useState({
        currentNodeId: 0,
        selectedHand: null as string | null,
        displayMode: 'bb' as 'bb' | 'chips',
    });
    
    // Flag para controlar se já restauramos o estado da URL
    const [hasRestoredFromUrl, setHasRestoredFromUrl] = useState(false);
    
    // Verificar se há parâmetros na URL no carregamento inicial
    const hasUrlParams = useMemo(() => {
        const urlState = decodeUrlState();
        return !!(urlState.solutionPath || urlState.page === 'trainer');
    }, []); // Executar apenas uma vez
    
    // Helpers para atualizar viewerState
    const setCurrentNodeId = useCallback((nodeId: number) => {
        setViewerState(prev => ({ ...prev, currentNodeId: nodeId }));
    }, []);
    
    const setSelectedHand = useCallback((hand: string | null) => {
        setViewerState(prev => ({ ...prev, selectedHand: hand }));
    }, []);
    
    const setDisplayMode = useCallback((mode: 'bb' | 'chips') => {
        setViewerState(prev => ({ ...prev, displayMode: mode }));
    }, []);

    // Extrair valores para compatibilidade
    const { currentNodeId, selectedHand, displayMode } = viewerState;

    // --- Data Parsing and Loading ---

    const parseHrcFolder = async (files: FileList | File[], fileName: string, tournamentPhase: string): Promise<AppData> => {
        const fileArray = Array.from(files);

        const settingsFile = fileArray.find(f => f.name.endsWith('settings.json') || f.webkitRelativePath.endsWith('settings.json'));
        const equityFile = fileArray.find(f => f.name.endsWith('equity.json') || f.webkitRelativePath.endsWith('equity.json'));
        const nodeFiles = fileArray.filter(f => (f.name.includes('nodes/') || f.webkitRelativePath.includes('nodes/')) && f.name.endsWith('.json'));

        // Specific error messages for each missing file
        if (!settingsFile) {
            throw new AppError(ERROR_MESSAGES.MISSING_SETTINGS, ErrorType.FILE);
        }
        if (!equityFile) {
            throw new AppError(ERROR_MESSAGES.MISSING_EQUITY, ErrorType.FILE);
        }
        if (nodeFiles.length === 0) {
            throw new AppError(ERROR_MESSAGES.MISSING_NODES, ErrorType.FILE);
        }

        try {
            const settings: SettingsData = JSON.parse(await settingsFile.text());
            const equity: EquityData = JSON.parse(await equityFile.text());

            const nodes = new Map<number, NodeData>();
            for (const file of nodeFiles) {
                const nodeId = parseInt(file.name.replace('.json', '').split('/').pop() || '0', 10);
                const nodeData: NodeData = JSON.parse(await file.text());
                nodes.set(nodeId, nodeData);
            }

            return {
                id: uuidv4(),
                fileName,
                tournamentPhase,
                settings,
                equity,
                nodes
            };
        } catch (err) {
            if (err instanceof SyntaxError) {
                throw new AppError(ERROR_MESSAGES.INVALID_JSON('arquivo de solução'), ErrorType.PARSE, err);
            }
            throw err;
        }
    };

    const handleFileChange = useCallback(async (files: FileList, tournamentPhase: string) => {
        setIsLoading(true);
        setError(null);
        try {
            if (files.length === 0) return;
            // Heuristic to get folder name: find the common base path.
            const firstPath = files[0].webkitRelativePath;
            const folderName = firstPath.substring(0, firstPath.indexOf('/'));

            const newSolution = await parseHrcFolder(files, folderName, tournamentPhase);
            setSolutions(prev => [...prev, newSolution]);
        } catch (err) {
            const userMessage = getUserMessage(err);
            setError(userMessage);
            
            // Log only in dev
            if ((import.meta as any).env?.DEV) {
                console.error("Error processing uploaded files:", err);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Carregar apenas metadados das soluções (lazy loading)
    const loadSolutionsMetadata = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        // AbortController para cancelar requisições se o componente desmontar
        const abortController = new AbortController();
        
        try {
            const metadataRes = await retryFetch(
                getResourceUrl('solutions-metadata.json'),
                { signal: abortController.signal }
            );
            
            if (!metadataRes.ok) {
                if (metadataRes.status === 404) {
                    // Not an error - just no solutions yet
                    setSolutions([]);
                    setIsLoading(false);
                    return;
                }
                throw new AppError(
                    ERROR_MESSAGES.METADATA_LOAD_FAILED,
                    ErrorType.NETWORK
                );
            }
            
            const metadata: SolutionMetadata[] = await metadataRes.json();

            if (!Array.isArray(metadata)) {
                throw new AppError(
                    ERROR_MESSAGES.METADATA_INVALID,
                    ErrorType.PARSE
                );
            }

            // Carregar apenas settings e equity (não os nodes)
            const solutionPromises = metadata.map(async (meta) => {
                const { path: basePath, fileName, tournamentPhase } = meta;

                if (!basePath || !fileName || !tournamentPhase) {
                    if ((import.meta as any).env?.DEV) {
                        console.warn("Skipping invalid solution entry in metadata:", meta);
                    }
                    return null;
                }

                try {
                    const settingsRes = await retryFetch(
                        getResourceUrl(`${basePath}/settings.json`),
                        { signal: abortController.signal }
                    );
                    if (!settingsRes.ok) {
                        throw new AppError(
                            ERROR_MESSAGES.INVALID_JSON(`settings.json for ${fileName}`),
                            ErrorType.NOT_FOUND
                        );
                    }
                    const settings: SettingsData = await settingsRes.json();

                    const equityRes = await retryFetch(
                        getResourceUrl(`${basePath}/equity.json`),
                        { signal: abortController.signal }
                    );
                    if (!equityRes.ok) {
                        throw new AppError(
                            ERROR_MESSAGES.INVALID_JSON(`equity.json for ${fileName}`),
                            ErrorType.NOT_FOUND
                        );
                    }
                    const equity: EquityData = await equityRes.json();
                    
                    // Criar solução SEM nodes (serão carregados sob demanda)
                    // IMPORTANTE: Usar ID determinístico baseado no path
                    const solutionId = generateDeterministicId(basePath);
                    
                    if ((import.meta as any).env?.DEV) {
                        console.log(`✅ Loaded solution: ${fileName} with ID: ${solutionId}`);
                    }
                    
                    return {
                        id: solutionId,
                        fileName,
                        tournamentPhase,
                        settings,
                        equity,
                        nodes: new Map<number, NodeData>(), // Vazio inicialmente
                        path: basePath, // Guardar caminho para lazy loading
                    };
                } catch (e) {
                    // Ignorar erros de abort
                    if (e instanceof Error && e.name === 'AbortError') {
                        return null;
                    }
                    
                    if ((import.meta as any).env?.DEV) {
                        console.error(`Error loading solution "${fileName}":`, e);
                    }
                    return null;
                }
            });

            const loadedSolutions = (await Promise.all(solutionPromises)).filter(s => s !== null) as AppData[];

            setSolutions(loadedSolutions);

        } catch (err) {
            // Ignorar erros de abort
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }
            
            const userMessage = getUserMessage(err);
            setError(userMessage);
            
            if ((import.meta as any).env?.DEV) {
                console.error("Error loading solutions metadata:", err);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        loadSolutionsMetadata();
    }, [loadSolutionsMetadata]);

    // Carregar nodes sob demanda quando uma solução é selecionada
    const loadNodesForSolution = useCallback(async (
        solutionId: string, 
        nodeIdsToLoad?: number[],
        signal?: AbortSignal
    ): Promise<AppData | null> => {
        if ((import.meta as any).env?.DEV) {
            console.log('🔍 loadNodesForSolution called with:', { solutionId, nodeIdsToLoad });
            console.log('📦 Available solutions from ref:', solutionsRef.current.map(s => ({ id: s.id, fileName: s.fileName })));
        }
        
        // Usar ref para acesso síncrono ao estado mais recente
        const solutionToLoad = solutionsRef.current.find(s => s.id === solutionId);
        
        if ((import.meta as any).env?.DEV) {
            console.log('🎯 Found solution:', solutionToLoad ? solutionToLoad.fileName : 'NOT FOUND');
        }

        if (!solutionToLoad) {
            const errorMsg = ERROR_MESSAGES.SOLUTION_NOT_FOUND(solutionId);
            setError(errorMsg);
            
            if ((import.meta as any).env?.DEV) {
                console.error(`❌ ${errorMsg}`, { requestedId: solutionId });
            }
            return null;
        }

        if (!solutionToLoad.path) {
            setError(ERROR_MESSAGES.SOLUTION_NO_PATH);
            
            if ((import.meta as any).env?.DEV) {
                console.error('Solution has no path');
            }
            return null;
        }

        // Define quais nodes carregar
        const nodesToLoad = nodeIdsToLoad || [0];
        
        // Filtra apenas nodes que ainda não foram carregados
        const missingNodes = nodesToLoad.filter(id => !solutionToLoad!.nodes.has(id));
        
        if (missingNodes.length === 0) {
            return solutionToLoad;
        }

        try {
            // Cria um novo Map com os nodes existentes
            const nodes = new Map(solutionToLoad.nodes);
            
            // Carrega os nodes faltantes com retry e cache
            await Promise.all(missingNodes.map(async (id: number) => {
                try {
                    // Verificar cache primeiro
                    const cacheKey = CACHE_KEYS.NODE(solutionId, id);
                    const cachedNode = appCache.get<NodeData>(cacheKey);
                    
                    if (cachedNode) {
                        nodes.set(id, cachedNode);
                        return;
                    }
                    
                    // Se não está em cache, buscar
                    const nodeRes = await retryFetch(
                        getResourceUrl(`${solutionToLoad!.path}/nodes/${id}.json`),
                        { signal }
                    );
                    if (!nodeRes.ok) {
                        throw new AppError(
                            ERROR_MESSAGES.NODE_NOT_FOUND(id),
                            ErrorType.NOT_FOUND
                        );
                    }
                    const nodeData: NodeData = await nodeRes.json();
                    
                    // Salvar em cache
                    appCache.set(cacheKey, nodeData, CACHE_DURATION.LONG);
                    nodes.set(id, nodeData);
                } catch (e) {
                    // Ignorar erros de abort
                    if (e instanceof Error && e.name === 'AbortError') {
                        return;
                    }
                    
                    if ((import.meta as any).env?.DEV) {
                        console.error(`Error loading node ${id}:`, e);
                    }
                    throw e;
                }
            }));

            if (nodes.size === solutionToLoad.nodes.size) {
                throw new AppError(
                    ERROR_MESSAGES.NO_NODES_LOADED,
                    ErrorType.UNKNOWN
                );
            }

            // Criar solução atualizada
            const updatedSolution = { ...solutionToLoad, nodes };

            // Atualizar solução com nodes carregados
            setSolutions(prev => 
                prev.map(s => 
                    s.id === solutionId 
                        ? updatedSolution
                        : s
                )
            );
            
            // Retorna a solução atualizada diretamente
            return updatedSolution;

        } catch (err) {
            // Ignorar erros de abort
            if (err instanceof Error && err.name === 'AbortError') {
                return null;
            }
            
            const userMessage = getUserMessage(err);
            setError(userMessage);
            
            if ((import.meta as any).env?.DEV) {
                console.error("Error loading nodes:", err);
            }
            return null;
        }
    }, []);

    // Restaurar estado da URL após carregar as soluções
    useEffect(() => {
        if (!hasRestoredFromUrl && !isLoading && solutions.length > 0) {
            const urlState = decodeUrlState();
            
            // Se tem solução na URL, restaurar
            if (urlState.solutionPath) {
                const solution = findSolutionByPath(solutions, urlState.solutionPath);
                
                if (solution) {
                    // Carregar solução e node primeiro (async)
                    const nodeToLoad = urlState.nodeId || 0;
                    
                    (async () => {
                        try {
                            // Mostrar loading para restauração de URL
                            setIsRestoringFromUrl(true);
                            setIsLoadingNode(true);
                            
                            // Carregar todos os nodes de 0 até o node desejado para garantir o caminho completo
                            const nodesToLoad = Array.from({ length: nodeToLoad + 1 }, (_, i) => i);
                            
                            await loadNodesForSolution(solution.id, nodesToLoad);
                            
                            // Batch state updates para reduzir re-renders
                            React.startTransition(() => {
                                setSelectedSolutionId(solution.id);
                                setViewerState({
                                    currentNodeId: nodeToLoad,
                                    selectedHand: urlState.hand || null,
                                    displayMode: 'bb',
                                });
                                setCurrentPage(urlState.page || 'solutions');
                                setHasRestoredFromUrl(true);
                            });

                        } catch (error) {
                            const userMessage = getUserMessage(error);
                            setError(userMessage);
                            
                            if ((import.meta as any).env?.DEV) {
                                console.error('❌ Erro ao carregar spot:', error);
                            }
                            setHasRestoredFromUrl(true);
                        } finally {
                            // Esconder loading
                            setIsLoadingNode(false);
                            setIsRestoringFromUrl(false);
                        }
                    })();
                    
                } else {
                    if ((import.meta as any).env?.DEV) {
                        console.warn(`⚠️ Solução não encontrada: ${urlState.solutionPath}`);
                    }
                    setHasRestoredFromUrl(true);
                }
            } else if (urlState.page) {
                // Sem solução, mas tem página
                setCurrentPage(urlState.page);
                setHasRestoredFromUrl(true);
            } else {
                setHasRestoredFromUrl(true);
            }
        }
    }, [hasRestoredFromUrl, isLoading, solutions, loadNodesForSolution]);

    // Carregar node específico sob demanda
    const loadNode = useCallback(async (nodeId: number) => {
        const solution = solutions.find(s => s.id === selectedSolutionId);
        if (!solution || !solution.path) return;

        // Se já tem o node carregado, não precisa recarregar
        if (solution.nodes.has(nodeId)) {
            return;
        }

        setIsLoadingNode(true);
        try {
            const nodeRes = await retryFetch(getResourceUrl(`${solution.path}/nodes/${nodeId}.json`));
            if (!nodeRes.ok) {
                throw new AppError(
                    ERROR_MESSAGES.NODE_LOAD_FAILED(nodeId),
                    ErrorType.NOT_FOUND
                );
            }
            const nodeData: NodeData = await nodeRes.json();

            // Atualizar solução com o novo node
            setSolutions(prev => 
                prev.map(s => {
                    if (s.id === selectedSolutionId) {
                        const newNodes = new Map(s.nodes);
                        newNodes.set(nodeId, nodeData);
                        return { ...s, nodes: newNodes };
                    }
                    return s;
                })
            );

        } catch (err) {
            const userMessage = getUserMessage(err);
            setError(userMessage);
            
            if ((import.meta as any).env?.DEV) {
                console.error(`Error loading node ${nodeId}:`, err);
            }
        } finally {
            setIsLoadingNode(false);
        }
    }, [solutions, selectedSolutionId]);

    // Carregar múltiplos nodes de uma vez
    const loadMultipleNodes = useCallback(async (nodeIds: number[]) => {
        const solution = solutions.find(s => s.id === selectedSolutionId);
        if (!solution || !solution.path) return;

        // Filtrar apenas nodes que ainda não foram carregados
        const nodesToLoad = nodeIds.filter(id => !solution.nodes.has(id));
        if (nodesToLoad.length === 0) return;

        setIsLoadingNode(true);
        try {
            const loadedNodes = await Promise.all(
                nodesToLoad.map(async (nodeId) => {
                    try {
                        const nodeRes = await retryFetch(getResourceUrl(`${solution.path}/nodes/${nodeId}.json`));
                        if (!nodeRes.ok) {
                            throw new AppError(
                                ERROR_MESSAGES.NODE_LOAD_FAILED(nodeId),
                                ErrorType.NOT_FOUND
                            );
                        }
                        const nodeData: NodeData = await nodeRes.json();
                        return { nodeId, nodeData };
                    } catch (err) {
                        if ((import.meta as any).env?.DEV) {
                            console.error(`Error loading node ${nodeId}:`, err);
                        }
                        return null;
                    }
                })
            );

            // Atualizar solução com os novos nodes
            setSolutions(prev => 
                prev.map(s => {
                    if (s.id === selectedSolutionId) {
                        const newNodes = new Map(s.nodes);
                        loadedNodes.forEach(result => {
                            if (result) {
                                newNodes.set(result.nodeId, result.nodeData);
                            }
                        });
                        return { ...s, nodes: newNodes };
                    }
                    return s;
                })
            );

        } catch (err) {
            const userMessage = getUserMessage(err);
            setError(userMessage);
            
            if ((import.meta as any).env?.DEV) {
                console.error(`Error loading multiple nodes:`, err);
            }
        } finally {
            setIsLoadingNode(false);
        }
    }, [solutions, selectedSolutionId]);


    // --- Memoized Derived State for Viewer ---

    const selectedSolution = useMemo(() => {
        return solutions.find(s => s.id === selectedSolutionId);
    }, [solutions, selectedSolutionId]);

    const bigBlind = useMemo(() => {
        if (!selectedSolution) return 0;
        const blinds = selectedSolution.settings.handdata.blinds;
        return blinds.length > 1 ? Math.max(blinds[0], blinds[1]) : (blinds[0] || 0);
    }, [selectedSolution]);

    // Otimizado: só recalcula se os nodes mudarem
    const parentMap = useMemo(() => {
        const map = new Map<number, number>();
        if (!selectedSolution || selectedSolution.nodes.size === 0) return map;
        
        // Iterar diretamente sobre o Map
        for (const [nodeId, nodeData] of selectedSolution.nodes) {
            for (const action of nodeData.actions) {
                if (typeof action.node === 'number') {
                    map.set(action.node, nodeId);
                }
            }
        }
        return map;
    }, [selectedSolution?.nodes.size, selectedSolution?.id]); // Otimização: só quando muda o tamanho ou ID

    const pathNodeIds = useMemo(() => {
        if (!parentMap.size) return [0];
        const path: number[] = [];
        let currentId: number | undefined = currentNodeId;
        
        // Prevenção de loops infinitos
        const maxDepth = 100;
        let depth = 0;
        
        while (typeof currentId === 'number' && depth < maxDepth) {
            path.unshift(currentId);
            currentId = parentMap.get(currentId);
            depth++;
        }
        return path;
    }, [currentNodeId, parentMap]);
    
    const currentNode = useMemo(() => {
        return selectedSolution?.nodes.get(currentNodeId);
    }, [selectedSolution, currentNodeId]);


    // --- Event Handlers ---

    const handleSelectSolution = async (id: string) => {
        if ((import.meta as any).env?.DEV) {
            console.log('🎯 handleSelectSolution called with ID:', id);
        }
        
        setSelectedSolutionId(id);
        setCurrentNodeId(0); // Reset to root node
        setSelectedHand(null);
        setIsLoadingNode(true);
        
        // Carregar nodes para esta solução e esperar
        try {
            await loadNodesForSolution(id);
        } catch (error) {
            if ((import.meta as any).env?.DEV) {
                console.error('Error in handleSelectSolution:', error);
            }
        } finally {
            setIsLoadingNode(false);
        }
    };

    const handleChangeSolution = () => {
        setSelectedSolutionId(null);
        setCurrentPage('solutions');
    };

    const handleNavigate = (page: 'solutions' | 'trainer') => {
        setCurrentPage(page);
        setSelectedSolutionId(null);
    };

    const handleBackToHome = () => {
        setCurrentPage('home');
        setSelectedSolutionId(null);
    };

    const handleNodeChange = (nodeId: number) => {
        setCurrentNodeId(nodeId);
        setSelectedHand(null); // Deselect hand when action changes
        // Carregar node se ainda não foi carregado
        loadNode(nodeId);
    };

    // Sincronizar estado com URL (após restauração inicial)
    useEffect(() => {
        if (!hasRestoredFromUrl) return;
        
        const urlState = createUrlStateFromSolution(
            currentPage,
            selectedSolution || null,
            currentNodeId,
            selectedHand || undefined
        );
        
        updateUrl(urlState, true); // replace = true para não criar histórico excessivo
    }, [hasRestoredFromUrl, currentPage, selectedSolution, currentNodeId, selectedHand]);

    // --- Render Logic ---

    // Mostrar loading se:
    // 1. Ainda está carregando metadados (isLoading)
    // 2. Está restaurando estado da URL (isRestoringFromUrl)
    // 3. Tem parâmetros de URL mas ainda não restaurou (hasUrlParams && !hasRestoredFromUrl)
    const shouldShowLoading = isLoading || isRestoringFromUrl || (hasUrlParams && !hasRestoredFromUrl);
    
    if (shouldShowLoading) {
        return <LoadingOverlay isLoading={true} message="Loading..." />;
    }

    // Home page
    if (currentPage === 'home') {
        return <HomePage onNavigate={handleNavigate} />;
    }

    // Trainer page
    if (currentPage === 'trainer') {
        return (
            <Trainer 
                solutions={solutions}
                onBack={handleBackToHome}
                loadNode={loadNode}
                loadMultipleNodes={loadMultipleNodes}
                loadNodesForSolution={loadNodesForSolution}
            />
        );
    }

    // Solutions page
    if (!selectedSolution) {
        return (
            <SolutionsLibrary 
                solutions={solutions}
                onSelectSolution={handleSelectSolution}
                onFileChange={handleFileChange}
                isLoading={isLoading}
                error={error}
                onBack={handleBackToHome}
            />
        );
    }

    if (!currentNode) {
        // Se não tem node, está carregando
        return (
            <>
                <LoadingOverlay isLoading={true} message="Loading solution..." />
            </>
        );
    }
    
    const { settings } = selectedSolution;
    const { stacks } = settings.handdata;
    const playerStack = stacks[currentNode.player];
    const numPlayers = stacks.length;

    return (
        <>
            <div className="flex flex-col h-screen overflow-hidden bg-[#1a1d23]">
                <Header 
                    currentNodeId={currentNodeId}
                    currentNode={currentNode}
                    bigBlind={bigBlind}
                    settings={settings}
                    allNodes={selectedSolution.nodes}
                    onNodeChange={handleNodeChange}
                    parentMap={parentMap}
                    pathNodeIds={pathNodeIds}
                    displayMode={displayMode}
                    tournamentPhase={selectedSolution.tournamentPhase}
                    onChangeSolution={handleChangeSolution}
                    loadMultipleNodes={loadMultipleNodes}
                    fileName={selectedSolution.fileName}
                />
                <main className="flex flex-1 p-3 gap-3 overflow-hidden">
                    <div className="flex-1 flex items-center justify-center p-3 bg-[#23272f] rounded-lg overflow-hidden">
                         <RangeGrid 
                            currentNode={currentNode}
                            bigBlind={bigBlind}
                            playerStack={playerStack}
                            selectedHand={selectedHand}
                            setSelectedHand={setSelectedHand}
                            displayMode={displayMode}
                            playerIndex={currentNode.player}
                            numPlayers={numPlayers}
                            settings={settings}
                        />
                    </div>
                    <Sidebar 
                        appData={selectedSolution}
                        currentNode={currentNode}
                        bigBlind={bigBlind}
                        selectedHand={selectedHand}
                        pathNodeIds={pathNodeIds}
                        displayMode={displayMode}
                        onDisplayModeToggle={() => setDisplayMode(displayMode === 'bb' ? 'chips' : 'bb')}
                    />
                </main>
            </div>
            <LoadingOverlay isLoading={isLoadingNode} message="Loading spot..." />
            <VersionBadge position="bottom-right" />
        </>
    );
};

export default App;
