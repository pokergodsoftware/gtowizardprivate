/**
 * Centralized error messages for consistent user feedback
 */

export const ERROR_MESSAGES = {
  // File Upload Errors
  INVALID_FOLDER: 'Invalid solution folder. Make sure settings.json, equity.json and the nodes/ folder are present.',
  MISSING_SETTINGS: 'settings.json file not found in the selected folder.',
  MISSING_EQUITY: 'equity.json file not found in the selected folder.',
  MISSING_NODES: 'nodes/ folder not found or is empty.',
  INVALID_JSON: (fileName: string) => `Failed to process ${fileName}: invalid JSON format.`,

  // Network Errors
  NETWORK_ERROR: 'Network error. Check your connection and try again.',
  TIMEOUT_ERROR: 'The request timed out. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',

  // Solution Loading Errors
  SOLUTIONS_NOT_FOUND: 'No solutions found. The library is empty.',
  SOLUTION_NOT_FOUND: (id: string) => `Solution with ID ${id} not found.`,
  METADATA_LOAD_FAILED: 'Failed to load solutions index.',
  METADATA_INVALID: 'Solutions index format is corrupted.',

  // Node Loading Errors
  NODE_NOT_FOUND: (nodeId: number) => `Node ${nodeId} not found in this solution.`,
  NODE_LOAD_FAILED: (nodeId: number) => `Failed to load node ${nodeId}.`,
  NO_NODES_LOADED: 'No nodes were loaded. The solution may be corrupted.',
  SOLUTION_NO_PATH: 'Solution does not have a loading path defined.',

  // Firebase Errors
  FIREBASE_INIT_ERROR: 'Failed to initialize Firebase. Some features may be unavailable.',
  FIREBASE_SYNC_ERROR: 'Failed to sync data with the server. Data was saved locally.',
  AUTH_ERROR: 'Authentication error. Please log in again.',

  // Generic Errors
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  PARSE_ERROR: 'Failed to parse data.',
} as const;

/**
 * Error types for categorization
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  FILE = 'FILE',
  PARSE = 'PARSE',
  NOT_FOUND = 'NOT_FOUND',
  FIREBASE = 'FIREBASE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Custom error class with type and user-friendly message
 */
export class AppError extends Error {
  constructor(
    public userMessage: string,
    public type: ErrorType = ErrorType.UNKNOWN,
    public originalError?: Error
  ) {
    super(userMessage);
    this.name = 'AppError';
    
    // Maintain proper stack trace (only in V8 engines like Chrome/Node)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Determine error type from Error object
 */
export function getErrorType(error: unknown): ErrorType {
  if (error instanceof AppError) {
    return error.type;
  }
  
  if (error instanceof TypeError || error instanceof SyntaxError) {
    return ErrorType.PARSE;
  }
  
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return ErrorType.NETWORK;
  }
  
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return ErrorType.NOT_FOUND;
  }
  
  if (errorMessage.includes('file') || errorMessage.includes('upload')) {
    return ErrorType.FILE;
  }
  
  if (errorMessage.includes('firebase')) {
    return ErrorType.FIREBASE;
  }
  
  return ErrorType.UNKNOWN;
}

/**
 * Get user-friendly error message
 */
export function getUserMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }
  
  if (error instanceof Error) {
    const type = getErrorType(error);
    
    switch (type) {
      case ErrorType.NETWORK:
        return ERROR_MESSAGES.NETWORK_ERROR;
      case ErrorType.PARSE:
        return ERROR_MESSAGES.PARSE_ERROR;
      case ErrorType.NOT_FOUND:
        return ERROR_MESSAGES.SOLUTIONS_NOT_FOUND;
      case ErrorType.FIREBASE:
        return ERROR_MESSAGES.FIREBASE_SYNC_ERROR;
      default:
        // In production, don't expose internal error messages
        return (import.meta as any).env?.DEV
          ? error.message 
          : ERROR_MESSAGES.UNKNOWN_ERROR;
    }
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Retry logic for network requests
 */
export async function retryFetch(
  url: string,
  options?: RequestInit,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<Response> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If successful or client error (4xx), don't retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      // Server error (5xx), retry
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If last attempt or not a network error, throw immediately
      if (attempt === maxRetries || !isNetworkError(error)) {
        throw new AppError(
          ERROR_MESSAGES.NETWORK_ERROR,
          ErrorType.NETWORK,
          lastError
        );
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw new AppError(
    ERROR_MESSAGES.NETWORK_ERROR,
    ErrorType.NETWORK,
    lastError
  );
}

/**
 * Check if error is network-related
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true; // fetch throws TypeError for network errors
  }
  
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return message.includes('network') || 
         message.includes('fetch') || 
         message.includes('timeout');
}
