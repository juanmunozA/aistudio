export const renderStyledMarkdown = (text: string) => {
  if (!text) return null;
  
  let contentToProcess = text.trim();

  contentToProcess = contentToProcess.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');

  if (contentToProcess.startsWith('"') && contentToProcess.endsWith('"')) {
    contentToProcess = contentToProcess.substring(1, contentToProcess.length - 1);
  }

  try {
    const isPossiblyJson = (contentToProcess.startsWith('{') && contentToProcess.endsWith('}')) || (contentToProcess.startsWith('[') && contentToProcess.endsWith(']'));
    if (isPossiblyJson) {
      const parsed = JSON.parse(contentToProcess);
      if (typeof parsed === 'object' && parsed !== null) {
        const flattenToMarkdown = (obj: any, depth = 0): string => {
          let output = "";
          if (Array.isArray(obj)) {
            obj.forEach((item) => {
              output += flattenToMarkdown(item, depth);
            });
          } else if (typeof obj === 'object' && obj !== null) {
            Object.entries(obj).forEach(([key, value]) => {
              const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              if (typeof value === 'object' && value !== null) {
                if (depth === 0 && Object.keys(obj).length === 1) {
                  output += flattenToMarkdown(value, depth);
                } else {
                  output += `\n**${formattedKey}**\n${flattenToMarkdown(value, depth + 1)}\n`;
                }
              } else {
                output += `\n**${formattedKey}:** ${value}\n`;
              }
            });
          } else {
            output += String(obj) + "\n";
          }
          return output;
        };
        contentToProcess = flattenToMarkdown(parsed);
      }
    }
  } catch (e) {}

  contentToProcess = contentToProcess.replace(/([0-9]+\.\s)/g, '\n$1');
  contentToProcess = contentToProcess.replace(/(•\s)/g, '\n$1');

  const lines = contentToProcess.split('\n').filter(l => l.trim() !== "");
  
  const headerKeywords = [
    "REPORTE EXPERIMENTAL", "MECANISMO DE FALLA", "OBJETIVO DEL EXPERIMENTO", 
    "VARIABLES", "EQUIPOS", "PROCEDIMIENTO", "CRITERIO DE CONFIRMACIÓN",
    "PROTOCOL DE CONTENCIÓN", "RESUMEN EJECUTIVO", "EVALUACIÓN DE RIESGOS",
    "EXPERIMENTAL REPORT", "FAILURE MECHANISM", "EXPERIMENTAL OBJECTIVE",
    "CONTAINMENT PROTOCOL", "EXECUTIVE SUMMARY", "RISK ASSESSMENT",
    "CRITERIO DE CONFIRMACIÓN FINAL", "PROCEDIMIENTO PASO A PASO",
    "PROCEDIMIENTO OPERATIVO ESTÁNDAR", "STANDARD OPERATING PROCEDURE",
    "DESPLIEGUE HORIZONTAL", "HORIZONTAL DEPLOYMENT", "LECCIÓN APRENDIDA",
    "CONTRAMEDIDAS", "VALIDACIÓN Y CIERRE", "OBJETIVO", "ALCANCE",
    "RESPONSABILIDADES", "DEFINICIONES", "SEGURIDAD", "CALIDAD"
  ];

  return lines.map((line, i) => {
    const trimmedLine = line.trim();
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = line.split(boldRegex);
    
    const hasBold = parts.length >= 3;
    const boldText = hasBold ? parts[1].toUpperCase() : "";
    
    const isMainHeader = hasBold && (
        (parts[0].trim() === "" && parts[2].trim() === "") || 
        headerKeywords.some(k => boldText.includes(k))
    );
    
    const isKeyLabel = trimmedLine.startsWith('**') && trimmedLine.includes(':**');

    if (isMainHeader && !isKeyLabel) {
        const trailingText = parts.slice(2).join('').trim().replace(/^[:\s-]+/, '');
        
        return (
            <div key={i} className="animate-slide-in">
                <div className="mb-4 mt-8 bg-slate-100 border-l-8 border-slate-900 px-6 py-4 rounded-r-2xl shadow-sm">
                    <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest leading-none">
                        {parts[1]}
                    </span>
                </div>
                {trailingText !== "" && (
                    <div className="mb-3 text-slate-700 leading-relaxed text-sm antialiased pl-6 font-medium">
                        {trailingText}
                    </div>
                )}
            </div>
        );
    }

    const content = parts.map((part, index) => {
      if (index % 2 === 1) {
        const cleanPart = part.replace(/:$/, '');
        return (
          <strong key={index} className="text-slate-900 font-extrabold tracking-tight bg-slate-50 px-1 rounded">
            {cleanPart}{part.endsWith(':') ? ':' : ''}
          </strong>
        );
      }
      return part;
    });

    return (
      <div key={i} className={`mb-3 text-slate-700 leading-relaxed text-sm antialiased ${trimmedLine.startsWith('•') || /^[0-9]+\./.test(trimmedLine) ? 'pl-6 relative' : ''}`}>
        {trimmedLine.startsWith('•') && <span className="absolute left-1 text-slate-400 font-black">•</span>}
        {content}
      </div>
    );
  });
};
