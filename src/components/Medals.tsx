import { NOC, medalTable, type PodiumEvent } from '../data';

export function Medals({ events }: { events: PodiumEvent[] }) {
  const rows = medalTable(events);
  // Rang partagé en cas d'égalité parfaite (or, argent, bronze).
  let rank = 0;
  let prev = '';
  const ranked = rows.map(([c, m], i) => {
    const k = m.join('-');
    if (k !== prev) { rank = i + 1; prev = k; }
    return { c, m, rank };
  });

  return (
    <>
      <div className="day">
        <div><span className="pill">Classement</span><h2>Tableau des médailles</h2></div>
        <span>{events.length} épreuves</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th>#</th><th>Pays</th><th>Or</th><th>Arg.</th><th>Br.</th><th>Total</th></tr></thead>
          <tbody>
            {ranked.map(({ c, m, rank }) => (
              <tr key={c} className={c === 'SEN' ? 'sen' : ''}>
                <td>{rank}</td>
                <td><span className="noc">{c}</span> {NOC[c] || c}</td>
                <td>{m[0]}</td><td>{m[1]}</td><td>{m[2]}</td>
                <td className="tot">{m[0] + m[1] + m[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">
        Calculé à partir de la version actuelle de chaque podium, provisoire ou officiel. Une rectification met le
        tableau à jour sans saisie manuelle. Classement : or, puis argent, puis bronze.
      </p>
    </>
  );
}
