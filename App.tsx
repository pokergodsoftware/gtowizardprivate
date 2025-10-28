
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FileUpload } from './components/FileUploadScreen.tsx';
import { SolutionsLibrary } from './components/SolutionsLibrary.tsx';
import { Header } from './components/Header.tsx';
import { RangeGrid } from './components/RangeGrid.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import type { AppData, NodeData, EquityData, SettingsData } from './types.ts';

// Import the hardcoded solution files directly
import initialSettings from './spots/final_table/speed20_1/settings.json';
import initialEquity from './spots/final_table/speed20_1/equity.json';
import node0 from './spots/final_table/speed20_1/nodes/0.json';
import node1 from './spots/final_table/speed20_1/nodes/1.json';
import node2 from './spots/final_table/speed20_1/nodes/2.json';
import node3 from './spots/final_table/speed20_1/nodes/3.json';
import node4 from './spots/final_table/speed20_1/nodes/4.json';
import node5 from './spots/final_table/speed20_1/nodes/5.json';


// Main Application Component
const App: React.FC = () => {
    // --- State Management ---
    const [solutions, setSolutions] = useState<AppData[]>([]);
    const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
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

    const loadHardcodedSolution = useCallback(() => {
        setIsLoading(true);
        setError(null);
        try {
            const nodes = new Map<number, NodeData>();
            nodes.set(0, node0 as NodeData);
            nodes.set(1, node1 as NodeData);
            nodes.set(2, node2 as NodeData);
            nodes.set(3, node3 as NodeData);
            nodes.set(4, node4 as NodeData);
            nodes.set(5, node5 as NodeData);

            const newSolution: AppData = {
                id: uuidv4(),
                fileName: 'FT 3-handed 20bb avg',
                tournamentPhase: 'Final table',
                settings: initialSettings as SettingsData,
                equity: initialEquity as EquityData,
                nodes,
            };
            
            setSolutions([newSolution]);

        } catch (err) {
            console.error("Error loading solution:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        loadHardcodedSolution();
    }, [loadHardcodedSolution]);


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
    };

    const handleChangeSolution = () => {
        setSelectedSolutionId(null);
    };

    const handleNodeChange = (nodeId: number) => {
        setCurrentNodeId(nodeId);
        setSelectedHand(null); // Deselect hand when action changes
    };

    // --- Render Logic ---

    if (!selectedSolution) {
        return (
            <SolutionsLibrary 
                solutions={solutions}
                onSelectSolution={handleSelectSolution}
                onFileChange={handleFileChange}
                isLoading={isLoading}
                error={error}
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
        <div className="flex flex-col h-screen overflow-hidden bg-[#1e2227]">
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
            />
            <main className="flex flex-1 p-2 gap-2 overflow-hidden">
                <div className="flex-1 flex items-center justify-center p-4 bg-[#282c33] rounded-md overflow-hidden">
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
    );
};

export default App;
