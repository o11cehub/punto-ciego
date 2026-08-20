import Aperture from './Aperture.jsx';

export default function ChatBubble({ role, content, loading }) {
  const isAssistant = role === 'assistant';

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isAssistant ? 'bg-ink2 border border-fog/25 text-paper' : 'bg-rust text-paper'
        }`}
      >
        {loading ? <Aperture size={16} pulse className="text-fog" /> : content}
      </div>
    </div>
  );
}
