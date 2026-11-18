// ============================================================
// build-page — converte o HTML do Claude Design em página Astro
// ============================================================
// Uso:  node tools/build-page.mjs
// Entrada: design/debutantes.html (HTML recebido do time, sem base64)
// Saída:   src/pages/debutantes.astro · src/styles/debutantes.css · src/scripts/debutantes.js
//
// O que faz:
//  - imagens: imagens/<nome>.jpg|png -> CDN (config.media.cdn_base + /photos/<nome>.webp)
//  - <style>  -> src/styles/debutantes.css (global; a página usa classes do design)
//  - <script> -> src/scripts/debutantes.js (sem a lógica de formulário)
//  - <form>   -> <FormContato /> (padrão Dmove: preset + forms.ts)
//  - head     -> title/description via <Base>; fontes do Google e theme-color no slot "head"
//
// Os arquivos gerados são ponto de partida: depois de rodar, ajustes finos podem ser feitos
// direto neles. Rodar de novo sobrescreve tudo.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'debutantes';

const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, content) => {
  const full = path.join(root, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  console.log('✓', p, `(${(content.length / 1024).toFixed(1)} KB)`);
};

const html = read(`design/${slug}.html`);
const pick = (re, nome) => {
  const m = html.match(re);
  if (!m) throw new Error(`Não encontrei ${nome} em design/${slug}.html`);
  return m[1];
};

const head = pick(/<head>([\s\S]*?)<\/head>/, '<head>');
const title = pick(/<title>([\s\S]*?)<\/title>/, '<title>').trim();
const description = head.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
const themeColor = head.match(/<meta name="theme-color" content="([^"]*)"/)?.[1] ?? '';
const fontsHref = head.match(/<link href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/)?.[1] ?? '';
const css = pick(/<style>([\s\S]*?)<\/style>/, '<style>');
const js = pick(/<script>([\s\S]*?)<\/script>/, '<script>');
let body = pick(/<body>([\s\S]*?)<\/body>/, '<body>').replace(/<script>[\s\S]*?<\/script>/, '');

// ---------- corpo ----------
// 1) formulário do design -> componente padrão
const formRe = /[ \t]*<!-- Envio e integração[\s\S]*?<\/form>/;
if (!formRe.test(body)) throw new Error('Formulário do design não encontrado (marcador "Envio e integração").');
body = body.replace(formRe, '    <FormContato tipoPadrao="Aniversario debutante" />');

// 2) imagens locais -> CDN (jpg/png viram .webp; svg/webp mantêm a extensão)
body = body.replace(/src="imagens\/([^"]+?)\.(jpe?g|png)"/g, (_, nome) => 'src={`${cdn}/' + nome + '.webp`}');
body = body.replace(/src="imagens\/([^"]+?)\.(svg|webp)"/g, (_, nome, ext) => 'src={`${cdn}/' + nome + '.' + ext + '`}');
if (/imagens\//.test(body)) throw new Error('Sobrou referência a "imagens/" no corpo.');
if (/[{}]/.test(body.replace(/\{`\$\{cdn\}\/[^`]+`\}/g, ''))) {
  throw new Error('Chaves { } soltas no corpo: o Astro as trataria como expressão.');
}
if (/imagens\//.test(css)) throw new Error('Sobrou referência a "imagens/" no CSS.');

// ---------- CSS ----------
const cssOut = `/* GERADO por tools/build-page.mjs a partir de design/${slug}.html */

/* --- ajustes para coexistir com o global.css do template --- */
:root{--font-display:var(--fonte-titulo);--font-body:var(--fonte-texto)}
p{color:inherit;line-height:inherit}

${css.trim()}

/* --- calendário (Flatpickr) no tema do design; "body" sobe a especificidade sobre a lib --- */
body .flatpickr-calendar{background:var(--cor-vinho);border:1px solid var(--cor-linha);box-shadow:0 18px 50px rgba(0,0,0,.55);font-family:var(--fonte-texto);color:var(--cor-perola);border-radius:6px}
body .flatpickr-calendar:before,body .flatpickr-calendar:after{display:none}
body .flatpickr-months .flatpickr-month,body .flatpickr-current-month .flatpickr-monthDropdown-months,body .flatpickr-current-month input.cur-year,body span.flatpickr-weekday,body .flatpickr-day{color:var(--cor-perola);fill:var(--cor-perola)}
body .flatpickr-current-month .flatpickr-monthDropdown-months{background:var(--cor-vinho)}
body .flatpickr-months .flatpickr-prev-month svg,body .flatpickr-months .flatpickr-next-month svg{fill:var(--cor-dourado)}
body .flatpickr-months .flatpickr-prev-month:hover svg,body .flatpickr-months .flatpickr-next-month:hover svg{fill:var(--cor-dourado-claro)}
body .flatpickr-day{border-radius:4px}
body .flatpickr-day:hover,body .flatpickr-day:focus{background:rgba(216,169,109,.18);border-color:transparent}
body .flatpickr-day.today{border-color:var(--cor-dourado)}
body .flatpickr-day.selected,body .flatpickr-day.selected:hover{background:var(--cor-dourado);border-color:var(--cor-dourado);color:var(--cor-vinho)}
body .flatpickr-day.prevMonthDay,body .flatpickr-day.nextMonthDay{color:var(--cor-perola-fraca)}
body .flatpickr-day.flatpickr-disabled,body .flatpickr-day.flatpickr-disabled:hover{color:rgba(248,240,235,.22)}
`;

// ---------- JS ----------
const formJsRe = /\n  \/\* ---------- formulário ----------[\s\S]*?addEventListener\('submit'[^\n]*\n/;
if (!formJsRe.test(js)) throw new Error('Bloco de formulário do script não encontrado.');
const jsOut = `/* GERADO por tools/build-page.mjs a partir de design/${slug}.html
   Interações visuais da LP. O envio do formulário NÃO está aqui: vive em src/scripts/forms.ts. */${js.replace(formJsRe, '\n').trimEnd()}\n`;

// ---------- página ----------
const page = `---
// GERADO por tools/build-page.mjs a partir de design/${slug}.html
import Base from '../layouts/Base.astro';
import FormContato from '../components/FormContato.astro';
import config from '../../config.json';
import '../styles/${slug}.css';

const cdn = \`\${config.media.cdn_base}/photos\`;
const canonical = \`https://\${config.domain}/${slug}/\`;
---

<Base
  title=${JSON.stringify(title)}
  description=${JSON.stringify(description)}
  ogImage={\`\${cdn}/hero.webp\`}
  canonical={canonical}
  favicon={\`\${cdn}/favicon.webp\`}
  appleTouchIcon={\`\${cdn}/apple-touch-icon.webp\`}
  hideWhatsApp={true}
>
  <Fragment slot="head">
${themeColor ? `    <meta name="theme-color" content="${themeColor}" />\n` : ''}    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="${fontsHref}" rel="stylesheet" />
  </Fragment>
${body.trimEnd()}

  <script>
    import '../scripts/${slug}.js';
  </script>
</Base>
`;

write(`src/styles/${slug}.css`, cssOut);
write(`src/scripts/${slug}.js`, jsOut);
write(`src/pages/${slug}.astro`, page);
