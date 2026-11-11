import { useState } from 'react';
import { CalendarDays, Star, Trophy } from 'lucide-react';
import { NOC, SOURCE, medalTable, type PodiumEvent, type Session } from '../data';
import { Flag } from './ui';

type Sort = 'all' | 0 | 1 | 2;
const METALS = ['Or', 'Argent', 'Bronze'];

/** Petite médaille (or, argent, bronze) avec ruban. */
const MiniMedal = ({ k, ribbon = true }: { k: number; ribbon?: boolean }) => {
  const c = [['#ffe27a', '#e0a512', '#9a6500'], ['#f4f6f9', '#b4bec9', '#66717e'], ['#ffc99c', '#d07a38', '#874214']][k];
  return (
    <svg viewBox="0 0 24 30" className="mm" aria-hidden="true">
      {ribbon && <path d="M6 1h5l3 9H9zM18 1h-5l-3 9h5z" fill={k === 0 ? '#0b7a3b' : k === 1 ? '#3b6fb6' : '#c8161d'} />}
      <circle cx="12" cy="19" r="9" fill={c[1]} stroke={c[2]} strokeWidth="1.2" />
      <circle cx="12" cy="19" r="6.2" fill={c[0]} opacity=".55" />
      <path d="M12 14.6l1.3 2.7 3 .4-2.2 2 .6 2.9-2.7-1.4-2.7 1.4.6-2.9-2.2-2 3-.4z" fill={c[2]} opacity=".8" />
    </svg>
  );
};

interface Props {
  events: PodiumEvent[];
  pending?: Session[];
  official?: Record<string, number[]> | null; // tableau général de Wikipédia
}

export function Medals({ events, pending = [], official = null }: Props) {
  const [sort, setSort] = useState<Sort>('all');
  const rows = medalTable(events, pending, official);
  const sorted = sort === 'all' ? rows : [...rows].sort((a, b) =>
    b[1][sort] - a[1][sort] || (b[1][0] + b[1][1] + b[1][2]) - (a[1][0] + a[1][1] + a[1][2]) || a[0].localeCompare(b[0]));
  const shown = sort === 'all' ? sorted : sorted.filter(([, m]) => m[sort] > 0);
  const key = (m: number[]) => (sort === 'all' ? m.join('-') : String(m[sort]));

  // Rang partagé en cas d'égalité sur le critère affiché.
  let rank = 0;
  let prev = '';
  const ranked = shown.map(([c, m], i) => {
    const k = key(m);
    if (k !== prev) { rank = i + 1; prev = k; }
    return { c, m, rank };
  });

  // Sénégal, d'après le classement général (or, puis argent, puis bronze).
  let gRank = 0; let gPrev = '';
  const sen = rows.map(([c, m], i) => { const k = m.join('-'); if (k !== gPrev) { gRank = i + 1; gPrev = k; } return { c, m, rank: gRank }; })
    .find((x) => x.c === 'SEN');
  const senText = sen && (() => {
    const parts = sen.m.map((n, i) => n ? `${n} médaille${n > 1 ? 's' : ''} ${['d’or', 'd’argent', 'de bronze'][i]}` : '').filter(Boolean);
    const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}` : parts[0];
    return `Avec ${list}, le Sénégal est ${sen.rank === 1 ? '1er' : `${sen.rank}e`} au classement des nations.`;
  })();

  return (
    <div className="mx">
      <div className="mx-head">
        <div className="mx-title">
          <Trophy size={40} aria-hidden="true" className="mx-cup" />
          <div><h2>Tableau des médailles</h2><p>Classement des nations<span className="mx-p-n"> · {events.length} épreuves</span></p></div>
        </div>
        <span className="mx-count"><CalendarDays size={18} aria-hidden="true" /> {events.length} épreuves</span>
      </div>

      <div className="mx-filter" role="group" aria-label="Trier par médaille">
        <button aria-pressed={sort === 'all'} onClick={() => setSort('all')}><MiniMedal k={0} /> Tous</button>
        {METALS.map((label, k) => (
          <button key={label} aria-pressed={sort === k} onClick={() => setSort(k as Sort)}><MiniMedal k={k} ribbon={false} /> {label}</button>
        ))}
      </div>

      <table className="mx-table">
        <thead>
          <tr>
            <th>#</th><th>Pays</th>
            {METALS.map((l, k) => <th key={l} className={sort === k ? 'on' : ''}><MiniMedal k={k} ribbon={false} /><span>{l}</span></th>)}
            <th><Trophy size={18} aria-hidden="true" className="th-cup" /><span>Total</span></th>
          </tr>
        </thead>
        <tbody>
          {ranked.map(({ c, m, rank }) => (
            <tr key={c} className={c === 'SEN' ? 'sen' : ''}>
              <td><span className={`rk rk${rank <= 3 ? rank : 0}`}>{rank}</span></td>
              <td><span className="cty" title={NOC[c] || c}><Flag c={c} /><span>{NOC[c] || c}</span></span></td>
              <td>{m[0]}</td><td>{m[1]}</td><td>{m[2]}</td>
              <td><span className="tot">{m[0] + m[1] + m[2]}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      {sen && (
        <div className="mx-sen">
          <span className="mx-sen-ico"><Star size={22} fill="currentColor" aria-hidden="true" /></span>
          <div>
            <b>{sen.rank <= 10 ? 'Le Sénégal dans le Top 10 !' : `Le Sénégal, ${sen.rank}e nation`}</b>
            <p>{senText}</p>
          </div>
          <svg className="mx-sen-flag" viewBox="0 0 120 80" aria-hidden="true">
            <path d="M0 10q20-10 40 0v70q-20-10-40 0z" fill="#00853f" />
            <path d="M40 10q20 10 40 0v70q-20 10-40 0z" fill="#fdef42" />
            <path d="M80 10q20-10 40 0v70q-20-10-40 0z" fill="#e31b23" />
            <path d="M60 32l3 8.5h9l-7.3 5.3 2.8 8.7L60 49.2l-7.5 5.3 2.8-8.7-7.3-5.3h9z" fill="#00853f" />
          </svg>
        </div>
      )}

      <p className="note">
        Calculé à partir de la version actuelle de chaque podium, provisoire ou officiel. Une rectification met le
        tableau à jour sans saisie manuelle. Résultats importés de{' '}
        <a href={SOURCE.url} target="_blank" rel="noreferrer">{SOURCE.name}</a> ({SOURCE.license}).
      </p>
    </div>
  );
}
