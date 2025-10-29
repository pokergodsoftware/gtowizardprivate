import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import type { AppData, NodeData, EquityData, SettingsData, SolutionMetadata } from './types.ts';


// Main Application Component
const App: React.FC = () => {
    // --- State Management ---
    const [currentPage, setCurrentPage] = useState<'home' | 'solutions' | 'trainer'>('home');
    const [solutions, setSolutions] = useState<AppData[]>([]);
    const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingNode, setIsLoadingNode] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Viewer-specific state
    const [currentNodeId, setCurrentNodeId] = useState<number>(0);
    const [selectedHand, setSelectedHand] = useState<string | null>(null);
    const [displayMode, setDisplayMode] = useState<'bb' | 'chips'>('bb');

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
            setSolutions(prev => [...prev, newSolution]);
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
    const loadNodesForSolution = useCallback(async (solutionId: string) => {
        const solution = solutions.find(s => s.id === solutionId);
        if (!solution || !solution.path) return;

        // Se já tem nodes carregados, não precisa recarregar
        if (solution.nodes.size > 0) {
            console.log(`✅ Nodes already loaded for "${solution.fileName}"`);
            return;
        }

        console.log(`⏳ Loading nodes for "${solution.fileName}"...`);
        setIsLoading(true);

        try {
            // Buscar metadados para obter lista de nodeIds
            const metadataRes = await fetch(getResourceUrl('solutions-metadata.json'));
            const metadata: SolutionMetadata[] = await metadataRes.json();
            const solutionMeta = metadata.find(m => m.path === solution.path);
            
            if (!solutionMeta) {
                throw new Error('Solution metadata not found');
            }

            const nodes = new Map<number, NodeData>();
            
            // Carregar apenas o node 0 inicialmente (root node)
            const initialNodeIds = [0];
            
            await Promise.all(initialNodeIds.map(async (id: number) => {
                try {
                    const nodeRes = await fetch(getResourceUrl(`${solution.path}/nodes/${id}.json`));
                    if (!nodeRes.ok) throw new Error(`Failed to load node ${id}.json`);
                    const nodeData: NodeData = await nodeRes.json();
                    nodes.set(id, nodeData);
                } catch (e) {
                    console.error(`Error loading node ${id}:`, e);
                }
            }));

            // Atualizar solução com nodes carregados
            setSolutions(prev => prev.map(s => 
                s.id === solutionId 
                    ? { ...s, nodes }
                    : s
            ));

            console.log(`✅ Loaded ${nodes.size} initial nodes for "${solution.fileName}"`);

        } catch (err) {
            console.error("Error loading nodes:", err);
            setError(err instanceof Error ? err.message : "Failed to load nodes");
        } finally {
            setIsLoading(false);
        }
    }, [solutions]);

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
            setSolutions(prev => prev.map(s => {
                if (s.id === selectedSolutionId) {
                    const newNodes = new Map(s.nodes);
                    newNodes.set(nodeId, nodeData);
                    return { ...s, nodes: newNodes };
                }
                return s;
            }));

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
            setSolutions(prev => prev.map(s => {
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
            }));

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

    const handleSelectSolution = (id: string) => {
        setSelectedSolutionId(id);
        setCurrentNodeId(0); // Reset to root node
        setSelectedHand(null);
        // Carregar nodes para esta solução
        loadNodesForSolution(id);
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
         return <div className="flex items-center justify-center h-screen">Error: Current node not found.</div>;
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
