import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://nagyelshal.github.io',
  base: '/QPR_web/',
  output: 'static',
  build: {
    assets: 'assets'
  }
});
