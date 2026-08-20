const STORAGE_KEY = 'puntociego_sessions';
const MAX_SESSIONS = 20;

export function getSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSession(session) {
  const sessions = getSessions();
  sessions.unshift(session); // la más reciente primero
  const trimmed = sessions.slice(0, MAX_SESSIONS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    // Si falla (por ejemplo, localStorage lleno o deshabilitado), no
    // rompemos el flujo principal: el resumen ya se le mostró al
    // usuario, solo no queda guardado para la próxima visita.
    console.error('No se pudo guardar la sesión en el historial:', err);
  }
  return trimmed;
}

export function clearSessions() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('No se pudo limpiar el historial:', err);
  }
}
