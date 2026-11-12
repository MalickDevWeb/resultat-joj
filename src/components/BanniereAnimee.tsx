/**
 * La bannière JOJ Dakar 2026 en mouvement (design/banniere-animee.md).
 * Une seule image : les mouvements viennent de copies découpées (Ayo, drapeau) et de calques de lumière.
 * Tout est décoratif (aria-hidden) ; « moins d'animations » arrête tout.
 */
const ETINCELLES = [
  { x: 8, d: 0, c: 'v' }, { x: 22, d: 1.6, c: 'j' }, { x: 38, d: 3.1, c: 'r' }, { x: 47, d: 0.8, c: 'j' },
  { x: 58, d: 2.4, c: 'v' }, { x: 74, d: 4.2, c: 'j' }, { x: 86, d: 1.2, c: 'r' }, { x: 94, d: 3.6, c: 'v' },
];

export function BanniereAnimee({ src, alt = '', className = '' }: { src: string; alt?: string; className?: string }) {
  return (
    <div className={`ba ${className}`} role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>
      <img src={src} alt="" className="ba-fond" decoding="async" />
      <div className="ba-drapeau" aria-hidden="true" />
      <img src={src} alt="" className="ba-ayo" aria-hidden="true" decoding="async" />
      <div className="ba-eclat" aria-hidden="true" />
      <div className="ba-etincelles" aria-hidden="true">
        {ETINCELLES.map((e, i) => (
          <i key={i} className={`ba-e-${e.c}`} style={{ left: `${e.x}%`, animationDelay: `${e.d}s` }} />
        ))}
      </div>
    </div>
  );
}
