import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'landing.html'),
        employerProfile: resolve(__dirname, 'employer-profile.html'),
        studentLogin: resolve(__dirname, 'studentlogin.html'),
        // Add other HTML entry points as needed
      },
    },
    minify: 'terser',
  },
  server: {
    port: 3000,
    open: '/landing.html',
  },
});
