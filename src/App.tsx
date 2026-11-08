import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { CalendarDays, CircleCheck, ChevronDown, Download, House, LogIn, LogOut, MapPin, Menu, RotateCcw, Search, X } from 'lucide-react';
import { ALL_SITES, LIVE, SITES } from './data';
import { usePodiumStore } from './hooks/usePodiumStore';
import { usePWAInstall } from './hooks/usePWAInstall';
import { Results, latestIn } from './components/Results';
import { Detail } from './components/Detail';
import { Medals } from './components/Medals';
import { Programme } from './components/Programme';
import { Publish } from './components/Publish';
import { LoginSheet, RectifySheet, InstallSheet, ConfirmResetSheet } from './components/Sheets';
import { Onboarding } from './components/Onboarding';

type Role = 'pub' | 'resp';
type Tab = 'results' | 'programme' | 'medals' | 'publish';
type Sheet = 'login' | 'rect' | 'menu' | 'install' | 'reset' | null;

function useMedia(q: string) {
  const [m, setM] = useState(() => matchMedia(q).matches);
  useEffect(() => {
    const mq = matchMedia(q);
    const h = () => setM(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [q]);
  return m;
}

export default function App() {
  const store = usePodiumStore();
  const { events, pending } = store;
  const { isInstallable, isIOS, triggerInstall } = usePWAInstall();

  const wide = useMedia('(min-width:1024px)');
  const [onb, setOnb] = useState(true);
  const [role, setRole] = useState<Role>('pub');
  const [tab, setTab] = useState<Tab>('results');
  const [site, setSite] = useState(ALL_SITES);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>(undefined);
  const screenRef = useRef<HTMLElement>(null);

  const toast = useCallback((m: string) => {
    setToastMsg(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  // En repassant sur petit écran, on revient à la liste.
  useEffect(() => { if (!wide) setOpen(null); }, [wide]);

  const split = tab === 'results' && wide;
  const openId = open && events.some((e) => e.id === open) ? open : split ? latestIn(events, site) : null;
  const openEvent = events.find((e) => e.id === openId) ?? null;

  // Remonte en haut de l'écran à chaque changement de vue.
  useEffect(() => { if (!split && screenRef.current) screenRef.current.scrollTop = 0; }, [tab, openId, split]);

  const goTab = (t: Tab) => { setTab(t); setOpen(null); };
  const openLogin = () => setSheet('login');
  const logout = () => {
    toast('Déconnecté');
    setRole('pub');
    if (tab === 'publish') setTab('results');
    setSheet(null);
  };
  const enter = (who: Role) => {
    setOnb(false);
    setRole(who);
    setTab('results');
    setOpen(null);
  };
  const install = async () => {
    if (isIOS) {
      setSheet('install');
      return;
    }
    const accepted = await triggerInstall();
    if (!accepted) {
      setSheet('install');
    }
  };

  const isResp = role === 'resp';

  const sideLinks = (cls: string) => (
    <div className={cls}>
      {!isResp && cls === 'side-links' && <button className="to-resp side" onClick={openLogin}>Je suis chef de site</button>}
      <button className="restart" onClick={() => setOnb(true)}>Revoir l'accueil</button>
      {isInstallable && (
        <button className="restart" onClick={install}>Installer l'application</button>
      )}
      {isResp && (
        <button className="restart" onClick={() => setSheet('reset')}>Réinitialiser la démo</button>
      )}
    </div>
  );

  const resultsList = (
    <Results events={events} pending={pending} site={site} q={q} isPublic={!isResp} openId={openId}
      onOpen={setOpen} onLogin={openLogin} />
  );
  const detail = openEvent && (
    <Detail event={openEvent} isResp={isResp} toast={toast}
      onBack={() => setOpen(null)}
      onValidate={() => { store.validate(openEvent.id); toast('Podium validé : officiel'); }}
      onRectify={() => setSheet('rect')}
      onTab={goTab} />
  );

  let body;
  if (split) {
    body = (
      <>
        <div className="pane">{resultsList}</div>
        <div className="pane detail">{detail ?? <p className="pick">Choisissez une épreuve.</p>}</div>
      </>
    );
  } else {
    body = (
      <div className="wrap">
        {tab === 'medals' ? <Medals events={events} />
          : tab === 'programme' ? <Programme pending={pending} site={site} q={q} />
          : tab === 'publish' && isResp ? (
            <Publish events={events} pending={pending} onPublish={(sid, pod) => {
              const id = store.publish(sid, pod);
              setTab('results');
              setOpen(id);
              toast('Podium publié en provisoire');
            }} />
          ) : detail ?? resultsList}
        {!detail && tab !== 'publish' && sideLinks('m-links')}
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: ReactNode; hidden?: boolean }[] = [
    { id: 'results', label: 'Résultats', icon: <path d="M6 20V11M12 20V5M18 20v-6" strokeWidth="3.2" strokeLinecap="round" /> },
    { id: 'programme', label: 'Programme', icon: <><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" strokeLinecap="round" /></> },
    { id: 'medals', label: 'Médailles', icon: <><circle cx="12" cy="15" r="5.5" /><path d="M8 3l4 6.5L16 3M12 13v4" strokeLinecap="round" /></> },
    { id: 'publish', label: 'Publier', icon: <path d="M12 5v14M5 12h14" />, hidden: !isResp },
  ];

  return (
    <div className="app" id="phone">
      <header className="top gut">
        <div className="flag" aria-hidden="true"><i /><i /><i /></div>
        <svg className="top-swoosh" viewBox="0 0 700 90" preserveAspectRatio="none" aria-hidden="true">
          <path d="M250 90C360 70 450 35 520 0h40C480 40 390 75 300 90z" fill="#fdef42" />
          <path d="M300 90C390 75 480 40 560 0h50C520 45 420 80 360 90z" fill="#00853f" />
          <path d="M360 90C420 80 520 45 610 0h22C545 48 452 84 400 90z" fill="#e31b23" />
        </svg>
        <div className="brand">
          <div className="logo">
            <img src="/brand/ayo-head.webp" alt="" className="logo-ayo" />
            <div><b>Podium Dakar</b><small className="logo-sub">Jeux Olympiques de la Jeunesse</small></div>
          </div>
          <label className="search">
            <Search size={18} aria-hidden="true" />
            <span className="vh">Rechercher</span>
            <input type="search" placeholder="Rechercher une épreuve, un athlète…" value={q}
              onChange={(e) => { setQ(e.target.value); if (tab !== 'results' && tab !== 'programme') goTab('results'); }} />
          </label>
          <div className="hright">
            {isResp && <button className="mode" title="Se déconnecter" onClick={logout}>Chef de site <span aria-hidden="true">×</span></button>}
            <label className="site" hidden={tab !== 'results' && tab !== 'programme'}>
              <span className="vh">Site</span>
              <select value={site} onChange={(e) => { setSite(e.target.value); if (wide) setOpen(null); }}>
                {SITES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>
        </div>
      </header>

      <header className="mtop">
        <svg className="mt-flag" viewBox="0 0 200 170" preserveAspectRatio="xMinYMin meet" aria-hidden="true">
          <path d="M0 0h200c-30 40-80 70-130 90S10 140 0 170z" fill="#e31b23" />
          <path d="M0 0h150c-25 32-65 55-105 70S6 112 0 132z" fill="#fdef42" />
          <path d="M0 0h100C82 24 55 42 28 54S4 80 0 92z" fill="#00853f" />
          <path d="M74 66l3 9h9.5l-7.7 5.6 3 9-7.8-5.6-7.8 5.6 3-9-7.7-5.6H71z" fill="#00853f" />
        </svg>
        <button className="mt-menu" aria-label="Menu" onClick={() => setSheet('menu')}><Menu size={24} /></button>
        <div className="mt-brand">
          <img src="/brand/ayo-head.webp" alt="" className="mt-ayo" />
          <div><b>JOJ</b><b className="mt-d">DAKAR 2026</b><small>Jeux Olympiques<br />de la Jeunesse</small></div>
        </div>
        <label className="mt-site" hidden={tab !== 'results' && tab !== 'programme'}>
          <MapPin size={18} aria-hidden="true" />
          <span>{site === ALL_SITES ? 'Podium Dakar' : site}</span>
          <ChevronDown size={16} aria-hidden="true" />
          <select aria-label="Site" value={site} onChange={(e) => { setSite(e.target.value); if (wide) setOpen(null); }}>
            {SITES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        {isResp && <span className="mt-role">Chef de site</span>}
        <img src="/brand/ayo.webp" alt="" className="mt-mascot" aria-hidden="true" />
      </header>

      <main className={`screen gut${split ? ' split' : ''}`} ref={screenRef}>{body}</main>

      <nav className="tabs gut">
        {TABS.filter((t) => !t.hidden).map((t) => (
          <button key={t.id} aria-current={tab === t.id} onClick={() => goTab(t.id)}>
            <svg viewBox="0 0 24 24">{t.icon}</svg>{t.label}
          </button>
        ))}
        <div className="guide">
          <div className="side-brand">
            <img src="/brand/ayo-head.webp" alt="" />
            <b>DAKAR 2026</b><small>Jeux Olympiques<br />de la Jeunesse</small>
          </div>
          <div className="stats">
            <b className="stats-h"><CalendarDays size={16} aria-hidden="true" /> Aujourd'hui</b>
            <div className="stat live"><strong>{LIVE.length}</strong><span>en direct</span></div>
            <div className="stat done"><strong>{events.length}</strong><span><CircleCheck size={14} aria-hidden="true" /> terminées</span></div>
            <div className="stat next"><strong>{pending.length}</strong><span>à venir</span></div>
          </div>
          {sideLinks('side-links')}
        </div>
      </nav>

      {sheet === 'login' && (
        <LoginSheet onClose={() => setSheet(null)}
          onSuccess={() => { setRole('resp'); setSheet(null); toast('Connecté : onglet Publier disponible'); }} />
      )}
      {sheet === 'rect' && openEvent && (
        <RectifySheet event={openEvent} onClose={() => setSheet(null)}
          onSubmit={(pod, motif) => {
            const v = store.rectify(openEvent.id, pod, motif);
            setSheet(null);
            toast(`Version ${v} publiée, l'ancienne reste visible`);
          }} />
      )}
      {sheet === 'menu' && (
        <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) setSheet(null); }}>
          <div className="sheet menu" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="menu-h"><h3>Menu</h3><button aria-label="Fermer" onClick={() => setSheet(null)}><X size={20} /></button></div>
            <button onClick={() => { setSheet(null); setOnb(true); }}><House size={20} />Revoir l'accueil</button>
            {isResp
              ? <button onClick={logout}><LogOut size={20} />Se déconnecter (chef de site)</button>
              : <button onClick={() => setSheet('login')}><LogIn size={20} />Je suis chef de site</button>}
            {isResp && (
              <button onClick={() => setSheet('reset')}><RotateCcw size={20} />Réinitialiser la démo</button>
            )}
            {isInstallable && <button onClick={() => { setSheet(null); install(); }}><Download size={20} />Installer l'application</button>}
          </div>
        </div>
      )}
      {sheet === 'install' && (
        <InstallSheet isIOS={isIOS} onClose={() => setSheet(null)} onInstall={triggerInstall} />
      )}
      {sheet === 'reset' && (
        <ConfirmResetSheet onClose={() => setSheet(null)} onConfirm={() => {
          store.reset();
          setOpen(null);
          setSheet(null);
          toast('Données de démo restaurées');
        }} />
      )}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}

      {onb && <Onboarding canInstall={isInstallable} onInstall={install}
        onGuest={() => enter('pub')}
        onLogin={() => { enter('resp'); toast('Connecté : onglet Publier disponible'); }} />}
    </div>
  );
}
