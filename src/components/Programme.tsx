import { useState } from 'react';
import { CalendarCheck, CalendarDays, ChevronDown, MapPin } from 'lucide-react';
import { ALL_SITES, SPORTS, matches, sportTone, type Session } from '../data';
import { Picto, SportIcon } from './ui';

const plural = (n: number) => `${n} épreuve${n > 1 ? 's' : ''}`;

/** Épreuves à venir, regroupées par sport ; le sport choisi est mis en avant à gauche (grand écran). */
export function Programme({ pending, site, q }: { pending: Session[]; site: string; q: string }) {
  const list = SPORTS.map((d) => ({
    d,
    U: pending.filter((x) => x.disc === d && (site === ALL_SITES || x.site === site) && matches(q, x.disc, x.name, x.venue, x.site))
      .sort((a, b) => a.time.localeCompare(b.time)),
  })).filter((x) => x.U.length);
  const n = list.reduce((k, x) => k + x.U.length, 0);
  const [pick, setPick] = useState<string | null>(null);
  const feat = list.find((x) => x.d === pick) ?? list[0];
  const searching = !!q.trim();

  return (
    <div className="pgx">
      <div className="pg-hero">
        <svg className="pg-hero-wave" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M120 120C260 70 420 60 600 30v90z" fill="#00853f" />
          <path d="M200 120C330 86 470 76 600 62v58z" fill="#fdef42" />
          <path d="M290 120c110-24 220-32 310-30v30z" fill="#e31b23" />
        </svg>
        <span className="pg-hero-ico"><CalendarCheck size={34} aria-hidden="true" /></span>
        <div className="pg-hero-txt">
          <h2>Programme</h2>
          <p>Découvrez le programme complet des épreuves</p>
          <span className="pg-hero-n"><CalendarDays size={15} aria-hidden="true" /> {plural(n)} à venir</span>
        </div>
        {/* Ayo court vers les épreuves (design/ayo-qui-court.md) : une marionnette découpée, jambes et bras articulés. */}
        <span className="pg-runner" aria-hidden="true">
          <span className="pg-vitesse"><i /><i /><i /><i /></span>
          <span className="pg-ombre" />
          <span className="pg-pantin">
            <img src="/brand/ayo-course/bras.webp" alt="" className="pg-bras" />
            <img src="/brand/ayo-course/jambe-g.webp" alt="" className="pg-jambe-g" />
            <img src="/brand/ayo-course/jambe-d.webp" alt="" className="pg-jambe-d" />
            <img src="/brand/ayo-course/corps.webp" alt="" className="pg-corps" />
          </span>
          <span className="pg-poussiere"><i /><i /><i /></span>
        </span>
      </div>

      {!n ? <p className="empty">{searching ? `Aucune épreuve à venir pour « ${q.trim()} ».` : 'Aucune épreuve à venir sur ce site.'}</p> : (
        <div className="pg-grid">
          {feat && (
            <aside className={`pg-feat st-${sportTone(feat.d)}`} aria-label={`${feat.d} : épreuves à venir`}>
              <div className="pf-head">
                <Picto d={feat.d} />
                <div><b>{feat.d}</b><small>{feat.U[0].venue}</small></div>
              </div>
              <div className="pf-art" aria-hidden="true">
                <svg className="pf-swoosh" viewBox="0 0 300 120" preserveAspectRatio="none">
                  <path d="M0 80C80 40 200 30 300 50v20C200 52 90 62 0 100z" fill="#fdef42" opacity=".9" />
                  <path d="M0 100C90 64 200 56 300 70v14C200 74 100 82 0 116z" fill="#00853f" opacity=".85" />
                </svg>
                <span className="pf-disc"><Picto d={feat.d} /></span>
              </div>
              <span className="pf-n">{plural(feat.U.length)}</span>
              <ul>
                {feat.U.slice(0, 6).map((s) => <li key={s.id}><CalendarCheck size={18} aria-hidden="true" />{s.name}</li>)}
                {feat.U.length > 6 && <li className="more">+ {feat.U.length - 6} autre{feat.U.length - 6 > 1 ? 's' : ''}</li>}
              </ul>
              <svg className="pf-foot" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 30C90 0 200 4 300 24v36H0z" fill="#00853f" />
                <path d="M0 44C100 18 210 22 300 38v22H0z" fill="#fdef42" />
                <path d="M150 60c50-14 100-18 150-14v14z" fill="#e31b23" />
              </svg>
            </aside>
          )}

          <div className="prog">
            {list.map((x) => (
              <details key={x.d} className={`pg st-${sportTone(x.d)}`} open={searching ? true : undefined}>
                <summary onClick={() => setPick(x.d)}>
                  <SportIcon d={x.d} />
                  <b>{x.d}</b>
                  <span className="pg-n">{plural(x.U.length)}</span>
                  <span className="pg-chev" aria-hidden="true"><ChevronDown size={20} /></span>
                </summary>
                <ul>
                  {x.U.map((s) => (
                    <li key={s.id}>
                      <span className="pg-t">{s.time || 'À venir'}</span>
                      <strong>{s.name}</strong>
                      <small><MapPin size={15} aria-hidden="true" /> {s.venue} · {s.site}</small>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>
      )}
      <p className="src-note">Horaires publiés au fil de la compétition.</p>
    </div>
  );
}
