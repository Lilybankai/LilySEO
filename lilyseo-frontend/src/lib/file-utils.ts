import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Gets or creates the cache directory for temporary files
 * @returns The path to the cache directory
 */
export function getCacheDir(): string {
  const cacheDir = path.join(os.tmpdir(), 'lilyseo-cache');
  
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  return cacheDir;
} 