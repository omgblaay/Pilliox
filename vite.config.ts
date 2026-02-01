import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Plugin to handle figma:asset imports for mobile builds
function figmaAssetPlugin() {
  return {
    name: 'figma-asset-handler',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        // Return a virtual module ID
        return '\0' + id
      }
    },
    load(id: string) {
      if (id.startsWith('\0figma:asset/')) {
        // Extract the asset hash from the ID
        const assetHash = id.replace('\0figma:asset/', '')
        
        // For mobile builds, return a placeholder or data URL
        // This creates a simple 1x1 transparent pixel as fallback
        const fallbackDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
        
        return `export default "${fallbackDataUrl}"`
      }
    }
  }
}

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    figmaAssetPlugin(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      // Ensure proper handling of external modules
      external: [],
    },
  },
})