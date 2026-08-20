// El elemento de firma del diseño: tres anillos concéntricos que
// evocan un lente enfocando. Es la marca visual del producto, y
// aparece en el header, el contador de pistas, el estado de carga
// (con pulse) y la pantalla de resumen. Usa currentColor para heredar
// el color de texto de donde se lo use (text-brass, text-fog, etc).
export default function Aperture({ size = 20, pulse = false, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`${pulse ? 'animate-pulse' : ''} ${className}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}
