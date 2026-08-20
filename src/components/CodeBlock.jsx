export default function CodeBlock({ code }) {
  return (
    <pre className="bg-ink2 border border-fog/25 border-l-2 border-l-brass/60 rounded-lg px-4 py-3 overflow-x-auto text-[12px] font-mono text-paper/85 leading-relaxed">
      <code>{code}</code>
    </pre>
  );
}
