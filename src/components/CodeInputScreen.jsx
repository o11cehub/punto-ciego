import { useState } from 'react';
import { getSampleCases } from '../lib/sampleCases.js';

export default function CodeInputScreen({ onSubmit, error }) {
  const [code, setCode] = useState('');
  const [problemDescription, setProblemDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim() || !problemDescription.trim()) return;
    // El lenguaje queda fijo en JavaScript por ahora. No es una
    // limitación técnica: es una decisión de alcance para el plazo de
    // 6 días. Ver la sección 'si te sobra tiempo' del README.
    onSubmit(code, problemDescription, 'javascript');
  };

  const loadSample = (sample) => {
    setCode(sample.code);
    setProblemDescription(sample.problemDescription);
  };

  return (
    <div>
      <div className="mb-7">
        <h2 className="font-display text-[28px] leading-tight font-semibold mb-2">
          Pegá el código que no hace lo que pensás
        </h2>
        <p className="text-fog text-sm">
          No te doy la respuesta. Te hago las preguntas justas para que la encuentres vos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium mb-1.5 text-paper/90">
            Tu código (JavaScript)
          </label>
          <textarea
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Pegá acá el código que no te está funcionando..."
            rows={10}
            className="w-full bg-ink2 border border-fog/25 rounded-lg px-4 py-3 font-mono text-[13px] text-paper placeholder-fog/50 focus:outline-none focus:ring-2 focus:ring-brass/60 focus:border-brass/60 resize-y"
            required
          />
        </div>

        <div>
          <label htmlFor="problem" className="block text-sm font-medium mb-1.5 text-paper/90">
            ¿Qué esperabas que pase, y qué pasa en realidad?
          </label>
          <textarea
            id="problem"
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="Ej: esperaba que el contador sume de a uno, pero siempre me queda en el mismo número..."
            rows={3}
            className="w-full bg-ink2 border border-fog/25 rounded-lg px-4 py-3 text-sm text-paper placeholder-fog/50 focus:outline-none focus:ring-2 focus:ring-brass/60 focus:border-brass/60 resize-y"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-rust bg-rust/10 border border-rust/30 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={!code.trim() || !problemDescription.trim()}
          className="w-full sm:w-auto px-6 py-2.5 bg-brass hover:bg-brass/90 disabled:bg-ink2 disabled:text-fog disabled:cursor-not-allowed text-ink font-medium rounded-lg transition-colors"
        >
          Empezar sesión
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-fog/15">
        <p className="text-xs text-fog mb-2.5">¿Querés probar rápido? Cargá un caso de ejemplo:</p>
        <div className="flex flex-wrap gap-2">
          {getSampleCases().map((sample) => (
            <button
              key={sample.id}
              onClick={() => loadSample(sample)}
              type="button"
              className="text-xs px-3 py-1.5 bg-ink2 hover:bg-fog/15 border border-fog/25 rounded-full text-paper/80 transition-colors"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
