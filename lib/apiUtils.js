// Funciones compartidas por las dos serverless functions (api/tutor.js
// y api/summary.js). Viven fuera de /api a propósito: cualquier archivo
// .js suelto directamente dentro de /api se convierte en un endpoint en
// Vercel, y este no tiene que serlo.

// Si este nombre de modelo te da error 404, es porque Google los renueva
// seguido. Entrá a https://aistudio.google.com/apikey, fijate qué modelos
// te aparecen disponibles, y cambiá esta única línea.
// Alternativas conocidas: 'gemini-3.7-flash', 'gemini-2.5-flash'
const MODEL = 'gemini-3.5-flash';

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/**
 * Llama a la API de Gemini y devuelve el texto crudo de la respuesta.
 * Lanza un error si la llamada falla (401, 429, 500, etc.) para que
 * quien la use decida cómo responderle al usuario.
 */
export async function callAI({ system, messages, maxTokens = 500 }) {
  // Gemini usa el rol 'model' donde Anthropic usa 'assistant'. El resto
  // del proyecto sigue hablando en términos de 'assistant', así que la
  // traducción vive acá y ningún otro archivo se entera del cambio.
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        // Gemini tiene modo JSON nativo. Esto es mejor que solo pedirlo
        // en el prompt: el modelo queda obligado a devolver JSON válido,
        // así que casi nunca hace falta el rescate de safeParseJSON.
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Gemini API error:', response.status, errText);
    throw new Error('GEMINI_API_ERROR');
  }

  const data = await response.json();

  // Gemini puede devolver 200 sin ningún candidato si el filtro de
  // seguridad bloqueó la respuesta. Hay que contemplarlo, porque si no
  // se cae con un TypeError críptico en vez de un error entendible.
  const candidate = data?.candidates?.[0];
  if (!candidate) {
    console.error('Gemini no devolvió candidatos:', JSON.stringify(data));
    throw new Error('GEMINI_NO_CANDIDATES');
  }

  return (candidate.content?.parts || [])
    .map((part) => part.text || '')
    .filter(Boolean)
    .join('\n');
}

/**
 * Intenta parsear JSON de un texto que en teoría es JSON puro, pero que
 * a veces trae bloques de markdown (```json ... ```) o texto extra
 * alrededor. Con responseMimeType: 'application/json' esto rara vez hace
 * falta, pero lo dejamos como red de seguridad.
 * Devuelve null si no se pudo recuperar nada usable.
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
