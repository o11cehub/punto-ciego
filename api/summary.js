import { SUMMARY_SYSTEM_PROMPT } from '../lib/systemPrompts.js';
import { callAI, safeParseJSON, SUMMARY_SCHEMA } from '../lib/apiUtils.js';

const FENCE = '```';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { code, problemDescription, language, history, hintsUsed, resolutionNote } = req.body || {};

  if (!Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: 'Falta la conversación de la sesión.' });
  }

  // El conteo de pistas lo calcula el frontend contando preguntas reales
  // del tutor. Pedirle a un LLM que cuente turnos de su propia
  // conversación es una fuente clásica de errores.
  const safeHintsUsed = Number.isFinite(hintsUsed)
    ? hintsUsed
    : history.filter((t) => t.role === 'assistant').length;

  const transcript = history
    .map((turn) => `${turn.role === 'assistant' ? 'Tutor' : 'Estudiante'}: ${turn.content}`)
    .join('\n');

  const notaResolucion =
    resolutionNote && resolutionNote.trim()
      ? `Nota del estudiante sobre cómo lo resolvió: ${resolutionNote.trim()}`
      : 'El estudiante no dejó una nota sobre cómo lo resolvió.';

  const userContent = [
    `Código original (${language || 'javascript'}):`,
    FENCE,
    code || '',
    FENCE,
    '',
    `Problema descrito por el estudiante: ${problemDescription || ''}`,
    '',
    `Cantidad de pistas (preguntas del tutor) que necesitó: ${safeHintsUsed}`,
    '',
    'Conversación completa:',
    transcript,
    '',
    notaResolucion,
  ].join('\n');

  try {
    const rawText = await callAI({
      system: SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
      schema: SUMMARY_SCHEMA,
      maxTokens: 2000,
    });

    const parsed = safeParseJSON(rawText);

    if (!parsed || typeof parsed.blindSpotTitle !== 'string' || !parsed.blindSpotTitle.trim()) {
      console.error('Respuesta sin formato esperado:', rawText);
      return res.status(502).json({
        error: 'La IA respondió en un formato inesperado. Probá de nuevo.',
        detalle: String(rawText).slice(0, 300),
      });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Error en /api/summary:', err);
    return res.status(502).json({
      error: 'Error al generar el resumen. Probá de nuevo en unos segundos.',
      detalle: String(err.message).slice(0, 300),
    });
  }
}
