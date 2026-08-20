import Aperture from './Aperture.jsx';

export default function HintCounter({ count }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-ink2 border border-fog/25 rounded-full">
      <Aperture size={14} className="text-brass" />
      <span className="text-sm font-medium text-paper/90">
        {count} {count === 1 ? 'pista' : 'pistas'}
      </span>
    </div>
  );
}
