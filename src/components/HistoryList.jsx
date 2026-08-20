import { useEffect, useState } from 'react';
import { getSessions } from '../lib/storage.js';
import Aperture from './Aperture.jsx';

export default function HistoryList() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  if (sessions.length === 0) return null;

  return (
    <div className="mt-10 pt-6 border-t border-fog/15">
      <h3 className="text-sm font-medium text-fog mb-3">Sesiones anteriores</h3>
      <div className="space-y-2">
        {sessions.slice(0, 5).map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between bg-ink2/60 border border-fog/15 rounded-lg px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm text-paper/90 truncate">{s.blindSpotTitle}</p>
              <p className="text-xs text-fog truncate">{s.problemPreview}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-fog shrink-0 ml-3">
              <Aperture size={11} className="text-brass/70" />
              {s.hintsUsed}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
