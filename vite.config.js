import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  base: "/MaxoGo.github.io/",

  plugins: [
    basicSsl()
  ],

  optimizeDeps: {
    include: [
      "@maplibre/maplibre-gl-leaflet"
    ]
  },

  build: {
    commonjsOptions: {
      include: [
        /node_modules/
      ]
    }
  },

  server: {
    allowedHosts: true,
    host: true,
    https: true
  }
});

