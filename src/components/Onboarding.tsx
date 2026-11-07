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
  return `Jour ${Math.floor((t - START) / 864e5) + 1} / 14`;
}

/** Image officielle, ou rien si le fichier n'a pas encore été ajouté. */
function Img({ src, alt, className, fallback = null }: { src: string; alt: string; className: string; fallback?: ReactNode }) {
  const [ok, setOk] = useState(true);
  return ok ? <img src={src} alt={alt} className={className} onError={() => setOk(false)} /> : <>{fallback}</>;
}

export function Onboarding({ onEnter, canInstall, onInstall, live, done, next }: Props) {
  return (
    <section className="onb" aria-label="Bienvenue">
      <div className="onb-art">
        {/* Les trois arcs aux couleurs du Sénégal, comme la sculpture de Diamniadio */}
        <svg className="arcs" viewBox="0 0 400 400" preserveAspectRatio="xMinYMax slice" aria-hidden="true">
          <path className="arc a1" d="M40 400 C40 250 90 140 210 70" />
          <path className="arc a2" d="M90 400 C90 270 140 170 260 110" />
          <path className="arc a3" d="M140 400 C140 290 190 200 310 150" />
          <path d="M70 330l6 18h19l-15 11 6 18-16-11-16 11 6-18-15-11h19z" fill="#00853f" />
        </svg>

        <div className="onb-logo">
          <Img src={LOGO} alt="Dakar 2026, Jeux Olympiques de la Jeunesse" className="logo-img"
            fallback={
              <div className="logo-fb" role="img" aria-label="Dakar 2026, Jeux Olympiques de la Jeunesse">
                <b>DAKAR<br />2026</b>
                <span>Jeux Olympiques<br />de la Jeunesse</span>
              </div>
            } />
        </div>
        <Img src={MASCOT} alt="La mascotte de Dakar 2026" className="mascot" />
      </div>

      <div className="onb-copy gut">
        <div className="onb-tags">
          <span className="tag">JOJ Dakar 2026</span>
          <span className="tag day">{gamesDay()}</span>
        </div>
        <h1>Qui a gagné&nbsp;? La réponse officielle.</h1>
        <p>Tous les podiums de Dakar, Diamniadio et Saly, avec leur statut. Une correction ne s'efface jamais.</p>

        <div className="onb-stats" aria-label="Aujourd'hui">
          <div><strong className="red">{live}</strong><span>en direct</span></div>
          <div><strong>{done}</strong><span>podiums</span></div>
          <div><strong>{next}</strong><span>à venir</span></div>
        </div>

        <div className="enter">
          <button className="main" onClick={() => onEnter('pub')}>Voir les résultats <span>→</span></button>
          <button onClick={() => onEnter('resp')}>Je suis chef de site <span>Publier</span></button>
          {canInstall && <button onClick={onInstall}>Installer l'application <span>Hors ligne</span></button>}
        </div>
        <small className="onb-foot">Application de démonstration · données simulées</small>
      </div>
    </section>
  );
}
