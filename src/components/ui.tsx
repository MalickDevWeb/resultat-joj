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
          <Medal i={i + 1} />
          <span className="n">{x.n}</span>
          {perf && x.perf ? <span className="perf">{x.perf}</span> : null}
          <Noc c={x.c} />
        </div>
      ))}
    </>
  );
}

/** Illustration d'un sport. Le SVG vient de SCENES (contenu statique de l'application). */
export const Scene = ({ d }: { d: string }) => (
  <svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" role="img" aria-label={d}
    dangerouslySetInnerHTML={{ __html: SCENES[d] || '' }} />
);

export const SportIcon = ({ d }: { d: string }) => (
  <span className="ico mini" aria-hidden="true"><Scene d={d} /></span>
);

export const ErrBox = ({ e }: { e: ApiError }) => (
  <div className="err" role="alert"><code>{e.status} {e.code}</code><span>{e.msg}</span></div>
);

export const nocOptions = (labels = false) =>
  Object.keys(NOC).map((k) => <option key={k} value={k}>{labels ? `${k} · ${NOC[k]}` : k}</option>);
