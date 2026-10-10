// Motor único de reportes PDF: abre una ventana con el contenido y los estilos compilados
// de la aplicación y lanza la impresión del navegador (Guardar como PDF).

/** Estilos compilados de la aplicación para las ventanas de impresión (sin depender de CDNs). */
export const appStylesheets = () =>
  Array.from(document.querySelectorAll<HTMLStyleElement | HTMLLinkElement>('style, link[rel="stylesheet"]'))
    .map((node) => (node instanceof HTMLLinkElement ? `<link rel="stylesheet" href="${node.href}">` : node.outerHTML))
    .join('\n');

/** Escapa texto (por ejemplo, generado por la IA) antes de insertarlo en HTML. */
export const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const INTER_FONT = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">';

/** Documentos de cada disciplina (A4 horizontal). */
const DOCUMENT_STYLES = `
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: 'Inter', sans-serif; padding: 0; color: #1e293b; background: white; -webkit-print-color-adjust: exact; }
          .official-document { border: none !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; }
          .no-print { display: none !important; }
          h1, h2, h3 { page-break-after: avoid; }
          .page-break { page-break-before: always; }
          div { page-break-inside: auto; }
          .industrial-card { border: 1px solid #e2e8f0; border-radius: 1.5rem; background: #f8fafc; margin-bottom: 1.5rem; padding: 1.5rem; }`;

/** Reportes completos del caso (8D, eficacia, oportunidad de mejora). */
const REPORT_STYLES = `
              @media print {
                .page-break { page-break-before: always; }
                body { padding: 0; margin: 0; }
              }
              body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
              .industrial-card { border: 1px solid #e2e8f0; border-radius: 1.5rem; padding: 1.5rem; background-color: #ffffff; margin-bottom: 1.5rem; }`;

interface PrintOptions {
  title: string;
  head: string;
  body: string;
  windowFeatures?: string;
  delayMs: number;
  closeMode: 'afterprint' | 'immediate';
}

/**
 * Imprime la ventana de reporte desde la ventana principal (sin scripts dentro del
 * documento impreso, compatible con la Content Security Policy).
 */
export const printWindowAfter = (printWindow: Window, delayMs: number, closeMode: 'afterprint' | 'immediate') => {
  window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    if (closeMode === 'immediate') printWindow.close();
    else printWindow.onafterprint = () => printWindow.close();
  }, delayMs);
};

function openPrintWindow({ title, head, body, windowFeatures, delayMs, closeMode }: PrintOptions): boolean {
  const printWindow = window.open('', windowFeatures ? '' : '_blank', windowFeatures);
  if (!printWindow) return false;
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        ${appStylesheets()}
        ${head}
      </head>
      ${body}
    </html>
  `);
  printWindow.document.close();
  printWindowAfter(printWindow, delayMs, closeMode);
  return true;
}

/** Documento de una disciplina a partir de un elemento de la pantalla. */
export const handleDownloadPDF = (elementId: string, title: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  openPrintWindow({
    title,
    head: `${INTER_FONT}\n        <style>${DOCUMENT_STYLES}\n        </style>`,
    body: `<body>\n        <div class="max-w-full">\n          ${element.innerHTML}\n        </div>\n      </body>`,
    delayMs: 500,
    closeMode: 'afterprint',
  });
};

/** Reporte completo del caso (plantillas ocultas de la aplicación). */
export const printCaseReport = (elementId: string, title: string, caseName: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  const opened = openPrintWindow({
    title: `${title} - ${caseName || 'Reporte'}`,
    head: `<style>${REPORT_STYLES}\n            </style>`,
    body: `<body class="p-8 bg-white text-slate-900">\n            ${element.innerHTML}\n          </body>`,
    windowFeatures: 'width=1000,height=800',
    delayMs: 600,
    closeMode: 'immediate',
  });
  if (!opened) window.print();
};

export interface PokaYokeGuideItem {
  description: string;
  type: string;
  level?: string;
  benefit: string;
  details?: string;
}

/** Guía técnica con todos los Poka-Yoke confirmados (el texto de la IA se escapa). */
export const printPokaYokeGuide = (pokas: PokaYokeGuideItem[]) => {
  const sections = pokas
    .map(
      (p, idx) => `
                      <div class="${idx > 0 ? 'page-break mt-10' : ''}">
                        <div class="mb-6">
                          <h2 class="text-2xl font-black text-blue-600 uppercase tracking-tight">${escapeHtml(p.description)}</h2>
                          <div class="flex gap-2 mt-2">
                            <span class="px-2 py-1 bg-slate-100 text-[10px] font-black uppercase rounded">${escapeHtml(p.type)}</span>
                            <span class="px-2 py-1 bg-slate-100 text-[10px] font-black uppercase rounded">${escapeHtml(p.level)}</span>
                          </div>
                        </div>
                        <div class="p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                          <p class="text-[10px] font-black text-orange-600 uppercase mb-2 tracking-widest">Beneficio Esperado</p>
                          <p class="text-sm font-bold text-slate-600">${escapeHtml(p.benefit)}</p>
                        </div>
                        <div class="prose max-w-none">
                          ${p.details ? p.details.split('\n').map((line) => `<p class="text-sm text-slate-700 mb-2">${escapeHtml(line)}</p>`).join('') : ''}
                        </div>
                      </div>
                    `,
    )
    .join('');
  openPrintWindow({
    title: 'Guia_Tecnica_PokaYoke_Completa',
    head: `${INTER_FONT}\n                  <style>${DOCUMENT_STYLES}\n                  </style>`,
    body: `<body>
                  <div class="max-w-4xl mx-auto p-10">
                    <h1 class="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-10 border-b-4 border-slate-900 pb-4">Guía Técnica Poka-Yoke</h1>
                    ${sections}
                  </div>
                </body>`,
    delayMs: 500,
    closeMode: 'afterprint',
  });
};
