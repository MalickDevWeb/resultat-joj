import { useState, type FormEvent } from 'react';
import { at, type Place, type PodiumEvent, type Session } from '../data';
import { ChevronDown, PencilLine } from 'lucide-react';
import { Combo } from './Combo';
import { ErrBox, MedalCoin, Picto, Scene, nocCombo, type ApiError } from './ui';

const countries = nocCombo();

interface Props {
  events: PodiumEvent[];
  pending: Session[];
  onPublish: (sessionId: string, pod: Place[]) => void;
}

const MED = [['Or', 'd’or'], ['Argent', 'd’argent'], ['Bronze', 'de bronze']];

export function Publish({ events, pending, onPublish }: Props) {
  // Seules les épreuves sans podium : une épreuve publiée se modifie depuis sa fiche (« Rectifier le podium »).
  const published = new Set(events.map((e) => e.id));
  const items = pending.filter((x) => !published.has(x.id)).map((x) => ({ v: x.id, x }));
  const [pev, setPev] = useState<string>('');
  const [names, setNames] = useState(['', '', '']);
  const [codes, setCodes] = useState(['SEN', 'SEN', 'SEN']);
  const [err, setErr] = useState<ApiError | null>(null);

  const selV = items.some((o) => o.v === pev) ? pev : items[0]?.v;
  const sel = items.find((o) => o.v === selV);

  const setAt = (arr: string[], set: (a: string[]) => void, i: number, val: string) =>
    set(arr.map((x, j) => (j === i ? val : x)));

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!sel) return;
    const n = names.map((x) => x.trim());
    if (n.some((x) => !x)) {
      setErr({ status: 400, code: 'PODIUM_INCOMPLETE', msg: 'Indiquez les trois médaillés.' });
      return;
    }
    onPublish(sel.v, n.map((x, i) => ({ n: x, c: codes[i], perf: '' })));
  };

  return (
    <>
      <div className="day"><div><span className="pill">Chef de site</span><h2>Publier un podium</h2></div></div>
      <p className="pub-hint">
        <PencilLine size={18} aria-hidden="true" />
        <span>Seules les épreuves sans podium sont listées. Pour modifier un podium déjà publié, ouvrez-le dans
          <b> Résultats</b>, puis <b>« Rectifier le podium »</b>.</span>
      </p>
      {!items.length ? <p className="empty">Toutes les épreuves ont déjà un podium.</p> : (
      <form id="pubform" className="pub" noValidate onSubmit={submit}>
        <section className="step">
          <span className="stepn">1</span>
          <div className="stepb">
            <label className="lbl" htmlFor="pev">Choisissez l'épreuve</label>
            <Combo id="pev" label="Épreuve" className="combo-lg" value={selV} searchPlaceholder="Rechercher une épreuve, un sport, un lieu…"
              onChange={(v) => { setPev(v); setErr(null); }}
              options={items.map((o) => ({
                value: o.v, label: `${o.x.name}${at(o.x.time)}`, group: o.x.disc,                 icon: <Picto d={o.x.disc} />, keywords: `${o.x.venue} ${o.x.site}`,
              }))}
              trigger={sel ? <><span className="combo-ico"><Picto d={sel.x.disc} /></span><span className="combo-val">{sel.x.disc} · {sel.x.name}{at(sel.x.time)}</span><ChevronDown size={18} aria-hidden="true" className="combo-chev" /></> : undefined} />
            {sel && (
              <div className="evprev">
                <span className="evpic"><Scene d={sel.x.disc} /></span>
                <div>
                  <b>{sel.x.name}</b>
                  <small>{sel.x.venue}{at(sel.x.time)}</small>
                  <span className="badge b-next">Sans podium</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="step">
          <span className="stepn">2</span>
          <div className="stepb">
            <span className="lbl">Saisissez le podium</span>
            <div className="podrows">
              {[0, 1, 2].map((i) => (
                <div className={`prow g${i + 1}`} key={i}>
                  <div className="pm"><MedalCoin i={i + 1} /><small>{MED[i][0]}</small></div>
                  <div className="pf">
                    <label className="vh" htmlFor={`pn${i}`}>Médaille {MED[i][1]}</label>
                    <input id={`pn${i}`} placeholder="Nom de l'athlète ou de l'équipe" autoComplete="off"
                      value={names[i]} onChange={(e) => setAt(names, setNames, i, e.target.value)} />
                    <Combo id={`pc${i}`} label={`Pays, médaille ${MED[i][1]}`} value={codes[i]} options={countries}
                      searchPlaceholder="Rechercher un pays ou un code (SEN)…" onChange={(v) => setAt(codes, setCodes, i, v)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {err && <ErrBox e={err} />}

        <div className="pubfoot">
          <p className="note2">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
            Le podium part en provisoire. Un second responsable le passera en officiel.
          </p>
          <button className="btn big" type="submit">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>Publier en provisoire
          </button>
        </div>
      </form>
      )}
    </>
  );
}
