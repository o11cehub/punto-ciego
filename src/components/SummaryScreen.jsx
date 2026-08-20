import Aperture from './Aperture.jsx';

export default function SummaryScreen({ hintsUsed, summary, onReset }) {
  return (
    <div className="text-center py-6">
      <div className="flex justify-center mb-5 text-brass">
        <Aperture size={40} />
      </div>
      <h2 className="font-display text-2xl font-semibold mb-1">Lo resolviste</h2>
      <p className="text-fog text-sm mb-8">
        Necesitaste {hintsUsed} {hintsUsed === 1 ? 'pista' : 'pistas'}
      </p>

      <div className="text-left bg-ink2 border border-fog/25 rounded-xl p-6 mb-6">
        <p className="text-xs uppercase tracking-wide text-brass font-semibold mb-2">Tu punto ciego</p>
        <h3 className="font-display text-lg font-semibold mb-3">{summary.blindSpotTitle}</h3>
        <p className="text-paper/85 text-sm leading-relaxed mb-4">{summary.blindSpotExplanation}</p>
        <p className="text-fog text-sm italic border-t border-fog/20 pt-4">{summary.encouragement}</p>
      </div>

      <button
        onClick={onReset}
        className="px-6 py-2.5 bg-paper hover:bg-white text-ink text-sm font-medium rounded-lg transition-colors"
      >
        Nueva sesión
      </button>
    </div>
  );
}
