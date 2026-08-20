import { useState } from 'react';
import ChatBubble from './ChatBubble.jsx';
import HintCounter from './HintCounter.jsx';
import CodeBlock from './CodeBlock.jsx';

export default function SessionScreen({ state, onSendAnswer, onFinish }) {
  const [answer, setAnswer] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');

  const isLoadingNext = state.phase === 'loading-next';
  const isLoadingSummary = state.phase === 'loading-summary';
  const isBusy = isLoadingNext || isLoadingSummary;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!answer.trim() || isBusy) return;
    const text = answer.trim();
    setAnswer('');
    const ok = await onSendAnswer(text);
    if (!ok) setAnswer(text); // si falló, restauramos lo que había escrito
  };

  const handleFinish = (e) => {
    e.preventDefault();
    if (isBusy) return;
    onFinish(resolutionNote.trim());
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <HintCounter count={state.hintsUsed} />
        <button
          onClick={() => setShowResolveForm((v) => !v)}
          disabled={isBusy}
          className="text-sm px-4 py-1.5 bg-ink2 hover:bg-fog/15 border border-fog/25 rounded-full text-paper/80 disabled:opacity-50 transition-colors"
        >
          Ya lo resolví
        </button>
      </div>

      <details className="mb-4">
        <summary className="text-xs text-fog cursor-pointer select-none hover:text-paper/80">
          Ver el código original
        </summary>
        <div className="mt-2">
          <CodeBlock code={state.code} />
        </div>
      </details>

      {showResolveForm && (
        <form onSubmit={handleFinish} className="mb-4 p-4 bg-ink2 border border-fog/25 rounded-lg space-y-3">
          <label htmlFor="resolution" className="block text-sm font-medium text-paper/90">
            Opcional: ¿qué cambiaste para arreglarlo?
          </label>
          <textarea
            id="resolution"
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            rows={3}
            placeholder="Contá brevemente qué encontraste..."
            className="w-full bg-ink border border-fog/25 rounded-lg px-3 py-2 text-sm text-paper placeholder-fog/50 focus:outline-none focus:ring-2 focus:ring-brass/60"
          />
          <button
            type="submit"
            disabled={isBusy}
            className="px-4 py-2 bg-brass hover:bg-brass/90 disabled:opacity-50 text-ink text-sm font-medium rounded-lg transition-colors"
          >
            {isLoadingSummary ? 'Generando resumen...' : 'Confirmar y ver resumen'}
          </button>
        </form>
      )}

      <div className="space-y-3 mb-4">
        {state.conversation.map((turn, i) => (
          <ChatBubble key={i} role={turn.role} content={turn.content} />
        ))}
        {isLoadingNext && <ChatBubble role="assistant" loading />}
      </div>

      {state.error && (
        <p className="text-sm text-rust bg-rust/10 border border-rust/30 rounded-lg px-3 py-2 mb-4">
          {state.error}
        </p>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Escribí tu respuesta..."
          disabled={isBusy}
          className="flex-1 bg-ink2 border border-fog/25 rounded-lg px-4 py-2.5 text-sm text-paper placeholder-fog/50 focus:outline-none focus:ring-2 focus:ring-brass/60 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!answer.trim() || isBusy}
          className="px-5 py-2.5 bg-paper hover:bg-white disabled:bg-ink2 disabled:text-fog text-ink text-sm font-medium rounded-lg transition-colors"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
