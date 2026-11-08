import { useState } from 'react';
import { BADGE, NOC, PICTOS, SCENES, sportTone, type Place, type Status } from '../data';
import { ISO2 } from '../flags';

export interface ApiError {
  status: number;
  code: string;
  msg: string;
}

export const Badge = ({ s }: { s: Status }) => <span className={`badge ${BADGE[s][0]}`}>{BADGE[s][1]}</span>;

export const Medal = ({ i }: { i: number }) => <span className={`medal m${i}`}>{i}</span>;

export const Noc = ({ c }: { c: string }) => <span className="noc" title={NOC[c] || c}>{c}</span>;

export function PodRows({ pod, perf = false }: { pod: Place[]; perf?: boolean }) {
  return (
    <>
      {pod.map((x, i) => (
        <div className="row" key={i}>
          <Medal i={x.m ?? i + 1} />
          <span className="n">{x.n}</span>
          {perf && x.perf ? <span className="perf">{x.perf}</span> : null}
          <Noc c={x.c} />
        </div>
      ))}
    </>
  );
}

/** Illustration par défaut : couleurs du drapeau et pictogramme du sport (ou son initiale, texte échappé). */
const genericScene = (d: string) => {
  const k = ['g', 'y', 'r'].indexOf(sportTone(d));
  const bg = ['#00853f', '#fdef42', '#e31b23'][k];
  const fg = k === 1 ? '#141414' : '#fff';
  const p = PICTOS[d];
  if (p) {
    return `<rect width="160" height="120" fill="${bg}"/><circle cx="80" cy="60" r="46" fill="${fg}" opacity=".12"/>`
      + `<g transform="translate(50 30) scale(2.5)" fill="none" stroke="${fg}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p.replace(/class="h"/g, `fill="${fg}" stroke="none"`)}</g>`;
  }
  const ch = (d.trim()[0] || '?').toUpperCase().replace(/[<>&"']/g, '');
  return `<rect width="160" height="120" fill="${bg}"/><circle cx="80" cy="60" r="34" fill="none" stroke="${fg}" stroke-width="5" opacity=".35"/><text x="80" y="76" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="46" fill="${fg}">${ch}</text>`;
};

/** Illustration d'un sport. Le SVG vient de SCENES (contenu statique de l'application). */
export const Scene = ({ d }: { d: string }) => (
  <svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" role="img" aria-label={d}
    dangerouslySetInnerHTML={{ __html: SCENES[d] || genericScene(d) }} />
);

/** Tuile du sport : pictogramme sur fond aux couleurs du drapeau. */
export const SportIcon = ({ d }: { d: string }) => PICTOS[d] ? (
  <span className={`ico picto t-${sportTone(d)}`} aria-hidden="true">
    <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: PICTOS[d] }} />
  </span>
) : (
  <span className="ico mini" aria-hidden="true"><Scene d={d} /></span>
);

export const ErrBox = ({ e }: { e: ApiError }) => (
  <div className="err" role="alert"><code>{e.status} {e.code}</code><span>{e.msg}</span></div>
);

export const nocOptions = (labels = false) =>
  Object.keys(NOC).map((k) => <option key={k} value={k}>{labels ? `${k} · ${NOC[k]}` : k}</option>);

/** Pictogramme d'un sport, en ligne (hérite de la couleur du texte). */
export const Picto = ({ d, className = '' }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={`p24 ${className}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: PICTOS[d] ?? '' }} />
);

/** Drapeau du pays (flagcdn), ou pastille neutre si le code n'a pas de drapeau. */
export function Flag({ c }: { c: string }) {
  const [ok, setOk] = useState(true);
  const iso = ISO2[c];
  if (!iso || !ok) return <span className="flg flg-fb" aria-hidden="true" />;
  return (
    <img className="flg" alt="" aria-hidden="true" loading="lazy" crossOrigin="anonymous"
      src={`https://flagcdn.com/w80/${iso}.png`} srcSet={`https://flagcdn.com/w160/${iso}.png 2x`}
      onError={() => setOk(false)} />
  );
}

const METAL: Record<number, [string, string, string]> = {
  1: ['#fff4b8', '#f0bf2c', '#9a6500'],
  2: ['#ffffff', '#c2cbd6', '#66717e'],
  3: ['#ffd9b5', '#d77f3c', '#874214'],
};
const LEAVES = [105, 125, 145, 165, 185, 205, 225];

/** Médaille ronde avec couronne de laurier. */
export function MedalCoin({ i }: { i: number }) {
  const k = Math.min(Math.max(i, 1), 3);
  const [a, b, c] = METAL[k];
  const id = `coin${k}`;
  const leaf = (t: number, side: 1 | -1) => {
    const r = (t * Math.PI) / 180;
    const x = 32 + 25 * Math.cos(r);
    const y = 32 + 25 * Math.sin(r);
    return <ellipse key={`${side}${t}`} cx={x} cy={y} rx="5" ry="2.3" transform={`rotate(${t + 90 - 28 * side} ${x} ${y})`} />;
  };
  return (
    <svg className="coin" viewBox="0 0 64 64" role="img" aria-label={['Or', 'Argent', 'Bronze'][k - 1]}>
      <defs>
        <radialGradient id={id} cx="35%" cy="28%" r="80%">
          <stop offset="0" stopColor={a} /><stop offset=".55" stopColor={b} /><stop offset="1" stopColor={c} />
        </radialGradient>
      </defs>
      <g fill={b} stroke={c} strokeWidth=".6">
        {LEAVES.map((t) => leaf(t, 1))}
        {LEAVES.map((t) => leaf(180 - t, -1))}
      </g>
      <circle cx="32" cy="32" r="18.5" fill={`url(#${id})`} stroke={c} strokeWidth="1.4" />
      <circle cx="32" cy="32" r="14.5" fill="none" stroke={a} strokeWidth="1.3" opacity=".75" />
      <text x="32" y="39" textAnchor="middle" fontSize="19" fontWeight="800" fill="#fff" stroke={c} strokeWidth=".8"
        paintOrder="stroke" fontFamily="Plus Jakarta Sans, sans-serif">{i}</text>
    </svg>
  );
}

/** Grand podium de la fiche : médaille, drapeau, nom, code pays. */
export function PodiumBig({ pod }: { pod: Place[] }) {
  return (
    <div className="podium">
      {pod.map((x, i) => {
        const m = x.m ?? i + 1;
        return (
          <div className={`pz pz${Math.min(m, 3)}`} key={i}>
            <span className="pz-medal"><MedalCoin i={m} /></span>
            <Flag c={x.c} />
            <span className="pz-n"><b>{x.n}</b>{x.perf ? <small>{x.perf}</small> : null}</span>
            <span className="pz-c" title={NOC[x.c] || x.c}>{x.c}</span>
          </div>
        );
      })}
    </div>
  );
}
