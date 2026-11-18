// ============================================================
// DATEPICKER DO FORMULÁRIO — máscara dd/mm/aaaa + Flatpickr pt-BR
// ============================================================
// Uso: <input data-datepicker> (type="text"). O Flatpickr (~50 KB JS + ~15 KB CSS)
// só é baixado quando o campo recebe foco pela primeira vez, para ficar fora do
// caminho crítico (ver docs/performance.md, regras 6 e 7). O CSS base da lib vem de
// public/vendor/ e é injetado sob demanda; o tema fica no CSS da página.

type FlatpickrLib = { flatpickr: any; Portuguese: any };

let libPromise: Promise<FlatpickrLib> | null = null;

function ensureCss() {
  if (document.getElementById('flatpickr-css')) return;
  const link = document.createElement('link');
  link.id = 'flatpickr-css';
  link.rel = 'stylesheet';
  link.href = '/vendor/flatpickr.min.css';
  document.head.appendChild(link);
}

function loadLib(): Promise<FlatpickrLib> {
  if (!libPromise) {
    ensureCss();
    libPromise = Promise.all([
      import('flatpickr'),
      import('flatpickr/dist/l10n/pt.js'),
    ]).then(([fp, l10n]) => ({ flatpickr: fp.default, Portuguese: l10n.Portuguese }));
  }
  return libPromise;
}

function applyDateMask(input: HTMLInputElement) {
  input.addEventListener('input', () => {
    const v = input.value.replace(/\D/g, '').slice(0, 8);
    if (v.length > 4) input.value = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    else if (v.length > 2) input.value = `${v.slice(0, 2)}/${v.slice(2)}`;
    else input.value = v;
  });
}

export function initDatepickers() {
  document.querySelectorAll<HTMLInputElement>('input[data-datepicker]').forEach((input) => {
    if (input.dataset.datepickerReady) return;
    input.dataset.datepickerReady = 'true';

    applyDateMask(input);

    input.addEventListener(
      'focus',
      async () => {
        const { flatpickr, Portuguese } = await loadLib();
        const fp = flatpickr(input, {
          locale: Portuguese,
          dateFormat: 'd/m/Y',
          minDate: 'today',
          allowInput: true,
          // Mantém o mesmo calendário (e a máscara) no celular, em vez do seletor nativo,
          // para o input continuar sendo texto e o valor chegar sempre em dd/mm/aaaa.
          disableMobile: true,
        });
        fp.open();
      },
      { once: true },
    );
  });
}
