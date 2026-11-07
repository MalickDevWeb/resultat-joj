import { ALL_SITES, LIVE, SPORTS, today, type PodiumEvent, type Session } from '../data';
import { Badge, Scene, SportIcon } from './ui';

interface Props {
  events: PodiumEvent[];
  pending: Session[];
  site: string;
  isPublic: boolean;
  openId: string | null;
  onOpen: (id: string) => void;
  onLogin: () => void;
}

export function Results({ events, pending, site, isPublic, openId, onOpen, onLogin }: Props) {
  const inSite = (x: Session) => site === ALL_SITES || x.site === site;
  const list = SPORTS.map((d) => {
    const L = LIVE.filter((x) => x.disc === d && inSite(x));
    const P = events.filter((e) => e.disc === d && inSite(e)).sort((a, b) => b.time.localeCompare(a.time));
    const U = pending.filter((x) => x.disc === d && inSite(x));
    return { d, L, P, U, total: L.length + P.length + U.length };
  }).filter((x) => x.total);

  if (!list.length) return <p className="empty">Aucune épreuve sur ce site aujourd'hui.</p>;

  const liveList = list.filter((x) => x.L.length);
  const others = list.filter((x) => !x.L.length);
  const nLive = list.reduce((n, x) => n + x.L.length, 0);
  const n = liveList.length;
  const gridCls = n === 1 ? 'n1' : n === 2 ? 'n2' : n % 2 ? 'odd' : 'even';

  return (
    <>
      <div className="day">
        <div>
          <span className="pill">{nLive ? `${nLive} en direct` : "Aujourd'hui"}</span>
          <h2>{today()}</h2>
        </div>
      </div>

      {n ? (
        <div className={`sports ${gridCls}`}>
          {liveList.map((x) => {
            const target = x.P[0]?.id;
            return (
              <button key={x.d} className="sport" aria-current={!!target && openId === target}
                onClick={() => target && onOpen(target)}>
                <div className="pic"><Scene d={x.d} /><div className="chip-on"><span className="badge live">En direct</span></div></div>
                <div className="txt">
                  <h3>{x.d}</h3>
                  <div className="line">{x.L[0].name} · {x.L[0].venue}</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="empty" style={{ padding: '16px 0' }}>Aucune épreuve en direct sur ce site.</p>
      )}

      {others.length > 0 && (
        <>
          <div className="block-title"><h2>Autres sports</h2><span>Terminés ou à venir</span></div>
          <div className="acc">
            {others.map((x) => (
              <details key={x.d}>
                <summary>
                  <SportIcon d={x.d} />
                  <span className="sum">
                    <b>{x.d}</b>
                    {x.P.length ? <Badge s={x.P[0].status} /> : <span className="badge b-next">À {x.U[0].time}</span>}
                  </span>
                  <span className="count">{x.total}</span>
                  <svg className="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
                </summary>
                {x.P.map((e) => (
                  <button key={e.id} className="ev" onClick={() => onOpen(e.id)} aria-current={openId === e.id}>
                    <strong>{e.name}</strong><small>{e.venue} · {e.time}</small><Badge s={e.status} />
                  </button>
                ))}
                {x.U.map((e) => (
                  <button key={e.id} className="ev" disabled>
                    <strong>{e.name}</strong><small>{e.venue} · {e.time}</small><span className="badge b-next">À venir</span>
                  </button>
                ))}
              </details>
            ))}
          </div>
        </>
      )}

      {isPublic && <button className="to-resp" onClick={onLogin}>Je suis chef de site</button>}
    </>
  );
}

/** Dernier podium du site, ouvert par défaut en grand écran. */
export const latestIn = (events: PodiumEvent[], site: string) =>
  events.filter((e) => site === ALL_SITES || e.site === site).sort((a, b) => b.time.localeCompare(a.time))[0]?.id ?? null;
