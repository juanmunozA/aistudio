/** Extrae el JSON de la respuesta del modelo aunque venga envuelto en ```json``` o con texto alrededor. */
export function extractJson(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  const blockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (blockMatch && blockMatch[1]) return blockMatch[1].trim();

  const objectStart = trimmed.indexOf('{');
  const arrayStart = trimmed.indexOf('[');
  const startIdx = Math.min(objectStart === -1 ? Infinity : objectStart, arrayStart === -1 ? Infinity : arrayStart);
  const endIdx = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));
  if (startIdx !== Infinity && endIdx !== -1 && endIdx > startIdx) return trimmed.substring(startIdx, endIdx + 1);
  return trimmed;
}
