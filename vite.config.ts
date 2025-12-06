import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // This injects the API key from Vercel environment variables into the code
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Polyfill process.env to prevent crashes if other env vars are accessed
      'process.env': {} 
    }
  };
});