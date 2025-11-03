/**
 * Centralized error messages for consistent user feedback
 */

export const ERROR_MESSAGES = {
  // File Upload Errors
  INVALID_FOLDER: 'Pasta de solução inválida. Certifique-se de incluir settings.json, equity.json e a pasta nodes/',
  MISSING_SETTINGS: 'Arquivo settings.json não encontrado na pasta selecionada.',
  MISSING_EQUITY: 'Arquivo equity.json não encontrado na pasta selecionada.',
  MISSING_NODES: 'Pasta nodes/ não encontrada ou vazia.',
  INVALID_JSON: (fileName: string) => `Erro ao processar ${fileName}: formato JSON inválido.`,
  
  // Network Errors
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet e tente novamente.',
  TIMEOUT_ERROR: 'A requisição demorou muito. Tente novamente.',
  SERVER_ERROR: 'Erro no servidor. Tente novamente em alguns instantes.',
  
  // Solution Loading Errors
  SOLUTIONS_NOT_FOUND: 'Nenhuma solução encontrada. A biblioteca está vazia.',
  SOLUTION_NOT_FOUND: (id: string) => `Solução com ID ${id} não encontrada.`,
  METADATA_LOAD_FAILED: 'Falha ao carregar o índice de soluções.',
  METADATA_INVALID: 'Formato do índice de soluções está corrompido.',
  
  // Node Loading Errors
  NODE_NOT_FOUND: (nodeId: number) => `Node ${nodeId} não encontrado nesta solução.`,
  NODE_LOAD_FAILED: (nodeId: number) => `Falha ao carregar node ${nodeId}.`,
  NO_NODES_LOADED: 'Nenhum node foi carregado. A solução pode estar corrompida.',
  SOLUTION_NO_PATH: 'Solução não possui caminho de carregamento definido.',
  
  // Firebase Errors
  FIREBASE_INIT_ERROR: 'Erro ao inicializar Firebase. Algumas funcionalidades podem não estar disponíveis.',
  FIREBASE_SYNC_ERROR: 'Falha ao sincronizar dados com o servidor. Os dados foram salvos localmente.',
  AUTH_ERROR: 'Erro de autenticação. Tente fazer login novamente.',
  
  // Generic Errors
  UNKNOWN_ERROR: 'Ocorreu um erro inesperado. Tente novamente.',
  PARSE_ERROR: 'Erro ao processar os dados.',
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
