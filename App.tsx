
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { RangeGrid } from './components/RangeGrid.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { SolutionsLibrary } from './components/SolutionsLibrary.tsx';
import type { AppData, NodeData, Action } from './types.ts';
import { v4 as uuidv4 } from 'uuid';


// Extend the Window interface to include JSZip
declare global {
  interface Window {
    JSZip: any;
  }
}

// Helper function to parse a single solution zip file.
const parseSolution = async (fileBlob: Blob, fileName: string, tournamentPhase: string): Promise<AppData> => {
    if (!window.JSZip) {
        throw new Error("JSZip library not loaded. Please check your internet connection and refresh.");
    }

    const zip = await window.JSZip.loadAsync(fileBlob);
    const settingsFile = zip.file('settings.json');
    const equityFile = zip.file('equity.json');
    
    if (!settingsFile || !equityFile) {
      throw new Error(`Missing settings.json or equity.json in the file: ${fileName}.`);
    }

    const settings = JSON.parse(await settingsFile.async('string'));
    const equity = JSON.parse(await equityFile.async('string'));

    // Chip values in the solution files are inflated.
    // Divide stacks, blinds, and action amounts by 100.
    if (settings.handdata) {
        if (Array.isArray(settings.handdata.stacks)) {
            settings.handdata.stacks = settings.handdata.stacks.map((s: number) => s / 100);
        }
        if (Array.isArray(settings.handdata.blinds)) {
            settings.handdata.blinds = settings.handdata.blinds.map((b: number) => b / 100);
        }
    }

    const nodes: Map<number, NodeData> = new Map();
    const nodeFiles = (Object.values(zip.files) as any[]).filter((f) => f.name.startsWith('nodes/') && f.name.endsWith('.json'));

    for (const nodeFile of nodeFiles) {
      const nodeId = parseInt(nodeFile.name.split('/')[1].replace('.json', ''));
      const nodeContent = JSON.parse(await nodeFile.async('string'));
      
      if (nodeContent.actions && Array.isArray(nodeContent.actions)) {
        nodeContent.actions.forEach((action: Action) => {
            if (typeof action.amount === 'number') {
                action.amount /= 100;
            }
        });
      }

      nodes.set(nodeId, nodeContent);
    }
    
    return {
      id: uuidv4(),
      fileName,
      tournamentPhase,
      settings,
      equity,
      nodes,
    };
};

// Maps a directory name from spots/ to a human-readable tournament phase.
const mapDirToPhase = (dir: string): string => {
    switch (dir) {
        case '100-60': return '100~60% left';
        case '60-40': return '60~40% left';
        case '40-20': return '40~20% left';
        case 'near_bubble': return 'Near bubble';
        case '3tables': return '3 tables';
        case '2tables': return '2 tables';
        case 'final_table': return 'Final table';
        default: 
            // Fallback for custom folder names: replace underscore/hyphen with space and capitalize.
            const formatted = dir.replace(/[_-]/g, ' ');
            return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
};


const App: React.FC = () => {
  const [solutions, setSolutions] = useState<AppData[]>([]);
  const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true); // For initial auto-load
  const [isUploading, setIsUploading] = useState<boolean>(false); // For manual uploads
  const [displayMode, setDisplayMode] = useState<'bb' | 'chips'>('bb');
  const [currentNodeId, setCurrentNodeId] = useState<number>(0);

  // Auto-load default solutions from a simple index file on startup.
  useEffect(() => {
    const loadDefaultSolutions = async () => {
        setIsAppLoading(true);
        setError(null);
        try {
            const indexUrl = 'spots/index.txt';
            const response = await fetch(indexUrl);

            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`Default solutions index not found at '${indexUrl}'. Skipping auto-load.`);
                    return;
                }
                throw new Error(`Failed to fetch index: ${response.statusText}`);
            }

            const indexText = await response.text();
            const filePaths = indexText.split('\n').map(line => line.trim()).filter(Boolean);

            if (filePaths.length === 0) {
                console.warn(`'${indexUrl}' is empty. No solutions to load.`);
                return;
            }

            const promises = filePaths.map(async (path) => {
                const pathParts = path.split('/');
                if (pathParts.length < 2) {
                    console.error(`Invalid path in index.txt: ${path}. Skipping.`);
                    return null;
                }
                
                const dirName = pathParts[0];
                const fileName = pathParts[pathParts.length - 1];
                const tournamentPhase = mapDirToPhase(dirName);

                const fileUrl = `spots/${path}`;
                const fileResponse = await fetch(fileUrl);
                if (!fileResponse.ok) {
                    throw new Error(`Failed to fetch solution file: ${fileUrl} (Status: ${fileResponse.status})`);
                }
                const fileBlob = await fileResponse.blob();
                return parseSolution(fileBlob, fileName, tournamentPhase);
            });
            
            const newSolutions = (await Promise.all(promises)).filter((s): s is AppData => s !== null);
            setSolutions(prev => [...prev, ...newSolutions]);

        } catch (err) {
            console.error("Error loading default solutions:", err);
            setError(err instanceof Error ? `Could not auto-load solutions: ${err.message}` : 'An unknown error occurred during auto-load.');
        } finally {
            setIsAppLoading(false);
        }
    };
    loadDefaultSolutions();
  }, []);

  const selectedSolution = useMemo(() => {
    return solutions.find(s => s.id === selectedSolutionId) || null;
  }, [solutions, selectedSolutionId]);

  const handleDisplayModeToggle = useCallback(() => {
    setDisplayMode(prev => prev === 'bb' ? 'chips' : 'bb');
  }, []);

  const handleFileChange = useCallback(async (files: FileList, tournamentPhase: string) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setError(null);

    try {
        const solutionPromises = Array.from(files).map(file => parseSolution(file, file.name, tournamentPhase));
        const newSolutions = await Promise.all(solutionPromises);
        setSolutions(prev => [...prev, ...newSolutions]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to process zip files.');
    } finally {
      setIsUploading(false);
    }
  }, []);


  const handleSelectSolution = useCallback((solutionId: string) => {
    setSelectedSolutionId(solutionId);
    setCurrentNodeId(0); // Reset to root node when selecting a solution
    setSelectedHand('AA');
  }, []);
  
  const handleDeselectSolution = useCallback(() => {
      setSelectedSolutionId(null);
  }, []);

  const { parentMap, pathNodeIds } = useMemo(() => {
    if (!selectedSolution) return { parentMap: new Map(), pathNodeIds: [] };

    const parentMap = new Map<number, number>();
    for (const [nodeId, nodeData] of selectedSolution.nodes.entries()) {
        for (const action of nodeData.actions) {
            if (typeof action.node === 'number') {
                parentMap.set(action.node, nodeId);
            }
        }
    }
    
    const path: number[] = [];
    let currentId: number | undefined = currentNodeId;
    while (currentId !== undefined) {
        path.unshift(currentId);
        currentId = parentMap.get(currentId);
    }

    return { parentMap, pathNodeIds: path };
  }, [selectedSolution, currentNodeId]);
  
  const [selectedHand, setSelectedHand] = useState<string>('AA');

  const currentNode = selectedSolution?.nodes.get(currentNodeId);
  const blinds = selectedSolution?.settings.handdata.blinds || [];
  const bigBlind = blinds.length > 1 ? Math.max(blinds[0], blinds[1]) : (blinds[0] || 0);
  const playerStack = selectedSolution && currentNode ? selectedSolution.settings.handdata.stacks[currentNode.player] : 0;
  const numPlayers = selectedSolution?.settings.handdata.stacks.length || 0;

  if (isAppLoading) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-[#1e2227] text-white">
              <div className="flex flex-col items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-4 text-lg">Loading solutions...</p>
                   {error && <p className="mt-2 text-red-400 bg-red-900/50 p-3 rounded-md max-w-md text-center">{error}</p>}
              </div>
          </div>
      );
  }

  if (!selectedSolution || !currentNode) {
    return (
        <SolutionsLibrary 
            solutions={solutions}
            onSelectSolution={handleSelectSolution}
            onFileChange={handleFileChange}
            isLoading={isUploading}
            error={error}
        />
    );
  }

  return (
    <div className="min-h-screen bg-[#1e2227] font-sans">
      <div className="flex flex-col h-screen">
        <Header 
          currentNodeId={currentNodeId}
          currentNode={currentNode} 
          bigBlind={bigBlind}
          settings={selectedSolution.settings}
          allNodes={selectedSolution.nodes}
          onNodeChange={setCurrentNodeId}
          parentMap={parentMap}
          pathNodeIds={pathNodeIds}
          displayMode={displayMode}
          tournamentPhase={selectedSolution.tournamentPhase}
          onChangeSolution={handleDeselectSolution}
        />
        <main className="flex flex-1 overflow-hidden p-2 gap-2">
          <div className="flex flex-col flex-1 bg-[#282c33] rounded-md overflow-hidden">
            <div className="flex flex-1 items-center justify-center min-w-0 min-h-0">
                <RangeGrid 
                  currentNode={currentNode} 
                  bigBlind={bigBlind} 
                  playerStack={playerStack}
                  selectedHand={selectedHand}
                  setSelectedHand={setSelectedHand}
                  displayMode={displayMode}
                  playerIndex={currentNode.player}
                  numPlayers={numPlayers}
                  settings={selectedSolution.settings}
                />
            </div>
          </div>
          <Sidebar 
            appData={selectedSolution} 
            currentNode={currentNode} 
            bigBlind={bigBlind}
            selectedHand={selectedHand}
            pathNodeIds={pathNodeIds}
            displayMode={displayMode}
            onDisplayModeToggle={handleDisplayModeToggle}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
