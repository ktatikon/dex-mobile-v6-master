import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Detect if running in tunnel environment
  const isTunnel = process.env.CODESPACES || process.env.GITPOD_WORKSPACE_URL;

  return {
  base: '/',
  server: {
    host: "0.0.0.0",
    port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
    strictPort: false, // Allow port fallback
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    hmr: {
      port: process.env.HMR_PORT ? parseInt(process.env.HMR_PORT) : undefined,
      host: '0.0.0.0' // Allow HMR from network IP as well
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Fix ethers v6 compatibility issues with Uniswap V4 SDK
      "ethers/lib/utils": "ethers/lib/utils.js",
      "ethers/lib": "ethers/lib",
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      external: ['http', 'https', 'assert', 'stream', 'util'],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['plotly.js-dist-min'], // recharts removed
          crypto: ['@metamask/sdk', '@phantom/wallet-sdk']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.env.REACT_APP_USE_CHART_MICROSERVICE': JSON.stringify(process.env.REACT_APP_USE_CHART_MICROSERVICE || 'true'),
    'process.env.REACT_APP_CHART_API_URL': JSON.stringify(process.env.REACT_APP_CHART_API_URL || 'http://localhost:4000/api/v1'),
    global: 'globalThis',
    'process.env': '{}',
    'process.version': '"v18.0.0"',
    'process.platform': '"browser"'
  },
  optimizeDeps: {
    include: ['ethers'],
    exclude: ['@uniswap/smart-order-router']
  }
  };
});
