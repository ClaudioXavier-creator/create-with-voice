
/**
 * Simple utility to print a specific HTML element
 * It creates a temporary window and ensures styles are preserved
 */
export const printElement = (elementId: string, options: { 
  title?: string, 
  landscape?: boolean,
  className?: string 
} = {}) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita pop-ups para imprimir.');
    return;
  }

  // Get all current styles from the main document
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(style => style.outerHTML)
    .join('\n');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>${options.title || 'Impressão BPF Digital'}</title>
        ${styles}
        <style>
          @media print {
            @page {
              size: A4 ${options.landscape ? 'landscape' : 'portrait'};
              margin: 10mm;
            }
            body { 
              background: white !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .no-print { display: none !important; }
          }
          body { 
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background: #f9f9f9;
            padding: 20px;
          }
        </style>
      </head>
      <body class="${options.className || ''}">
        <div class="print-container">
          ${element.outerHTML}
        </div>
        <script>
          window.focus();
          // Ensure images and fonts are loaded before printing
          window.onload = () => {
            setTimeout(() => {
              window.print();
              // In some browsers, we can close the window after print dialog is closed
              // but we need to wait a bit for the dialog to actually open
              window.onfocus = () => { window.close(); };
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

