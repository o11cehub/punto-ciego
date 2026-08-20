import { TUTOR_SYSTEM_PROMPT } from '../lib/systemPrompts.js';
import { callAI, safeParseJSON, TUTOR_SCHEMA } from '../lib/apiUtils.js';

// La cerca de markdown en una constante: adentro de comillas simples
// los backticks son texto común, mientras que sueltos dentro de un
// template literal lo cerrarían antes de tiempo.
const FENCE = '```';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { code, problemDescription, language, history } = req.body || {};

  if (!code || !code.trim() || !problemDescription || !problemDescription.trim()) {
    return res.status(400).json({ error: 'Falta el código o la descripción del problema.' });
  }

  const initialUserMessage =
    `Código (${language || 'javascript'}):\n${FENCE}\n${code}\n${FENCE}\n\nQué está pasando: ${problemDescription}`;

  const safeHistory = Array.isArray(history)
    ? history.filter(
        (turn) =>
          turn &&
          (turn.role === 'user' || turn.role === 'assistant') &&
          typeof turn.content === 'string'
      )
    : [];

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
      schema: TUTOR_SCHEMA,
      maxTokens: 2000,
    });

    const parsed = safeParseJSON(rawText);

    if (!parsed || typeof parsed.message !== 'string' || !parsed.message.trim()) {
      console.error('Respuesta sin formato esperado:', rawText);
      return res.status(502).json({
        error: 'La IA respondió en un formato inesperado. Probá de nuevo.',
        detalle: String(rawText).slice(0, 300),
      });
    }

    return res.status(200).json({ message: parsed.message });
  } catch (err) {
    console.error('Error en /api/tutor:', err);
    return res.status(502).json({
      error: 'Error al consultar la IA. Probá de nuevo en unos segundos.',
      detalle: String(err.message).slice(0, 300),
    });
  }
}
