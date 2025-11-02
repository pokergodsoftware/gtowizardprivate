// Configuração de ambiente
export const config = {
  // URL do bucket R2 Cloudflare
  CDN_URL: (import.meta as any).env?.VITE_CDN_URL || '',
  
  // Modo de desenvolvimento (usa arquivos locais)
  isDevelopment: (import.meta as any).env?.DEV || false,
};

// Função helper para construir URLs de recursos
export function getResourceUrl(path: string): string {
  // Remover ./ do início se existir
  const cleanPath = path.startsWith('./') ? path.substring(2) : path;
  
  // Em desenvolvimento, usa arquivos locais
  if (config.isDevelopment) {
    return `/${cleanPath}`;
  }
  
  // Em produção, usa CDN se configurado
  if (config.CDN_URL) {
    return `${config.CDN_URL}/${cleanPath}`;
  }
  
  // Fallback para arquivos locais
  return `/${cleanPath}`;
}
