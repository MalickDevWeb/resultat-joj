import { BADGE, NOC, SCENES, type Place, type Status } from '../data';

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

/** Illustration par défaut : couleurs du drapeau et initiale du sport (texte échappé). */
const genericScene = (d: string) => {
  const k = [...d].reduce((n, ch) => n + ch.charCodeAt(0), 0) % 3;
  const bg = ['#00853f', '#fdef42', '#e31b23'][k];
  const fg = k === 1 ? '#141414' : '#fff';
  const ch = (d.trim()[0] || '?').toUpperCase().replace(/[<>&"']/g, '');
  return `<rect width="160" height="120" fill="${bg}"/><circle cx="80" cy="60" r="34" fill="none" stroke="${fg}" stroke-width="5" opacity=".35"/><text x="80" y="76" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="46" fill="${fg}">${ch}</text>`;
};

/** Illustration d'un sport. Le SVG vient de SCENES (contenu statique de l'application). */
export const Scene = ({ d }: { d: string }) => (
  <svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" role="img" aria-label={d}
    dangerouslySetInnerHTML={{ __html: SCENES[d] || genericScene(d) }} />
);

export const SportIcon = ({ d }: { d: string }) => (
  <span className="ico mini" aria-hidden="true"><Scene d={d} /></span>
);

export const ErrBox = ({ e }: { e: ApiError }) => (
  <div className="err" role="alert"><code>{e.status} {e.code}</code><span>{e.msg}</span></div>
);

export const nocOptions = (labels = false) =>
  Object.keys(NOC).map((k) => <option key={k} value={k}>{labels ? `${k} · ${NOC[k]}` : k}</option>);
