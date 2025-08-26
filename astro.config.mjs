import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://nagyelshal.github.io',
  base: '/QPR_Web',
  output: 'static',
  build: {
    assets: 'assets'
  }
});
