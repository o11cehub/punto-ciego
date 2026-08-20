import { useReducer, useCallback } from 'react';
import { saveSession } from '../lib/storage.js';

const initialState = {
  // 'input' | 'loading-first' | 'questioning' | 'loading-next' | 'loading-summary' | 'summary'
  phase: 'input',
  code: '',
  problemDescription: '',
  language: 'javascript',
  conversation: [], // { role: 'assistant' | 'user', content: string }
  hintsUsed: 0,
  summary: null, // { blindSpotTitle, blindSpotExplanation, encouragement }
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...initialState,
        phase: 'loading-first',
        code: action.code,
        problemDescription: action.problemDescription,
        language: action.language,
      };
    case 'FIRST_QUESTION_RECEIVED':
      return {
        ...state,
        phase: 'questioning',
        conversation: [{ role: 'assistant', content: action.message }],
        hintsUsed: 1,
      };
    case 'SEND_ANSWER':
      return {
        ...state,
        phase: 'loading-next',
        conversation: [...state.conversation, { role: 'user', content: action.answer }],
        error: null,
      };
    case 'NEXT_QUESTION_RECEIVED':
      return {
        ...state,
        phase: 'questioning',
        conversation: [...state.conversation, { role: 'assistant', content: action.message }],
        hintsUsed: state.hintsUsed + 1,
      };
    case 'REQUEST_SUMMARY':
      return { ...state, phase: 'loading-summary', error: null };
    case 'SUMMARY_RECEIVED':
      return { ...state, phase: 'summary', summary: action.summary };
    case 'SEND_ANSWER_FAILED':
      // Si la llamada falla, sacamos el turno del usuario que se había
      // agregado de forma optimista en SEND_ANSWER. Si no lo hiciéramos,
      // un reintento dejaría dos turnos seguidos de 'user' sin ningún
      // 'assistant' en el medio, y la API exige alternancia estricta
      // entre roles — la siguiente llamada fallaría con 400.
      return {
        ...state,
        phase: 'questioning',
        error: action.message,
        conversation: state.conversation.slice(0, -1),
      };
    case 'ERROR':
      return { ...state, phase: action.fallbackPhase || state.phase, error: action.message };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function useSession() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const startSession = useCallback(async (code, problemDescription, language) => {
    dispatch({ type: 'START_SESSION', code, problemDescription, language });
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, problemDescription, language, history: [] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo iniciar la sesión.');
      dispatch({ type: 'FIRST_QUESTION_RECEIVED', message: data.message });
    } catch (err) {
      dispatch({ type: 'ERROR', message: err.message, fallbackPhase: 'input' });
    }
  }, []);

  // currentState se recibe como argumento (en vez de leer state por
  // clausura) para evitar el clásico problema de stale state con
  // useCallback: el componente siempre pasa el state más fresco que
  // tiene en el momento del click.
  //
  // Devuelve true/false (éxito o fallo) para que el componente que
  // llama pueda decidir si restaura el texto que el usuario había
  // escrito, en vez de perderlo silenciosamente si la llamada falla.
  const sendAnswer = useCallback(async (answer, currentState) => {
    dispatch({ type: 'SEND_ANSWER', answer });
    const newHistory = [...currentState.conversation, { role: 'user', content: answer }];
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentState.code,
          problemDescription: currentState.problemDescription,
          language: currentState.language,
          history: newHistory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo obtener la siguiente pregunta.');
      dispatch({ type: 'NEXT_QUESTION_RECEIVED', message: data.message });
      return true;
    } catch (err) {
      dispatch({ type: 'SEND_ANSWER_FAILED', message: err.message });
      return false;
    }
  }, []);

  const finishSession = useCallback(async (currentState, resolutionNote) => {
    dispatch({ type: 'REQUEST_SUMMARY' });
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentState.code,
          problemDescription: currentState.problemDescription,
          language: currentState.language,
          history: currentState.conversation,
          hintsUsed: currentState.hintsUsed,
          resolutionNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar el resumen.');
      dispatch({ type: 'SUMMARY_RECEIVED', summary: data });
      saveSession({
        id: `${Date.now()}`,
        date: new Date().toISOString(),
        language: currentState.language,
        problemPreview: currentState.problemDescription.slice(0, 120),
        hintsUsed: currentState.hintsUsed,
        blindSpotTitle: data.blindSpotTitle,
        blindSpotExplanation: data.blindSpotExplanation,
        encouragement: data.encouragement,
      });
    } catch (err) {
      dispatch({ type: 'ERROR', message: err.message, fallbackPhase: 'questioning' });
    }
  }, []);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { state, startSession, sendAnswer, finishSession, reset };
}
