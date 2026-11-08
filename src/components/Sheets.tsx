import { useEffect, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import {
  Check, CheckCircle2, Download, MoreVertical, RotateCcw, Share, Smartphone, Sparkles, SquarePlus, X, Zap
} from 'lucide-react';
import { DEMO_ACCOUNT, cur, type Place, type PodiumEvent } from '../data';
import { ErrBox, Medal, nocOptions, type ApiError } from './ui';

function Scrim({
  label,
  className = '',
  onClose,
  children,
}: {
  label: string;
  className?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Ferme uniquement sur un clic sur le fond, pas à l'intérieur de la feuille.
  const onClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="scrim" onClick={onClick} role="presentation">
      <div className={`sheet ${className}`} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
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

export function InstallSheet({
  isIOS = false,
  onClose,
  onInstall,
}: {
  isIOS?: boolean;
  onClose: () => void;
  onInstall?: () => Promise<boolean | void> | void;
}) {
  const [platform, setPlatform] = useState<'ios' | 'android'>(isIOS ? 'ios' : 'android');

  const handleDirectInstall = async () => {
    if (onInstall) {
      await onInstall();
      onClose();
    }
  };

  return (
    <Scrim label="Installer l'application" className="sheet-install" onClose={onClose}>
      <div className="sheet-grabber" aria-hidden="true" />
      <button type="button" className="sheet-x-btn" onClick={onClose} aria-label="Fermer la boîte de dialogue">
        <X size={18} />
      </button>

      <div className="inst-head">
        <div className="inst-app-icon">
          <img src="/icons/icon-192.png" alt="Podium Dakar 2026" />
          <span className="inst-app-tag" aria-hidden="true">JOJ</span>
        </div>
        <div className="inst-meta">
          <div className="inst-title-row">
            <h3>Podium Dakar 2026</h3>
            <span className="badge-official"><Check size={11} strokeWidth={3} /> Officiel</span>
          </div>
          <p className="inst-sub">Application Web Progressive (PWA)</p>
        </div>
      </div>

      <div className="inst-features">
        <div className="inst-feat"><Zap size={13} /><span>Accès direct</span></div>
        <div className="inst-feat"><CheckCircle2 size={13} /><span>Mode hors-ligne</span></div>
        <div className="inst-feat"><Smartphone size={13} /><span>Plein écran</span></div>
      </div>

      <div className="inst-switcher" role="tablist" aria-label="Choix de la plateforme">
        <button
          type="button"
          role="tab"
          aria-selected={platform === 'ios'}
          className={`inst-tab-btn ${platform === 'ios' ? 'active' : ''}`}
          onClick={() => setPlatform('ios')}
        >
          <span>iPhone / iPad (Safari)</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={platform === 'android'}
          className={`inst-tab-btn ${platform === 'android' ? 'active' : ''}`}
          onClick={() => setPlatform('android')}
        >
          <span>Android / Chrome</span>
        </button>
      </div>

      {platform === 'ios' ? (
        <div className="inst-steps ios-steps">
          <div className="inst-step">
            <div className="step-num-icon ios-share" aria-hidden="true">
              <Share size={19} />
            </div>
            <div className="step-body">
              <h4>1. Touchez le bouton Partager</h4>
              <p>Dans la barre d'outils en bas de Safari (ou en haut sur iPad).</p>
            </div>
          </div>

          <div className="inst-step">
            <div className="step-num-icon ios-add" aria-hidden="true">
              <SquarePlus size={19} />
            </div>
            <div className="step-body">
              <h4>2. « Sur l'écran d'accueil »</h4>
              <p>Faites défiler la feuille d'options vers le bas et sélectionnez cette ligne.</p>
            </div>
          </div>

          <div className="inst-step">
            <div className="step-num-icon ios-done" aria-hidden="true">
              <Sparkles size={19} />
            </div>
            <div className="step-body">
              <h4>3. Touchez « Ajouter »</h4>
              <p>En haut à droite. L'icône Dakar 2026 s'installe directement sur votre écran !</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="inst-steps android-steps">
          {onInstall && (
            <button type="button" className="inst-direct-btn" onClick={handleDirectInstall}>
              <Download size={18} />
              <span>Installer maintenant en 1 clic</span>
            </button>
          )}

          <div className="inst-step">
            <div className="step-num-icon and-menu" aria-hidden="true">
              <MoreVertical size={19} />
            </div>
            <div className="step-body">
              <h4>1. Ouvrez le menu Chrome</h4>
              <p>Appuyez sur les trois points verticaux <b>(⋮)</b> en haut à droite.</p>
            </div>
          </div>

          <div className="inst-step">
            <div className="step-num-icon and-install" aria-hidden="true">
              <Download size={19} />
            </div>
            <div className="step-body">
              <h4>2. « Installer l'application »</h4>
              <p>Ou « Ajouter à l'écran d'accueil » dans la liste déroulante.</p>
            </div>
          </div>

          <div className="inst-step">
            <div className="step-num-icon and-done" aria-hidden="true">
              <CheckCircle2 size={19} />
            </div>
            <div className="step-body">
              <h4>3. Confirmez l'installation</h4>
              <p>L'application s'ouvrira en plein écran sans barre d'adresse de navigateur.</p>
            </div>
          </div>
        </div>
      )}

      <div className="inst-tip">
        <span aria-hidden="true">💡</span>
        <p>Installation sécurisée et instantanée, sans inscription ni magasin d'applications.</p>
      </div>

      <div className="inst-foot">
        <button type="button" className="inst-main-btn" onClick={onClose}>
          J'ai compris
        </button>
      </div>
    </Scrim>
  );
}

export function ConfirmResetSheet({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Scrim label="Réinitialiser les données" className="sheet-confirm" onClose={onClose}>
      <div className="sheet-grabber" aria-hidden="true" />
      <button type="button" className="sheet-x-btn" onClick={onClose} aria-label="Fermer">
        <X size={18} />
      </button>

      <div className="confirm-icon-box" aria-hidden="true">
        <RotateCcw size={28} />
      </div>

      <h3 className="confirm-title">Réinitialiser la démo ?</h3>
      <p className="confirm-text">
        Tous les résultats enregistrés et podiums rectifiés seront réinitialisés aux données officielles initiales de Dakar 2026.
      </p>

      <div className="confirm-btns">
        <button
          type="button"
          className="btn-danger"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          <RotateCcw size={16} /> Réinitialiser les données
        </button>
        <button type="button" className="btn-cancel" onClick={onClose}>
          Annuler
        </button>
      </div>
    </Scrim>
  );
}
