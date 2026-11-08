import { useRef, useState } from 'react';
import { ArrowRight, CalendarDays, ChartColumn, Check, Copy, History, Newspaper, RotateCcw, Trophy } from 'lucide-react';
import { BADGE, SOURCE, cur, isImport, type PodiumEvent } from '../data';
import { Picto, PodRows, PodiumBig } from './ui';

interface Props {
  event: PodiumEvent;
  isResp: boolean;
  onBack: () => void;
  onValidate: () => void;
  onRectify: () => void;
  onTab: (t: 'programme' | 'medals') => void;
  toast: (m: string) => void;
}

export function Detail({ event: e, isResp, onBack, onValidate, onRectify, onTab, toast }: Props) {
  const [all, setAll] = useState(false);
  const c = cur(e);
  const citeRef = useRef<HTMLSpanElement>(null);
  const cite = isImport(c)
    ? `${e.disc}, ${e.name}, ${e.venue}. Source : ${SOURCE.name} (${SOURCE.license}), consulté le ${c.at.replace(/\.$/, '')}.`
    : `${e.disc}, ${e.name}, ${e.venue}. Version ${c.v}, publiée à ${c.at} par ${c.by}${c.valid ? `, validée par ${c.valid}` : ' (non validée)'}. Source : Podium Dakar 2026.`;

  const copy = () => {
    const fallback = () => {
      if (!citeRef.current) return;
      const r = document.createRange();
      r.selectNodeContents(citeRef.current);
      const sel = getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
      toast('Texte sélectionné : copiez-le');
    };
    try {
      navigator.clipboard.writeText(cite).then(() => toast('Citation copiée'), fallback);
    } catch {
      fallback();
    }
  };

  const history = [...e.versions].reverse();
  const shown = all ? history : history.slice(0, 1);

  return (
    <div className="dx">
      <button className="back-pill" onClick={onBack} aria-label="Retour aux résultats">
        <Trophy size={20} aria-hidden="true" /> Résultats
      </button>
      <h2 className="dx-title">{e.name}</h2>
      <p className="dx-sub">
        <Picto d={e.disc} />
        <b>{e.disc}</b><span>· {e.venue}{e.time && <> · <span className="t">{e.time}</span></>}</span>
      </p>

      <div className="seg">
        <span className={`seg-st st-${e.status}`}><Trophy size={17} aria-hidden="true" />{BADGE[e.status][1]}</span>
        <button type="button" onClick={() => onTab('programme')}><CalendarDays size={17} aria-hidden="true" />Programme</button>
        <button type="button" onClick={() => onTab('medals')}><ChartColumn size={17} aria-hidden="true" />Médailles</button>
      </div>

      <PodiumBig pod={c.pod} />

      <div className="press">
        <span className="press-ico"><Newspaper size={22} aria-hidden="true" /></span>
        <div className="press-body">
          <b>Pour les journalistes</b>
          <span ref={citeRef}>{cite}</span>
          <button type="button" className="copy" onClick={copy}>Copier la citation <Copy size={15} aria-hidden="true" /></button>
        </div>
        <Picto d={e.disc} className="press-art" />
      </div>

      {isResp && (
        <div className="actions">
          {!c.valid && <button className="btn" onClick={onValidate}>Valider (2ᵉ responsable)</button>}
          <button className="btn warn" onClick={onRectify}>Rectifier le podium</button>
        </div>
      )}

      <section className="hx">
        <header>
          <History size={20} aria-hidden="true" />
          <h3>Historique · {e.versions.length} version{e.versions.length > 1 ? 's' : ''}</h3>
          {history.length > 1 && (
            <button type="button" onClick={() => setAll(!all)}>{all ? 'Voir moins' : 'Voir plus'} <ArrowRight size={15} aria-hidden="true" /></button>
          )}
        </header>
        <div className="hx-body">
          <svg className="hx-flag" viewBox="0 0 120 150" aria-hidden="true">
            <path d="M8 4v146" stroke="#7a5a2a" strokeWidth="3" />
            <path d="M10 10q18 8 34 2v96q-16 6-34-2z" fill="#00853f" />
            <path d="M44 12q18-6 36 2v96q-18-8-36-2z" fill="#fdef42" />
            <path d="M80 14q18 8 34 2v96q-16 6-34-2z" fill="#e31b23" />
            <path d="M62 50l3.5 10.5h11l-9 6.5 3.5 10.5-9-6.5-9 6.5 3.5-10.5-9-6.5h11z" fill="#00853f" />
          </svg>
          {shown.map((v, i) => (
            <div className={`hv ${i > 0 ? 'old' : ''}`} key={v.v}>
              <span className="hv-ic">{i === 0 ? <Check size={16} strokeWidth={3} /> : <RotateCcw size={14} strokeWidth={2.6} />}</span>
              <div className="hv-main">
                <h4>Version {v.v} : {i === 0 ? 'actuelle' : 'remplacée'} <span className="date">{v.at}</span></h4>
                <p>{isImport(v)
                  ? <>Importée de {e.url ? <a href={e.url} target="_blank" rel="noreferrer">{SOURCE.name}</a> : SOURCE.name} le {v.at}</>
                  : <>Publiée par {v.by}{v.valid ? ` · validée par ${v.valid}` : ' · en attente de validation'}</>}</p>
                {v.motif && <p className="motif">Motif : {v.motif}</p>}
                <div className="pod"><PodRows pod={v.pod} /></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
