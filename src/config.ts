// Environment configuration
export const config = {
  // Cloudflare R2 bucket URL (replace with your public URL)
  CDN_URL: (import.meta as any).env?.VITE_CDN_URL || '',
  
  // Development mode (uses local files)
  isDevelopment: (import.meta as any).env?.DEV || false,
};

// Helper to build resource URLs
export function getResourceUrl(path: string): string {
  // Remove leading ./ if present
  const cleanPath = path.startsWith('./') ? path.substring(2) : path;
  
  // In development, use local files
  if (config.isDevelopment) {
    return `/${cleanPath}`;
  }
  
  // In production, use CDN if configured
  if (config.CDN_URL) {
    return `${config.CDN_URL}/${cleanPath}`;
  }
  
  // Fallback to local files
  return `/${cleanPath}`;
}

// Helper to build trainer asset URLs (always uses CDN in production)
export function getTrainerAssetUrl(filename: string): string {
  // In development, use local files
  if (config.isDevelopment) {
    return `/trainer/${filename}`;
  }
  
  // In production, ALWAYS use CDN
  if (config.CDN_URL) {
    return `${config.CDN_URL}/trainer/${filename}`;
  }
  
  // Fallback to local files
  return `/trainer/${filename}`;
}

// Metadata helper - ALWAYS uses a local file served by Vercel
// (metadata is versioned in git for automatic synchronization)
export function getMetadataUrl(filename: string): string {
  // Always use the local file, both in dev and production
  // Vercel serves this file from the deployment
  return `/${filename}`;
}
