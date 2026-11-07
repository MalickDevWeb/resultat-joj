import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ALL_SITES, LIVE, SITES } from './data';
import { usePodiumStore } from './hooks/usePodiumStore';
import { usePWAInstall } from './hooks/usePWAInstall';
import { Results, latestIn } from './components/Results';
import { Detail } from './components/Detail';
import { Medals } from './components/Medals';
import { Publish } from './components/Publish';
import { LoginSheet, RectifySheet } from './components/Sheets';
import { Onboarding } from './components/Onboarding';

type Role = 'pub' | 'resp';
type Tab = 'results' | 'medals' | 'publish';
type Sheet = 'login' | 'rect' | null;

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
    setRole('pub');
    setTab('results');
    setOpen(null);
    if (who === 'resp') setSheet('login');
  };
  const install = async () => {
    if (isIOS) {
      alert('Sur iOS, appuyez sur « Partager » puis « Sur l\'écran d\'accueil » pour installer l\'application.');
      return;
    }
    await triggerInstall();
  };

  const isResp = role === 'resp';

  const sideLinks = (cls: string) => (
    <div className={cls}>
      {!isResp && cls === 'side-links' && <button className="to-resp side" onClick={openLogin}>Je suis chef de site</button>}
      <button className="restart" onClick={() => setOnb(true)}>Revoir l'accueil</button>
      {isResp && (
        <button className="restart" onClick={() => {
          if (confirm('Réinitialiser toutes les données de démonstration ?')) { store.reset(); setOpen(null); toast('Données de démo restaurées'); }
        }}>Réinitialiser la démo</button>
      )}
    </div>
  );

  const resultsList = (
    <Results events={events} pending={pending} site={site} isPublic={!isResp} openId={openId}
      onOpen={setOpen} onLogin={openLogin} />
  );
  const detail = openEvent && (
    <Detail event={openEvent} isResp={isResp} toast={toast}
      onBack={() => setOpen(null)}
      onValidate={() => { store.validate(openEvent.id); toast('Podium validé : officiel'); }}
      onRectify={() => setSheet('rect')} />
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
    { id: 'results', label: 'Résultats', icon: <path d="M4 6h16M4 12h16M4 18h10" /> },
    { id: 'medals', label: 'Médailles', icon: <><circle cx="12" cy="14" r="6" /><path d="M8 3l4 5 4-5" /></> },
    { id: 'publish', label: 'Publier', icon: <path d="M12 5v14M5 12h14" />, hidden: !isResp },
  ];

  return (
    <div className="app" id="phone">
      <header className="top gut">
        <div className="flag" aria-hidden="true"><i /><i /><i /></div>
        <div className="brand">
          <div className="logo">
            <i aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3M12 13v4M9 20h6" /></svg></i>
            <b>Podium Dakar</b>
          </div>
          <div className="hright">
            {isResp && <button className="mode" title="Se déconnecter" onClick={logout}>Chef de site <span aria-hidden="true">×</span></button>}
            <label className="site" hidden={tab !== 'results'}>
              <span className="vh">Site</span>
              <select value={site} onChange={(e) => { setSite(e.target.value); if (wide) setOpen(null); }}>
                {SITES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>
        </div>
      </header>

      <main className={`screen gut${split ? ' split' : ''}`} ref={screenRef}>{body}</main>

      <nav className="tabs gut">
        {TABS.filter((t) => !t.hidden).map((t) => (
          <button key={t.id} aria-current={tab === t.id} onClick={() => goTab(t.id)}>
            <svg viewBox="0 0 24 24">{t.icon}</svg>{t.label}
          </button>
        ))}
        <div className="guide">
          <b>Aujourd'hui</b>
          <div className="stats">
            <div className="stat live"><strong>{LIVE.length}</strong><span>en direct</span></div>
            <div className="stat"><strong>{events.length}</strong><span>terminées</span></div>
            <div className="stat"><strong>{pending.length}</strong><span>à venir</span></div>
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
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}

      {onb && <Onboarding onEnter={enter} canInstall={isInstallable} onInstall={install}
        live={LIVE.length} done={events.length} next={pending.length} />}
    </div>
  );
}
