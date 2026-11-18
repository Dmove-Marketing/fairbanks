import { defineConfig } from 'astro/config';

// Ajuste `site` para o domÃ­nio do projeto (usado em canonical/OG).
export default defineConfig({
  site: 'https://eventos.fairbanks.com.br',
  output: 'static',
  // SÃ³ hÃ¡ um funil por enquanto: a raiz leva direto para a LP de debutantes.
  redirects: { '/': '/debutantes/' },
  prefetch: true,
  build: {
    inlineStylesheets: 'always',
  },
  server: {
    port: 4321,
  },
});
