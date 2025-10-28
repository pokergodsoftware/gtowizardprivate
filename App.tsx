
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

// NOTE: The localStorage persistence functions have been removed
// to prevent "quota exceeded" errors with large solution files.
// The application will now operate on a session-by-session basis.

const App: React.FC = () => {
  const [solutions, setSolutions] = useState<AppData[]>([]);
  const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [displayMode, setDisplayMode] = useState<'bb' | 'chips'>('bb');
  const [currentNodeId, setCurrentNodeId] = useState<number>(0);

  // The useEffect for saving solutions to localStorage has been removed.

  const selectedSolution = useMemo(() => {
    return solutions.find(s => s.id === selectedSolutionId) || null;
  }, [solutions, selectedSolutionId]);

  const handleDisplayModeToggle = useCallback(() => {
    setDisplayMode(prev => prev === 'bb' ? 'chips' : 'bb');
  }, []);

  const handleFileChange = useCallback(async (files: FileList, tournamentPhase: string) => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    setError(null);

    if (!window.JSZip) {
      setError("JSZip library not loaded. Please check your internet connection and refresh.");
      setIsLoading(false);
      return;
    }

    const newSolutions: AppData[] = [];
    try {
      for (const file of Array.from(files)) {
        const zip = await window.JSZip.loadAsync(file);
        const settingsFile = zip.file('settings.json');
        const equityFile = zip.file('equity.json');
        
        if (!settingsFile || !equityFile) {
          throw new Error(`Missing settings.json or equity.json in the file: ${file.name}.`);
        }

        const settings = JSON.parse(await settingsFile.async('string'));
        const equity = JSON.parse(await equityFile.async('string'));

        // Chip values in the solution files are inflated.
        // Divide stacks, blinds, and action amounts by 100.
        // Bounty values are used as-is from the file, per user request.
        if (settings.handdata) {
            if (Array.isArray(settings.handdata.stacks)) {
                settings.handdata.stacks = settings.handdata.stacks.map((s: number) => s / 100);
            }
            if (Array.isArray(settings.handdata.blinds)) {
                settings.handdata.blinds = settings.handdata.blinds.map((b: number) => b / 100);
            }
            // Note: Bounty values are no longer scaled here, as per user feedback.
            // The original values from the file are used directly.
        }

        const nodes: Map<number, NodeData> = new Map();
        const nodeFiles = (Object.values(zip.files) as any[]).filter((f) => f.name.startsWith('nodes/') && f.name.endsWith('.json'));

        for (const nodeFile of nodeFiles) {
          const nodeId = parseInt(nodeFile.name.split('/')[1].replace('.json', ''));
          const nodeContent = JSON.parse(await nodeFile.async('string'));
          
          // Also apply the division to action amounts inside each node.
          if (nodeContent.actions && Array.isArray(nodeContent.actions)) {
            nodeContent.actions.forEach((action: Action) => {
                if (typeof action.amount === 'number') {
                    action.amount /= 100;
                }
            });
          }

          nodes.set(nodeId, nodeContent);
        }
        
        const newSolution: AppData = {
          id: uuidv4(),
          fileName: file.name,
          tournamentPhase,
          settings,
          equity,
          nodes,
        };
        newSolutions.push(newSolution);
      }

      setSolutions(prev => [...prev, ...newSolutions]);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to process zip files.');
    } finally {
      setIsLoading(false);
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

  if (!selectedSolution || !currentNode) {
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