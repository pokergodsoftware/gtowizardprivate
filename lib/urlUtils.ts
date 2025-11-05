import type { AppData } from '../types';

export interface UrlState {
  page?: 'home' | 'solutions' | 'trainer';
  solutionPath?: string; // We use the solution path as the unique identifier
  nodeId?: number;
  hand?: string;
}

/**
 * Encode the app state into URL parameters
 */
export function encodeUrlState(state: UrlState): string {
  const params = new URLSearchParams();
  
  if (state.page && state.page !== 'home') {
    params.set('page', state.page);
  }
  
  if (state.solutionPath) {
    params.set('solution', state.solutionPath);
  }
  
  if (state.nodeId !== undefined && state.nodeId !== 0) {
    params.set('node', state.nodeId.toString());
  }
  
  if (state.hand) {
    params.set('hand', state.hand);
  }
  
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Decode URL parameters into the app state
 */
export function decodeUrlState(): UrlState {
  const params = new URLSearchParams(window.location.search);
  
  const state: UrlState = {};
  
  const page = params.get('page');
  if (page === 'solutions' || page === 'trainer') {
    state.page = page;
  }
  
  const solutionPath = params.get('solution');
  if (solutionPath) {
    state.solutionPath = solutionPath;
  }
  
  const nodeId = params.get('node');
  if (nodeId) {
    const parsed = parseInt(nodeId, 10);
    if (!isNaN(parsed)) {
      state.nodeId = parsed;
    }
  }
  
  const hand = params.get('hand');
  if (hand) {
    state.hand = hand;
  }
  
  return state;
}

/**
 * Update the browser URL without reloading the page
 */
export function updateUrl(state: UrlState, replace: boolean = false): void {
  const url = encodeUrlState(state);
  const fullUrl = url || window.location.pathname;
  
  if (replace) {
    window.history.replaceState(null, '', fullUrl);
  } else {
    window.history.pushState(null, '', fullUrl);
  }
}

/**
 * Find a solution by its path
 */
export function findSolutionByPath(solutions: AppData[], path: string): AppData | undefined {
  return solutions.find(s => s.path === path);
}

/**
 * Create a URL state from the given solution and current node
 */
export function createUrlStateFromSolution(
  page: 'home' | 'solutions' | 'trainer',
  solution: AppData | null,
  nodeId?: number,
  hand?: string
): UrlState {
  const state: UrlState = { page };
  
  if (solution && solution.path) {
    state.solutionPath = solution.path;
  }
  
  if (nodeId !== undefined && nodeId !== 0) {
    state.nodeId = nodeId;
  }
  
  if (hand) {
    state.hand = hand;
  }
  
  return state;
}
