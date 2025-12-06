import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third argument '' loads all env vars regardless of prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Prioritize the key from env files, fallback to process.env for Vercel system vars
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
      // Polyfill process.env for libs that might expect it, but empty to avoid leaking secrets
      'process.env': {} 
    }
  };
});