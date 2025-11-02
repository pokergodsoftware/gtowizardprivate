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
import { getResourceUrl } from './config.ts';
import { decodeUrlState, updateUrl, createUrlStateFromSolution, findSolutionByPath } from './lib/urlUtils.ts';
import type { AppData, NodeData, EquityData, SettingsData, SolutionMetadata } from './types.ts';


// Main Application Component
const App: React.FC = () => {
    // --- State Management ---
    const [currentPage, setCurrentPage] = useState<'home' | 'solutions' | 'trainer'>('home');
    const [solutions, setSolutions] = useState<AppData[]>([]);
    const solutionsRef = useRef<AppData[]>([]);
    const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingNode, setIsLoadingNode] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Viewer-specific state
    const [currentNodeId, setCurrentNodeId] = useState<number>(0);
    const [selectedHand, setSelectedHand] = useState<string | null>(null);
    const [displayMode, setDisplayMode] = useState<'bb' | 'chips'>('bb');
    
    // Flag para controlar se já restauramos o estado da URL
    const [hasRestoredFromUrl, setHasRestoredFromUrl] = useState(false);

    // --- Data Parsing and Loading ---

    const parseHrcFolder = async (files: FileList | File[], fileName: string, tournamentPhase: string): Promise<AppData> => {
        const fileArray = Array.from(files);

        const settingsFile = fileArray.find(f => f.name.endsWith('settings.json') || f.webkitRelativePath.endsWith('settings.json'));
        const equityFile = fileArray.find(f => f.name.endsWith('equity.json') || f.webkitRelativePath.endsWith('equity.json'));
        const nodeFiles = fileArray.filter(f => (f.name.includes('nodes/') || f.webkitRelativePath.includes('nodes/')) && f.name.endsWith('.json'));

        if (!settingsFile || !equityFile || nodeFiles.length === 0) {
            throw new Error('Pasta de solução inválida. Faltando settings.json, equity.json ou a pasta de nós.');
        }

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
            setSolutions(prev => {
                const updated = [...prev, newSolution];
                solutionsRef.current = updated;
                return updated;
            });
        } catch (err) {
            console.error("Error processing uploaded files:", err);
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido ao processar o arquivo.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Carregar apenas metadados das soluções (lazy loading)
    const loadSolutionsMetadata = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const metadataRes = await fetch(getResourceUrl('solutions-metadata.json'));
            if (!metadataRes.ok) {
                 if (metadataRes.status === 404) {
                    console.log("solutions-metadata.json not found, starting with empty library.");
                    setSolutions([]);
                    solutionsRef.current = [];
                    setIsLoading(false);
                    return; 
                 }
                 throw new Error(`Failed to load solutions metadata: ${metadataRes.statusText}`);
            }
            const metadata: SolutionMetadata[] = await metadataRes.json();

            if (!Array.isArray(metadata)) {
                throw new Error('solutions-metadata.json is not a valid array.');
            }

            // Carregar apenas settings e equity (não os nodes)
            const solutionPromises = metadata.map(async (meta) => {
                const { path: basePath, fileName, tournamentPhase } = meta;

                if (!basePath || !fileName || !tournamentPhase) {
                    console.warn("Skipping invalid solution entry in metadata:", meta);
                    return null;
                }

                try {
                    const settingsRes = await fetch(getResourceUrl(`${basePath}/settings.json`));
                    if (!settingsRes.ok) throw new Error(`Failed to load settings.json for ${fileName}`);
                    const settings: SettingsData = await settingsRes.json();

                    const equityRes = await fetch(getResourceUrl(`${basePath}/equity.json`));
                    if (!equityRes.ok) throw new Error(`Failed to load equity.json for ${fileName}`);
                    const equity: EquityData = await equityRes.json();
                    
                    // Criar solução SEM nodes (serão carregados sob demanda)
                    return {
                        id: uuidv4(),
                        fileName,
                        tournamentPhase,
                        settings,
                        equity,
                        nodes: new Map<number, NodeData>(), // Vazio inicialmente
                        path: basePath, // Guardar caminho para lazy loading
                    };
                } catch (e) {
                    console.error(`Error loading solution "${fileName}":`, e);
                    return null;
                }
            });

            const loadedSolutions = (await Promise.all(solutionPromises)).filter(s => s !== null) as AppData[];

            setSolutions(loadedSolutions);
            solutionsRef.current = loadedSolutions;
            console.log(`✅ Loaded ${loadedSolutions.length} solutions (nodes will load on-demand)`);

        } catch (err) {
            console.error("Error loading solutions metadata:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred while loading solutions.");
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        loadSolutionsMetadata();
    }, [loadSolutionsMetadata]);

    // Carregar nodes sob demanda quando uma solução é selecionada
    const loadNodesForSolution = useCallback(async (solutionId: string, nodeIdsToLoad?: number[]): Promise<AppData | null> => {
        console.log(`⏳ Loading nodes for solution ID: ${solutionId}`);
        
        // Acessar solutions via ref (sempre atualizado)
        const currentSolutions = solutionsRef.current;
        const solutionToLoad = currentSolutions.find(s => s.id === solutionId);

        if (!solutionToLoad) {
            console.error(`❌ Solution not found: ${solutionId}`);
            return null;
        }
        
        console.log(`✅ Found solution: ${solutionToLoad.fileName}`);

        if (!solutionToLoad.path) {
            console.error('Solution has no path');
            return null;
        }

        // Define quais nodes carregar
        const nodesToLoad = nodeIdsToLoad || [0];
        
        // Filtra apenas nodes que ainda não foram carregados
        const missingNodes = nodesToLoad.filter(id => !solutionToLoad!.nodes.has(id));
        
        if (missingNodes.length === 0) {
            console.log(`✅ All requested nodes already loaded for "${solutionToLoad.fileName}"`);
            return solutionToLoad;
        }

        console.log(`⏳ Loading ${missingNodes.length} nodes for "${solutionToLoad.fileName}": [${missingNodes.join(', ')}]`);

        try {
            // Cria um novo Map com os nodes existentes
            const nodes = new Map(solutionToLoad.nodes);
            
            // Carrega os nodes faltantes
            await Promise.all(missingNodes.map(async (id: number) => {
                try {
                    const nodeRes = await fetch(getResourceUrl(`${solutionToLoad!.path}/nodes/${id}.json`));
                    if (!nodeRes.ok) throw new Error(`Failed to load node ${id}.json`);
                    const nodeData: NodeData = await nodeRes.json();
                    nodes.set(id, nodeData);
                    console.log(`✅ Successfully loaded node ${id}`);
                } catch (e) {
                    console.error(`Error loading node ${id}:`, e);
                }
            }));

            if (nodes.size === solutionToLoad.nodes.size) {
                throw new Error('No new nodes were loaded');
            }

            // Criar solução atualizada
            const updatedSolution = { ...solutionToLoad, nodes };

            // Atualizar solução com nodes carregados
            setSolutions(prev => {
                const updated = prev.map(s => 
                    s.id === solutionId 
                        ? updatedSolution
                        : s
                );
                solutionsRef.current = updated;
                console.log(`✅ Updated solutions array with ${nodes.size} total nodes for "${solutionToLoad!.fileName}"`);
                return updated;
            });

            console.log(`✅ Loaded ${missingNodes.length} new nodes for "${solutionToLoad.fileName}"`);
            
            // Retorna a solução atualizada diretamente
            return updatedSolution;

        } catch (err) {
            console.error("Error loading nodes:", err);
            setError(err instanceof Error ? err.message : "Failed to load nodes");
            return null;
        }
    }, []);

    // Restaurar estado da URL após carregar as soluções
    useEffect(() => {
        if (!hasRestoredFromUrl && !isLoading && solutions.length > 0) {
            const urlState = decodeUrlState();
            
            console.log('🔗 Restaurando estado da URL:', urlState);
            
            // Se tem solução na URL, restaurar
            if (urlState.solutionPath) {
                const solution = findSolutionByPath(solutions, urlState.solutionPath);
                
                if (solution) {
                    console.log(`✅ Solução encontrada na URL: ${solution.fileName}`);
                    
                    // Carregar solução e node primeiro (async)
                    const nodeToLoad = urlState.nodeId || 0;
                    
                    (async () => {
                        // Carregar todos os nodes de 0 até o node desejado para garantir o caminho completo
                        const nodesToLoad = Array.from({ length: nodeToLoad + 1 }, (_, i) => i);
                        console.log(`📦 Carregando nodes do caminho: [0...${nodeToLoad}]`);
                        
                        await loadNodesForSolution(solution.id, nodesToLoad);
                        
                        // Só depois de carregar, definir o estado
                        setSelectedSolutionId(solution.id);
                        setCurrentNodeId(nodeToLoad);
                        
                        if (urlState.hand) {
                            setSelectedHand(urlState.hand);
                        }
                        
                        // Definir página
                        if (urlState.page) {
                            setCurrentPage(urlState.page);
                        } else {
                            setCurrentPage('solutions');
                        }
                        
                        setHasRestoredFromUrl(true);
                    })();
                    
                } else {
                    console.warn(`⚠️ Solução não encontrada: ${urlState.solutionPath}`);
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
            const nodeRes = await fetch(getResourceUrl(`${solution.path}/nodes/${nodeId}.json`));
            if (!nodeRes.ok) throw new Error(`Failed to load node ${nodeId}.json`);
            const nodeData: NodeData = await nodeRes.json();

            // Atualizar solução com o novo node
            setSolutions(prev => {
                const updated = prev.map(s => {
                    if (s.id === selectedSolutionId) {
                        const newNodes = new Map(s.nodes);
                        newNodes.set(nodeId, nodeData);
                        return { ...s, nodes: newNodes };
                    }
                    return s;
                });
                solutionsRef.current = updated;
                return updated;
            });

            console.log(`✅ Loaded node ${nodeId}`);

        } catch (err) {
            console.error(`Error loading node ${nodeId}:`, err);
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
                        const nodeRes = await fetch(getResourceUrl(`${solution.path}/nodes/${nodeId}.json`));
                        if (!nodeRes.ok) throw new Error(`Failed to load node ${nodeId}.json`);
                        const nodeData: NodeData = await nodeRes.json();
                        return { nodeId, nodeData };
                    } catch (err) {
                        console.error(`Error loading node ${nodeId}:`, err);
                        return null;
                    }
                })
            );

            // Atualizar solução com os novos nodes
            setSolutions(prev => {
                const updated = prev.map(s => {
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
                });
                solutionsRef.current = updated;
                return updated;
            });

            console.log(`✅ Loaded ${loadedNodes.filter(r => r !== null).length} nodes`);

        } catch (err) {
            console.error(`Error loading multiple nodes:`, err);
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

    const parentMap = useMemo(() => {
        const map = new Map<number, number>();
        if (!selectedSolution) return map;
        for (const [nodeId, nodeData] of selectedSolution.nodes.entries()) {
            for (const action of nodeData.actions) {
                if (typeof action.node === 'number') {
                    map.set(action.node, nodeId);
                }
            }
        }
        return map;
    }, [selectedSolution]);

    const pathNodeIds = useMemo(() => {
        if (!parentMap.size) return [0];
        const path: number[] = [];
        let currentId: number | undefined = currentNodeId;
        while (typeof currentId === 'number') {
            path.unshift(currentId);
            currentId = parentMap.get(currentId);
        }
        return path;
    }, [currentNodeId, parentMap]);
    
    const currentNode = useMemo(() => {
        return selectedSolution?.nodes.get(currentNodeId);
    }, [selectedSolution, currentNodeId]);


    // --- Event Handlers ---

    const handleSelectSolution = async (id: string) => {
        setSelectedSolutionId(id);
        setCurrentNodeId(0); // Reset to root node
        setSelectedHand(null);
        setIsLoadingNode(true);
        // Carregar nodes para esta solução e esperar
        await loadNodesForSolution(id);
        setIsLoadingNode(false);
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
                        onDisplayModeToggle={() => setDisplayMode(m => m === 'bb' ? 'chips' : 'bb')}
                    />
                </main>
            </div>
            <LoadingOverlay isLoading={isLoadingNode} message="Loading node..." />
        </>
    );
};

export default App;
