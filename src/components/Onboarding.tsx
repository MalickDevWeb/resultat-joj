import { useState, type ReactNode } from 'react';

interface Props {
  onEnter: (who: 'pub' | 'resp') => void;
  canInstall: boolean;
  onInstall: () => void;
  live: number;
  done: number;
  next: number;
}

/* Fichiers officiels à déposer dans public/brand/ (voir README). */
const LOGO = '/brand/joj-logo.png';
const MASCOT = '/brand/mascotte.png';

/* JOJ Dakar 2026 : du 31 octobre au 13 novembre 2026. */
const START = Date.UTC(2026, 9, 31);
const END = Date.UTC(2026, 10, 13);

function gamesDay() {
  const t = Date.now();
  if (t < START) return `J-${Math.ceil((START - t) / 864e5)}`;
  if (t > END + 864e5) return 'Jeux terminés';
  return `Jour ${Math.floor((t - START) / 864e5) + 1} sur 14`;
}

/** Image officielle, ou le contenu de secours si le fichier n'a pas encore été ajouté. */
function Img({ src, alt, className, fallback = null }: { src: string; alt: string; className: string; fallback?: ReactNode }) {
  const [ok, setOk] = useState(true);
  return ok ? <img src={src} alt={alt} className={className} onError={() => setOk(false)} /> : <>{fallback}</>;
}

/* Façade de la Dakar Arena : losanges aux couleurs vives, générés une fois. */
const FACADE = ['#0b7a3b', '#1f9a4a', '#5cb848', '#a9cf45', '#f2d43a', '#f7a531', '#ef6b2a', '#e0342b'];
const DIAMONDS = (() => {
  const out: { d: string; f: string; o: number }[] = [];
  const w = 18, h = 26;
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 20; c++) {
      const x = 150 + c * w + (r % 2 ? w / 2 : 0);
      const y = 160 + r * (h / 2);
      // Dominante verte à gauche, chaude à droite, avec du rythme.
      const k = Math.min(FACADE.length - 1, Math.max(0, Math.round(c / 3 + Math.sin(c * 1.7 + r * 2.3) * 1.6)));
      out.push({ d: `M${x} ${y - h / 2}L${x + w / 2} ${y}L${x} ${y + h / 2}L${x - w / 2} ${y}Z`, f: FACADE[k], o: 0.75 + ((c * 7 + r * 3) % 4) * 0.08 });
    }
  }
  return out;
})();

function Scene() {
  return (
    <svg className="scene" viewBox="0 0 400 520" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6fb6e6" /><stop offset="1" stopColor="#dcf0fa" />
        </linearGradient>
        <linearGradient id="plaza" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ece6dc" /><stop offset="1" stopColor="#cfc4b3" />
        </linearGradient>
        <clipPath id="drum"><path d="M150 168 A170 28 0 0 1 490 168 L490 292 Q320 306 150 292Z" /></clipPath>
      </defs>
      <rect width="400" height="520" fill="url(#sky)" />
      {/* Nuages légers */}
      <g fill="#fff" opacity=".7">
        <ellipse cx="70" cy="70" rx="46" ry="10" /><ellipse cx="96" cy="62" rx="26" ry="10" />
        <ellipse cx="300" cy="44" rx="38" ry="8" />
      </g>
      {/* Arena */}
      <path d="M150 152 A170 32 0 0 1 490 152 L490 170 A170 28 0 0 0 150 170Z" fill="#f4f4f2" />
      <g stroke="#cfd3d6" strokeWidth="1.2">
        {Array.from({ length: 18 }, (_, i) => <path key={i} d={`M${160 + i * 19} ${140 - Math.sin((i / 17) * Math.PI) * 6}v26`} />)}
      </g>
      <g clipPath="url(#drum)">
        <rect x="150" y="150" width="340" height="160" fill="#2a6b3c" />
        {DIAMONDS.map((x, i) => <path key={i} d={x.d} fill={x.f} opacity={x.o} stroke="#ffffff" strokeOpacity=".35" strokeWidth=".8" />)}
      </g>
      <path d="M150 286 Q320 300 490 286 V312 H150Z" fill="#f7f7f5" />
      <g fill="#3b4a52">{Array.from({ length: 8 }, (_, i) => <rect key={i} x={182 + i * 30} y="296" width="14" height="16" rx="1" />)}</g>
      {/* Parvis */}
      <rect y="308" width="400" height="212" fill="url(#plaza)" />
      <g stroke="#b9ad9b" strokeWidth="1" opacity=".55">
        {[-260, -140, -40, 60, 160, 280, 420, 560].map((x) => <path key={x} d={`M220 308L${x} 520`} />)}
        <path d="M0 360H400M0 430H400" />
      </g>
      {/* Sculpture : trois arcs vert, jaune, rouge et l'étoile */}
      <g fill="none" strokeLinecap="round">
        <path d="M34 470 C30 360 70 250 168 176" stroke="#0b7a3b" strokeWidth="15" />
        <path d="M62 474 C60 380 96 280 186 214" stroke="#f2d43a" strokeWidth="15" />
        <path d="M90 478 C92 400 122 320 196 262" stroke="#e0342b" strokeWidth="15" />
      </g>
      <path d="M48 402l7 20h21l-17 12 7 20-18-12-18 12 7-20-17-12h21z" fill="#0b7a3b" />
      <g fill="#e2dbcf" stroke="#c7bca9"><rect x="18" y="470" width="96" height="14" rx="2" /></g>
    </svg>
  );
}

export function Onboarding({ onEnter, canInstall, onInstall, live, done, next }: Props) {
  return (
    <section className="onb" aria-label="Bienvenue">
      <div className="onb-art">
        <Scene />
        <div className="onb-logo">
          <Img src={LOGO} alt="Dakar 2026, Jeux Olympiques de la Jeunesse" className="logo-img"
            fallback={
              <div className="logo-fb" role="img" aria-label="Dakar 2026, Jeux Olympiques de la Jeunesse">
                <b>DAKAR<br />2026</b>
                <div className="logo-boxes">
                  <span className="lb lb-flag" aria-hidden="true"><i /><i /><i /></span>
                  <span className="lb bubble">Jeux<br />Olympiques<br />de la Jeunesse</span>
                </div>
              </div>
            } />
        </div>
        <Img src={MASCOT} alt="La mascotte de Dakar 2026" className="mascot" />
      </div>

      <div className="onb-copy gut">
        <div className="onb-tags">
          <span className="live-dot">{live} en direct</span>
          <span className="sep" aria-hidden="true">·</span>
          <span>{gamesDay()}</span>
        </div>
        <h1>Qui a gagné&nbsp;?<br /><em>La réponse officielle.</em></h1>
        <p>Les podiums de Dakar, Diamniadio et Saly en temps réel. Chaque correction reste visible.</p>

        <div className="onb-stats" aria-label="Aujourd'hui">
          <div><strong>{done}</strong><span>podiums publiés</span></div>
          <div><strong>{next}</strong><span>finales à venir</span></div>
        </div>

        <div className="enter">
          <button className="main" onClick={() => onEnter('pub')}>Voir les résultats <span aria-hidden="true">→</span></button>
          <button onClick={() => onEnter('resp')}>Je suis chef de site <span>Publier</span></button>
          {canInstall && <button onClick={onInstall}>Installer l'application <span>Hors ligne</span></button>}
        </div>
        <small className="onb-foot">Démonstration · données simulées</small>
      </div>
    </section>
  );
}
