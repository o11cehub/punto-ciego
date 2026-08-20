import { useSession } from './hooks/useSession.js';
import Aperture from './components/Aperture.jsx';
import CodeInputScreen from './components/CodeInputScreen.jsx';
import SessionScreen from './components/SessionScreen.jsx';
import SummaryScreen from './components/SummaryScreen.jsx';
import HistoryList from './components/HistoryList.jsx';

export default function App() {
  const { state, startSession, sendAnswer, finishSession, reset } = useSession();

  return (
    <div className="min-h-screen bg-ink text-paper">
      <header className="border-b border-fog/20 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-brass">
          <Aperture size={22} />
          <h1 className="font-display font-semibold text-lg tracking-tight text-paper">Punto Ciego</h1>
        </div>
        <p className="text-sm text-fog hidden sm:block">Un tutor que no da la respuesta</p>
      </header>

      <main className="max-w-xl mx-auto px-5 py-10">
        {state.phase === 'input' && (
          <>
            <CodeInputScreen onSubmit={startSession} error={state.error} />
            <HistoryList />
          </>
        )}

        {state.phase === 'loading-first' && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-fog">
            <Aperture size={32} pulse className="text-brass" />
            <p className="text-sm">Leyendo tu código...</p>
          </div>
        )}

        {(state.phase === 'questioning' || state.phase === 'loading-next' || state.phase === 'loading-summary') && (
          <SessionScreen
            state={state}
            onSendAnswer={(answer) => sendAnswer(answer, state)}
            onFinish={(note) => finishSession(state, note)}
          />
        )}

        {state.phase === 'summary' && state.summary && (
          <SummaryScreen hintsUsed={state.hintsUsed} summary={state.summary} onReset={reset} />
        )}
      </main>

      <footer className="text-center text-xs text-fog/70 py-8">Hecho para la CoderCup AI · Coderhouse</footer>
    </div>
  );
}
