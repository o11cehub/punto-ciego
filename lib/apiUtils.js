// Funciones compartidas por las dos serverless functions (api/tutor.js
// y api/summary.js). Viven fuera de /api a propósito: cualquier archivo
// .js suelto directamente dentro de /api se convierte en un endpoint en
// Vercel, y este no tiene que serlo.

// Google renueva los nombres de modelo seguido y da de baja los viejos
// para cuentas nuevas. Si ves un 404, el mensaje de error de Google te
// dice cuál usar en su lugar: cambiá esta única línea.
const MODEL = 'gemini-3.6-flash';

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Esquemas de salida. Pedir 'application/json' a secas no alcanza: sin
// esquema, el modelo elige los nombres de los campos y puede devolver
// {question: ...} en vez de {message: ...} aunque el prompt lo pida.
// Con esto la forma queda garantizada por la API, no por buena voluntad.
export const TUTOR_SCHEMA = {
  type: 'OBJECT',
  properties: { message: { type: 'STRING' } },
  required: ['message'],
};

export const SUMMARY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    blindSpotTitle: { type: 'STRING' },
    blindSpotExplanation: { type: 'STRING' },
    encouragement: { type: 'STRING' },
  },
  required: ['blindSpotTitle', 'blindSpotExplanation', 'encouragement'],
};

/**
 * Llama a la API de Gemini y devuelve el texto crudo de la respuesta.
 * Lanza un error si la llamada falla o si vuelve vacía.
 */
export async function callAI({ system, messages, schema, maxTokens = 2000 }) {
  // Gemini usa el rol 'model' donde otras APIs usan 'assistant'. El resto
  // del proyecto habla en términos de 'assistant', así que la traducción
  // vive acá y ningún otro archivo se entera.
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const generationConfig = {
    // Ojo con este número: los modelos que razonan antes de responder
    // gastan esos tokens del mismo presupuesto. Con un límite bajo el
    // modelo puede gastarlo todo pensando y devolver vacío.
    maxOutputTokens: maxTokens,
    responseMimeType: 'application/json',
  };
  if (schema) generationConfig.responseSchema = schema;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents,
      generationConfig,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Gemini API error:', response.status, errText);
    // El 429 es el más frecuente en el tier gratuito y conviene
    // distinguirlo: no es un bug, es cuota agotada.
    if (response.status === 429) {
      throw new Error('GEMINI_CUOTA_AGOTADA');
    }
    throw new Error('GEMINI_API_ERROR: ' + response.status + ' ' + errText.slice(0, 300));
  }

  const data = await response.json();

  const candidate = data?.candidates?.[0];
  const texto = (candidate?.content?.parts || [])
    .map((part) => part.text || '')
    .filter(Boolean)
    .join('\n');

  if (!texto) {
    // finishReason distingue 'lo bloqueó el filtro' de 'se quedó sin
    // tokens razonando'. Sin esto el error es indiagnosticable.
    const motivo = JSON.stringify({
      finishReason: candidate?.finishReason,
      blockReason: data?.promptFeedback?.blockReason,
      usage: data?.usageMetadata,
    });
    console.error('Gemini no devolvió texto:', motivo);
    throw new Error('GEMINI_EMPTY: ' + motivo);
  }

  return texto;
}

/**
 * Red de seguridad por si el texto viene envuelto en markdown o con
 * texto extra alrededor del JSON. Con responseSchema rara vez hace falta.
 */
export function safeParseJSON(text) {
  if (!text) return null;

  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}
