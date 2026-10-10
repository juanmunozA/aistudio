// Estilos compilados de la aplicación para las ventanas de impresión (sin depender de CDNs).
export const appStylesheets = () =>
  Array.from(document.querySelectorAll<HTMLStyleElement | HTMLLinkElement>('style, link[rel="stylesheet"]'))
    .map((node) => (node instanceof HTMLLinkElement ? `<link rel="stylesheet" href="${node.href}">` : node.outerHTML))
    .join('\n');

export const handleDownloadPDF = (elementId: string, title: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const content = element.innerHTML;

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        ${appStylesheets()}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: 'Inter', sans-serif; padding: 0; color: #1e293b; background: white; -webkit-print-color-adjust: exact; }
          .official-document { border: none !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; }
          .no-print { display: none !important; }
          h1, h2, h3 { page-break-after: avoid; }
          .page-break { page-break-before: always; }
          div { page-break-inside: auto; }
          .industrial-card { border: 1px solid #e2e8f0; border-radius: 1.5rem; background: #f8fafc; margin-bottom: 1.5rem; padding: 1.5rem; }
        </style>
      </head>
      <body>
        <div class="max-w-full">
          ${content}
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.onafterprint = () => window.close();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
