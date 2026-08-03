import { readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

// Get all HTML files from the projects directory
const projectFiles = readdirSync('projects')
  .filter((file) => file.endsWith('.html'))
  .reduce((acc, file) => {
    const name = basename(file, '.html');
    acc[name] = join('projects', file);
    return acc;
  }, {});

export default defineConfig({
  plugins: [solidPlugin()],
  base: '/workbench/',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        ...projectFiles,
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Place project JS files in the projects directory
          if (chunkInfo.name !== 'main') {
            return 'projects/[name].js';
          }
          return '[name].js';
        },
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
});
