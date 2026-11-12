import { CalendarDays } from 'lucide-react';
import { ALL_SITES, NOC, SOURCE, SPORTS, at, cur, matches, sportTone, today, type PodiumEvent, type Session } from '../data';
import { DaySummary } from './DaySummary';
import { Badge, Scene, SportIcon } from './ui';

interface Props {
  events: PodiumEvent[];
  pending: Session[];
  site: string;
  q: string;
  openId: string | null;
  onOpen: (id: string) => void;
  importedAt?: string; // dernière lecture de Wikipédia
  live?: Session[]; // épreuves en cours (programme officiel)
}

export function Results({ events, pending, site, q, openId, onOpen, importedAt = SOURCE.fetchedAt, live = [] }: Props) {
  const inSite = (x: Session) => site === ALL_SITES || x.site === site;
  const hitS = (x: Session) => hitSession(q, x);
  const hitE = (e: PodiumEvent) => hitEvent(q, e);
  const list = SPORTS.map((d) => {
    const L = live.filter((x) => x.disc === d && inSite(x) && hitS(x));
    const P = events.filter((e) => e.disc === d && inSite(e) && hitE(e)).sort((a, b) => b.time.localeCompare(a.time));
    const U = pending.filter((x) => x.disc === d && inSite(x) && hitS(x));
    return { d, L, P, U, total: L.length + P.length + U.length };
  }).filter((x) => x.total)
    // Les sports qui ont déjà des podiums d'abord (tri stable : l'ordre du programme est conservé).
    .sort((a, b) => Number(b.P.length > 0) - Number(a.P.length > 0));

  if (!list.length) return <p className="empty">{q.trim() ? `Aucun résultat pour « ${q.trim()} ».` : "Aucune épreuve sur ce site aujourd'hui."}</p>;

  const liveList = list.filter((x) => x.L.length);
  const others = list.filter((x) => !x.L.length);
  const nLive = list.reduce((n, x) => n + x.L.length, 0);
  const n = liveList.length;
  const gridCls = n === 1 ? 'n1' : n === 2 ? 'n2' : n % 2 ? 'odd' : 'even';

  return (
    <>
      <div className="day">
        <div>
          <span className="pill"><CalendarDays size={14} aria-hidden="true" /> {nLive ? `${nLive} en direct` : "Aujourd'hui"}</span>
          <h2>{today()}</h2>
        </div>
      </div>

      {!q.trim() && <DaySummary />}

      {n ? (
        <div className={`sports ${gridCls}`}>
          {liveList.map((x) => {
            const target = x.P[0]?.id;
            return (
              <button key={x.d} className="sport" aria-current={!!target && openId === target}
                onClick={() => (target ? onOpen(target) : x.L[0].url && window.open(x.L[0].url, '_blank', 'noopener'))}>
                <div className="pic"><Scene d={x.d} /><div className="chip-on"><span className="badge live">En direct</span></div></div>
                <div className="txt">
                  <h3>{x.d}</h3>
                  <div className="line">{x.L[0].name} · {x.L[0].venue}</div>
                  {x.L.length > 1 && <div className="line">+ {x.L.length - 1} autre{x.L.length > 2 ? 's' : ''} en cours</div>}
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {others.length > 0 && (
        <>
          <div className="block-title">
            <h2><svg viewBox="0 0 24 24" aria-hidden="true" className="p24 bt-ico"><circle className="h" cx="15" cy="4" r="2" /><path d="M14 7l-3 6M14 7l3 3 3-1M14 7l-4 1-2 3M11 13l4 3-1 5M11 13l-3 4H4" /></svg>{n ? 'Autres sports' : 'Sports'}</h2>
            <i className="bt-line" aria-hidden="true" /><span>Terminés ou à venir</span>
          </div>
          <div className="acc">
            {others.map((x) => (
              <details key={x.d} className={`st-${sportTone(x.d)}`} open={q.trim() ? true : undefined}>
                <summary>
                  <SportIcon d={x.d} />
                  <span className="sum">
                    <b>{x.d}</b>
                    {x.P.length ? <Badge s={x.P[0].status} /> : <span className="badge b-next">{x.U[0].time ? `À ${x.U[0].time}` : 'À venir'}</span>}
                  </span>
                  <span className="count">{x.total}</span>
                  <svg className="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
                </summary>
                {x.P.map((e) => (
                  <button key={e.id} className="ev" onClick={() => onOpen(e.id)} aria-current={openId === e.id}>
                    <strong>{e.name}</strong><small>{e.venue}{at(e.time)}</small><Badge s={e.status} />
                  </button>
                ))}
                {x.U.map((e) => (
                  <button key={e.id} className="ev" disabled>
                    <strong>{e.name}</strong><small>{e.venue}{at(e.time)}</small><span className="badge b-next">À venir</span>
                  </button>
                ))}
              </details>
            ))}
          </div>
        </>
      )}

      <p className="src-note">
        Résultats : <a href={SOURCE.url} target="_blank" rel="noreferrer">{SOURCE.name}</a> ({SOURCE.license}),
        mis à jour le {new Date(importedAt).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
        {' '}(automatiquement toutes les 6 h).
      </p>
    </>
  );
}

const hitSession = (q: string, x: Session) => matches(q, x.disc, x.name, x.venue, x.site);
/** Une épreuve correspond à la recherche par son nom, son lieu, ses athlètes ou leurs pays. */
const hitEvent = (q: string, e: PodiumEvent) =>
  hitSession(q, e) || cur(e).pod.some((p) => matches(q, p.n, p.c, NOC[p.c] ?? '', ...(p.team ?? [])));

/** Dernier podium du site (et de la recherche), ouvert par défaut en grand écran. */
export const latestIn = (events: PodiumEvent[], site: string, q = '') =>
  events.filter((e) => (site === ALL_SITES || e.site === site) && hitEvent(q, e)).sort((a, b) => b.time.localeCompare(a.time))[0]?.id ?? null;
