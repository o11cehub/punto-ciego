import { TUTOR_SYSTEM_PROMPT } from '../lib/systemPrompts.js';
import { callAI, safeParseJSON } from '../lib/apiUtils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { code, problemDescription, language, history } = req.body || {};

  if (!code || !code.trim() || !problemDescription || !problemDescription.trim()) {
    return res.status(400).json({ error: 'Falta el código o la descripción del problema.' });
  }

  const initialUserMessage = `Código (${language || 'javascript'}):\n```\n${code}\n```\n\nQué está pasando: ${problemDescription}`;

  // Filtramos la historia por si llega algo mal formado desde el
  // cliente. No confiamos ciegamente en lo que manda el frontend.
  const safeHistory = Array.isArray(history)
    ? history.filter(
        (turn) =>
          turn &&
          (turn.role === 'user' || turn.role === 'assistant') &&
          typeof turn.content === 'string'
      )
    : [];

  // El modelo ve sus propias preguntas anteriores envueltas en el mismo
  // JSON que le pedimos que use, para reforzar el patrón de formato a
  // lo largo de la conversación.
  const conversationTurns = [
    { role: 'user', content: initialUserMessage },
    ...safeHistory.map((turn) => ({
      role: turn.role,
      content: turn.role === 'assistant' ? JSON.stringify({ message: turn.content }) : turn.content,
    })),
  ];

  try {
    const rawText = await callAI({
      system: TUTOR_SYSTEM_PROMPT,
      messages: conversationTurns,
      maxTokens: 500,
    });

    const parsed = safeParseJSON(rawText);

    if (!parsed || typeof parsed.message !== 'string' || !parsed.message.trim()) {
      console.error('Respuesta sin formato esperado:', rawText);
      return res.status(502).json({ error: 'La IA respondió en un formato inesperado. Probá de nuevo.' });
    }

    return res.status(200).json({ message: parsed.message });
  } catch (err) {
    console.error('Error en /api/tutor:', err);
    return res.status(502).json({ error: 'Error al consultar la IA. Probá de nuevo en unos segundos.' });
  }
}
