# Punto Ciego

Un tutor de debugging que no te da la respuesta. Pegás código que no hace lo que pensás, y en vez de un fix te hace preguntas cada vez más específicas hasta que lo encontrás vos. Al final, te dice cuál fue tu punto ciego conceptual — no el bug puntual, el malentendido de fondo — y cuántas pistas necesitaste.

Construido para la CoderCup AI de Coderhouse.

---

## Cómo está armado

```
Vos pegás código + "qué esperabas vs. qué pasa"
        │
        ▼
  /api/tutor  ──────────►  Gemini API (una pregunta por vez, en JSON)
        │
        ▼
  Conversación de ida y vuelta
        │
        ▼
  Hacés clic en "Ya lo resolví"
        │
        ▼
  /api/summary ─────────►  Gemini API (identifica el punto ciego)
        │
        ▼
  Resumen + se guarda en el historial (localStorage)
```

Frontend: React + Vite + Tailwind v4. Backend: dos serverless functions de Vercel que llaman a la API de Gemini con `fetch` nativo, sin SDK. No hay base de datos — el historial vive en el `localStorage` del navegador.

Los dos prompts que definen todo el comportamiento están en `lib/systemPrompts.js`. Si el tutor da respuestas de más, o de menos, es ahí donde se ajusta.

---

## Setup

### 1. Instalar

```bash
npm install
```

### 2. API key de Gemini

Entrá a [aistudio.google.com/apikey](https://aistudio.google.com/apikey) y creá una key. Es gratis y no pide tarjeta: tiene tier gratuito con límite diario que para este proyecto sobra.

Copiá `.env.example` a `.env` y pegala ahí.

### 3. Correr en local

Este proyecto tiene páginas de React *y* serverless functions. Vite solo (`npm run dev`) no ejecuta las de `/api`:

```bash
npm install -g vercel
vercel login
vercel dev
```

---

## Deploy a Vercel

1. Importá el repo en [vercel.com](https://vercel.com) → Add New → Project
2. **Application Preset: Vite** (si dice "Other", cambialo — si no, el build falla)
3. En **Environment Variables**, agregá `GEMINI_API_KEY` con tu clave. Marcá los tres entornos.
4. Deploy
5. Probá los 3 casos de ejemplo en la URL pública antes de grabar

---

## Los 3 casos de prueba

Ya están cargados en la app (botones abajo del formulario):

| Caso | Bug | Punto ciego esperado |
|---|---|---|
| Avisos con setTimeout | `var` en vez de `let` en un bucle | Closures y scope |
| Código postal | `==` con coerción de tipos | Comparación laxa |
| Resumen del carrito | Mutación de array por referencia | Referencia vs. valor |

---

## Guion para el video (2 minutos)

**0:00–0:20 — El problema, en primera persona.** "Cuando aprendía a programar, pegaba el error en ChatGPT, copiaba el fix, y seguía sin entender qué había pasado."

**0:20–1:30 — La demo.** Cargá el Caso 1. Mostrá la primera pregunta. Contestá "no sé" una vez, para mostrar que el tutor baja un escalón en vez de repetirse. Contestá bien la segunda. Clic en "Ya lo resolví". Mostrá el resumen.

**1:30–1:50 — El diferencial.** "Lo que la mayoría de los tutores con IA no hace: no solo te ayuda a resolver el bug, te dice cuál es tu patrón de error."

**1:50–2:00 — Cierre.**

Consejos: grabá en incógnito para que el historial arranque vacío. Grabá 2-3 tomas. Subtítulos si podés. No expliques la arquitectura técnica — mostrá el producto andando.

---

## Problemas comunes

**"Error al consultar la IA"** — Tres causas, en orden de probabilidad:
1. La API key no está cargada en Vercel, o tiene un typo.
2. El nombre del modelo quedó viejo. Google los renueva seguido: si en los logs de Vercel ves un 404, entrá a aistudio.google.com/apikey, mirá qué modelos tenés disponibles, y cambiá la constante `MODEL` en `lib/apiUtils.js`.
3. Te pasaste del límite diario del tier gratuito (error 429).

**El contador de pistas no coincide** — Se cuenta cada pregunta del tutor, no cada mensaje tuyo. Si una respuesta no llegó a procesarse, no cuenta como pista.

---

## Estructura

```
lib/
  systemPrompts.js   Los dos prompts — el corazón del proyecto
  apiUtils.js        Llamada a Gemini + parseo robusto de JSON
api/
  tutor.js           Genera la siguiente pregunta socrática
  summary.js         Genera el resumen de punto ciego
src/
  App.jsx            Orquesta las 4 pantallas
  hooks/             Máquina de estados de la sesión
  lib/               Historial local y casos de ejemplo
  components/        Pantallas y piezas de UI
```
