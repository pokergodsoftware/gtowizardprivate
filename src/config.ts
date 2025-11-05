// Configuração de ambiente
export const config = {
  // URL do bucket R2 Cloudflare (substitua pela sua URL pública)
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

// Função helper para construir URLs de assets do trainer (sempre usa CDN em produção)
export function getTrainerAssetUrl(filename: string): string {
  // Em desenvolvimento, usa arquivos locais
  if (config.isDevelopment) {
    return `/trainer/${filename}`;
  }
  
  // Em produção, SEMPRE usa CDN
  if (config.CDN_URL) {
    return `${config.CDN_URL}/trainer/${filename}`;
  }
  
  // Fallback para arquivos locais
  return `/trainer/${filename}`;
}

// Função helper para metadata - SEMPRE usa arquivo local servido pelo Vercel
// (metadata está versionado no git para sincronização automática)
export function getMetadataUrl(filename: string): string {
  // Sempre usa arquivo local, tanto em dev quanto em produção
  // O Vercel serve este arquivo do próprio deploy
  return `/${filename}`;
}
