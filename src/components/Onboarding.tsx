import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowRight, CalendarDays, Eye, EyeOff, Facebook, Instagram, Linkedin, Lock, Mail, MapPin, Youtube,
} from 'lucide-react';
import { DEMO_ACCOUNT } from '../data';
import { ErrBox, type ApiError } from './ui';

interface Props {
  /** Connexion réussie avec un compte JOJ (chef de site). */
  onLogin: () => void;
  /** Consultation publique, sans compte. */
  onGuest: () => void;
  canInstall: boolean;
  onInstall: () => void;
}

/* Fichiers officiels à déposer dans public/brand/ (voir README). */
const LOGO = '/brand/joj-logo.png';
const AYO = '/brand/ayo.webp';
const AYO_HEAD = '/brand/ayo-head.webp';
const HERO = '/brand/hero.jpg';

const REMEMBER_KEY = 'podium-remember-email';


/** Image officielle, ou le contenu de secours si le fichier n'a pas encore été ajouté. */
function Img({ src, alt, className, fallback = null }: { src: string; alt: string; className: string; fallback?: ReactNode }) {
  const [ok, setOk] = useState(true);
  return ok ? <img src={src} alt={alt} className={className} onError={() => setOk(false)} /> : <>{fallback}</>;
}

function readRemembered() {
  try { return localStorage.getItem(REMEMBER_KEY) ?? ''; } catch { return ''; }
}
function writeRemembered(v: string | null) {
  try { v ? localStorage.setItem(REMEMBER_KEY, v) : localStorage.removeItem(REMEMBER_KEY); } catch { /* stockage indisponible */ }
}

/* Logos de secours (texte) tant que les fichiers officiels ne sont pas déposés. */
const JojFallback = (
  <div className="fb-joj" role="img" aria-label="Dakar 2026, Jeux Olympiques de la Jeunesse">
    <b>JOJ</b><span>DAKAR 2026</span>
    <svg viewBox="0 0 64 30" aria-hidden="true" className="rings">
      {[[10, 10, '#0081c8'], [32, 10, '#000'], [54, 10, '#ee334e'], [21, 20, '#fcb131'], [43, 20, '#00a651']].map(([x, y, c]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="8.5" fill="none" stroke={c as string} strokeWidth="2.2" />
      ))}
    </svg>
  </div>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20" /></svg>
);
const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true" className="gicon">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

export function Onboarding({ onLogin, onGuest, canInstall, onInstall }: Props) {
  const remembered = readRemembered();
  // Démo : seul le compte de test existe, il est pré-rempli.
  const [email, setEmail] = useState(remembered || DEMO_ACCOUNT.email);
  const [pass, setPass] = useState(DEMO_ACCOUNT.pass);
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(!!remembered);
  const [err, setErr] = useState<ApiError | null>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const unavailable = (what: string) =>
    setErr({ status: 501, code: 'NOT_AVAILABLE', msg: `${what} n'est pas encore disponible dans cette démonstration.` });

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
    writeRemembered(remember ? em : null);
    setErr(null);
    onLogin();
  };

  return (
    <section className="onb" aria-label="Bienvenue">
      <div className="onb-bg" aria-hidden="true">
        <Img src={HERO} alt="" className="onb-photo" />
      </div>

      <div className="onb-hero">
        <div className="onb-logos">
          <Img src={LOGO} alt="Dakar 2026, Jeux Olympiques de la Jeunesse" className="brand-img" fallback={JojFallback} />
          <i className="vsep" aria-hidden="true" />
          <span className="ayo-badge"><img src={AYO_HEAD} alt="Ayo, la mascotte de Dakar 2026" /></span>
        </div>
        <h1>Jeux Olympiques<br />de la Jeunesse<br /><em>Dakar 2026</em></h1>
        <div className="ayo-hero">
          <Img src={AYO} alt="Ayo, la mascotte des JOJ Dakar 2026, brandit la flamme" className="ayo-img" />
        </div>
      </div>

      <div className="onb-side">
        <p className="script big" aria-hidden="true">Ensemble pour<br />Dakar 2026</p>

        <div className="login-card">
          <span className="card-flag" aria-hidden="true"><i /><i /><i /></span>
          <div className="card-head">
            <svg viewBox="0 0 48 26" aria-hidden="true" className="people">
              <circle cx="11" cy="7" r="5" fill="#0b7a3b" /><path d="M2 25a9 8 0 0 1 18 0z" fill="#0b7a3b" />
              <circle cx="24" cy="5.5" r="5.5" fill="#f2c40f" /><path d="M14 25a10 9 0 0 1 20 0z" fill="#f2c40f" />
              <circle cx="37" cy="7" r="5" fill="#e0342b" /><path d="M28 25a9 8 0 0 1 18 0z" fill="#e0342b" />
            </svg>
            <h2>Se connecter</h2>
            <p className="script">Ensemble pour Dakar 2026</p>
          </div>

          <form noValidate onSubmit={submit} className="login-form">
            <label className="field">
              <Mail size={19} aria-hidden="true" />
              <span className="vh">Adresse e-mail ou numéro de téléphone</span>
              <input type="text" autoComplete="username" placeholder="Adresse e-mail ou numéro de téléphone"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="field">
              <Lock size={19} aria-hidden="true" />
              <span className="vh">Mot de passe</span>
              <input ref={passRef} type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Mot de passe"
                value={pass} onChange={(e) => setPass(e.target.value)} />
              <button type="button" className="eye" onClick={() => setShow(!show)}
                aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                {show ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </label>

            <div className="row-opts">
              <label className="check">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Se souvenir de moi
              </label>
              <button type="button" className="link" onClick={() => unavailable('La récupération du mot de passe')}>
                Mot de passe oublié&nbsp;?
              </button>
            </div>

            {err && <ErrBox e={err} />}

            <button type="submit" className="primary">Se connecter <ArrowRight size={20} aria-hidden="true" /></button>

            <div className="or"><span>ou</span></div>

            <button type="button" className="social" onClick={() => unavailable('La connexion Google')}>
              <GoogleIcon /> Continuer avec Google
            </button>
            <button type="button" className="social" onClick={() => unavailable('La connexion Orange')}>
              <span className="orange" aria-hidden="true">orange</span> Continuer avec Orange
            </button>

            <p className="signup">
              Vous n'avez pas de compte&nbsp;?{' '}
              <button type="button" className="link strong" onClick={() => unavailable('La création de compte')}>Créer un compte</button>
            </p>
          </form>
        </div>

        <div className="guest">
          <button type="button" onClick={onGuest}>Voir les résultats sans compte <ArrowRight size={16} aria-hidden="true" /></button>
          {canInstall && <button type="button" onClick={onInstall}>Installer l'application</button>}
        </div>
      </div>

      <footer className="onb-foot">
        <div className="fi"><CalendarDays size={30} aria-hidden="true" /><div><b>Dakar 2026</b><span>Du 31 octobre au 13 novembre</span></div></div>
        <div className="fi"><MapPin size={30} aria-hidden="true" /><div><b>Sénégal</b><span>Pays hôte</span></div></div>
        <p className="script">Unis par le sport,<br />connectés par l'innovation</p>
        <nav className="socials" aria-label="Réseaux sociaux">
          <a href="https://www.youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube size={18} /></a>
          <a href="https://www.facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={18} /></a>
          <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X"><XIcon /></a>
          <a href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a>
          <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={18} /></a>
        </nav>
      </footer>
    </section>
  );
}
