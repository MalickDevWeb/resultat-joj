import { useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import { DEMO_ACCOUNT, cur, type Place, type PodiumEvent } from '../data';
import { ErrBox, Medal, nocOptions, type ApiError } from './ui';

function Scrim({ label, className = '', onClose, children }: { label: string; className?: string; onClose: () => void; children: ReactNode }) {
  // Ferme uniquement sur un clic sur le fond, pas à l'intérieur de la feuille.
  const onClick = (e: MouseEvent) => { if (e.target === e.currentTarget) onClose(); };
  return (
    <div className="scrim" onClick={onClick}>
      <div className={`sheet ${className}`} role="dialog" aria-modal="true" aria-label={label}>{children}</div>
    </div>
  );
}

export function LoginSheet({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState<ApiError | null>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const em = email.trim().toLowerCase();
    if (!em || !pass) {
      setErr({ status: 400, code: 'CREDENTIALS_MISSING', msg: 'Saisissez votre adresse e-mail et votre mot de passe.' });
      return;
    }
    if (em !== DEMO_ACCOUNT.email || pass !== DEMO_ACCOUNT.pass) {
      setErr({ status: 401, code: 'INVALID_CREDENTIALS', msg: 'Adresse e-mail ou mot de passe incorrect.' });
      passRef.current?.focus();
      return;
    }
    onSuccess();
  };

  return (
    <Scrim label="Connexion chef de site" className="login" onClose={onClose}>
      <div className="lhead">
        <span className="lic"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg></span>
        <div><h3>Espace chef de site</h3><p className="meta" style={{ margin: 0 }}>Connectez-vous pour publier et rectifier les podiums.</p></div>
      </div>
      <form id="loginform" noValidate onSubmit={submit}>
        <label>Adresse e-mail
          <input type="email" autoComplete="username" inputMode="email" placeholder="vous@exemple.com" autoFocus
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>Mot de passe
          <input ref={passRef} type="password" autoComplete="current-password" placeholder="Votre mot de passe"
            value={pass} onChange={(e) => setPass(e.target.value)} />
        </label>
        {err && <ErrBox e={err} />}
        <button className="btn big" type="submit">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>Se connecter
        </button>
        <button className="btn ghost" type="button" onClick={onClose}>Annuler</button>
      </form>
    </Scrim>
  );
}

export function RectifySheet({ event, onClose, onSubmit }: {
  event: PodiumEvent;
  onClose: () => void;
  onSubmit: (pod: Place[], motif: string) => void;
}) {
  const c = cur(event);
  const [names, setNames] = useState(c.pod.map((x) => x.n));
  const [codes, setCodes] = useState(c.pod.map((x) => x.c));
  const [motif, setMotif] = useState('');
  const [err, setErr] = useState<ApiError | null>(null);
  const motifRef = useRef<HTMLTextAreaElement>(null);

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const m = motif.trim();
    if (!m) {
      setErr({ status: 422, code: 'CORRECTION_REASON_REQUIRED', msg: "Une rectification exige un motif. Le podium n'a pas été modifié." });
      motifRef.current?.focus();
      return;
    }
    onSubmit([0, 1, 2].map((i): Place => {
      const n = names[i].trim() || c.pod[i].n;
      // La performance suit l'athlète s'il reste à la même place.
      return { n, c: codes[i], m: c.pod[i].m, perf: n === c.pod[i].n && codes[i] === c.pod[i].c ? c.pod[i].perf : '' };
    }).concat(c.pod.slice(3)), m);
  };

  return (
    <Scrim label="Rectifier le podium" onClose={onClose}>
      <h3>Rectifier le podium</h3>
      <p className="meta" style={{ margin: '0 0 14px' }}>
        La version {c.v} reste dans l'historique. Vous créez la version {c.v + 1}.
      </p>
      <form id="rectform" noValidate onSubmit={submit}>
        <div className="trio">
          {[0, 1, 2].map((i) => (
            <div className="place" key={i}>
              <Medal i={c.pod[i]?.m ?? i + 1} />
              <input aria-label={`Place ${i + 1}`} value={names[i]}
                onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))} />
              <select aria-label="Pays" value={codes[i]}
                onChange={(e) => setCodes(codes.map((x, j) => (j === i ? e.target.value : x)))}>
                {nocOptions()}
              </select>
            </div>
          ))}
        </div>
        <label>Motif de la rectification
          <textarea ref={motifRef} value={motif} onChange={(e) => setMotif(e.target.value)}
            placeholder="Ex. : réclamation acceptée, disqualification après contrôle vidéo" />
        </label>
        {err && <ErrBox e={err} />}
        <div className="actions" style={{ margin: 0 }}>
          <button className="btn warn" type="submit">Créer la version {c.v + 1}</button>
          <button className="btn ghost" type="button" onClick={onClose}>Annuler</button>
        </div>
      </form>
    </Scrim>
  );
}
