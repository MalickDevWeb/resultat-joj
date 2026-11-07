import { useRef } from 'react';
import { SOURCE, cur, isImport, type PodiumEvent } from '../data';
import { Badge, PodRows } from './ui';

interface Props {
  event: PodiumEvent;
  isResp: boolean;
  onBack: () => void;
  onValidate: () => void;
  onRectify: () => void;
  toast: (m: string) => void;
}

export function Detail({ event: e, isResp, onBack, onValidate, onRectify, toast }: Props) {
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

  return (
    <>
      <button className="back" onClick={onBack}>← Résultats</button>
      <div className="dh">
        <div><Badge s={e.status} /></div>
        <h2>{e.name}</h2>
        <div className="meta">{e.disc} · {e.venue}{e.time && <> · <span className="t">{e.time}</span></>}</div>
      </div>
      <div className="big"><PodRows pod={c.pod} perf /></div>
      <div className="source">
        <b>Pour les journalistes</b>
        <span ref={citeRef}>{cite}</span>
        <div><button className="btn ghost" onClick={copy}>Copier la citation</button></div>
      </div>
      {isResp && (
        <div className="actions">
          {!c.valid && <button className="btn" onClick={onValidate}>Valider (2ᵉ responsable)</button>}
          <button className="btn warn" onClick={onRectify}>Rectifier le podium</button>
        </div>
      )}
      <p className="sec">Historique · {e.versions.length} version{e.versions.length > 1 ? 's' : ''}</p>
      <div className="hist">
        {history.map((v, i) => (
          <div className={`v ${i > 0 ? 'old' : ''}`} key={v.v}>
            <h4>Version {v.v}{i === 0 ? ' · actuelle' : ' · remplacée'} <span className="t">{v.at}</span></h4>
            <p>{isImport(v)
              ? <>Importée de {e.url ? <a href={e.url} target="_blank" rel="noreferrer">{SOURCE.name}</a> : SOURCE.name} le {v.at}</>
              : <>Publiée par {v.by}{v.valid ? ` · validée par ${v.valid}` : ' · en attente de validation'}</>}</p>
            {v.motif && <p className="motif">Motif : {v.motif}</p>}
            <div className="pod"><PodRows pod={v.pod} /></div>
          </div>
        ))}
      </div>
    </>
  );
}
