import { useState, type FormEvent } from 'react';
import { at, type Place, type PodiumEvent, type Session } from '../data';
import { ErrBox, Medal, Scene, nocOptions, type ApiError } from './ui';

interface Props {
  events: PodiumEvent[];
  pending: Session[];
  onPublish: (sessionId: string, pod: Place[]) => void;
}

const MED = [['Or', 'or'], ['Argent', 'argent'], ['Bronze', 'bronze']];

export function Publish({ events, pending, onPublish }: Props) {
  const items = [
    ...pending.map((x) => ({ v: x.id, x, done: false })),
    ...events.map((e) => ({ v: e.id, x: e as Session, done: true })),
  ];
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
    if (sel.done) {
      setErr({ status: 409, code: 'PODIUM_ALREADY_PUBLISHED', msg: 'Cette épreuve a déjà un podium. Ouvrez-le et rectifiez-le avec un motif.' });
      return;
    }
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
      <form id="pubform" className="pub" noValidate onSubmit={submit}>
        <section className="step">
          <span className="stepn">1</span>
          <div className="stepb">
            <label className="lbl" htmlFor="pev">Choisissez l'épreuve</label>
            <select id="pev" value={selV} onChange={(e) => { setPev(e.target.value); setErr(null); }}>
              {items.map((o) => (
                <option key={o.v} value={o.v}>{o.x.disc} · {o.x.name}{at(o.x.time)}{o.done ? ' (déjà publié)' : ''}</option>
              ))}
            </select>
            {sel && (
              <div className="evprev">
                <span className="evpic"><Scene d={sel.x.disc} /></span>
                <div>
                  <b>{sel.x.name}</b>
                  <small>{sel.x.venue}{at(sel.x.time)}</small>
                  {sel.done ? <span className="badge b-rect">Déjà publié</span> : <span className="badge b-next">Sans podium</span>}
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
                  <div className="pm"><Medal i={i + 1} /><small>{MED[i][0]}</small></div>
                  <div className="pf">
                    <label className="vh" htmlFor={`pn${i}`}>Médaille d'{MED[i][1]}</label>
                    <input id={`pn${i}`} placeholder="Nom de l'athlète ou de l'équipe" autoComplete="off"
                      value={names[i]} onChange={(e) => setAt(names, setNames, i, e.target.value)} />
                    <label className="vh" htmlFor={`pc${i}`}>Pays</label>
                    <select id={`pc${i}`} value={codes[i]} onChange={(e) => setAt(codes, setCodes, i, e.target.value)}>
                      {nocOptions(true)}
                    </select>
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
    </>
  );
}
