import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { CalendarDays, ChevronDown, Download, House, LogIn, LogOut, MapPin, MessageCircle, Mic, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { ALL_SITES, SITES } from './data';
import { usePodiumStore } from './hooks/usePodiumStore';
import { useLive } from './hooks/useLive';
import { useAlertes, useNotifications } from './hooks/useNotifications';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useAssistant } from './hooks/useAssistant';
import { Results, latestIn } from './components/Results';
import { Detail } from './components/Detail';
import { Medals } from './components/Medals';
import { Programme } from './components/Programme';
import { Combo } from './components/Combo';
import { Publish } from './components/Publish';
import { News } from './components/News';
import { LoginSheet, RectifySheet, InstallSheet, ConfirmResetSheet } from './components/Sheets';
import { Onboarding } from './components/Onboarding';
import { AssistantSheet } from './components/Assistant';
import { BanniereAnimee } from './components/BanniereAnimee';
import { BoutonMicro } from './components/Voix';
import { useDictee } from './hooks/useVoix';
import { MENTION, nettoyerDictee } from './hooks/voix';

type Role = 'pub' | 'resp';
type Tab = 'results' | 'programme' | 'medals' | 'publish';
type Sheet = 'login' | 'rect' | 'install' | 'reset' | 'assistant' | null;

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

const siteOptions = SITES.map((x) => ({
  value: x, label: x, hint: x === ALL_SITES ? undefined : 'Site',
}));

export default function App() {
  const store = usePodiumStore();
  const notifications = useNotifications();
  const { live, lu: directLu } = useLive(notifications.etat === 'actives');
  const { events, pending } = store;
  useAlertes(notifications.etat === 'actives', live, directLu, events);
  const { isInstallable, isIOS, triggerInstall } = usePWAInstall();
  const conversation = useAssistant();
  const assistRef = useRef<HTMLButtonElement>(null);

  const wide = useMedia('(min-width:1024px)');
  const [role, setRole] = useState<Role>('pub');
  const [onb, setOnb] = useState(true);
  const [tab, setTab] = useState<Tab>('results');
  const [site, setSite] = useState(ALL_SITES);
  const [q, setQ] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  // « / » place le curseur dans la recherche (sauf pendant une saisie).
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || t?.closest('input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    addEventListener('keydown', h);
    return () => removeEventListener('keydown', h);
  }, []);
  const [open, setOpen] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [questionPrete, setQuestionPrete] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>(undefined);
  const screenRef = useRef<HTMLElement>(null);

  const toast = useCallback((m: string, duree = 2600) => {
    setToastMsg(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), duree);
  }, []);

  // En repassant sur petit écran, on revient à la liste.
  useEffect(() => { if (!wide) setOpen(null); }, [wide]);

  const split = tab === 'results' && wide;
  const openId = open && events.some((e) => e.id === open) ? open : split ? latestIn(events, site, q) : null;
  const openEvent = events.find((e) => e.id === openId) ?? null;

  // Remonte en haut de l'écran à chaque changement de vue.
  useEffect(() => { if (!split && screenRef.current) screenRef.current.scrollTop = 0; }, [tab, openId, split]);

  const goTab = (t: Tab) => {
    setTab(t);
    setOpen(null);
  };
  /** Une recherche, tapée ou dictée : on revient aux résultats si besoin. */
  const chercher = (texte: string) => {
    setQ(texte);
    if (wide) setOpen(null);
    if (tab !== 'results' && tab !== 'programme') goTab('results');
  };
  const dictee = useDictee({
    surTexte: (dicte) => chercher(nettoyerDictee(dicte)),
    surErreur: (phrase) => toast(phrase),
    surPrevenir: () => toast(MENTION, 6000),
  });
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
      {cls === 'm-links' && (isResp ? (
        <div className="acct-on m-acct">
          <span className="acct-av" aria-hidden="true"><ShieldCheck size={18} /></span>
          <span className="acct-txt"><b>Chef de site</b><small>Connecté</small></span>
          <button type="button" className="acct-out" onClick={logout}><LogOut size={16} aria-hidden="true" /> Se déconnecter</button>
        </div>
      ) : (
        <button type="button" className="acct-in m-acct" onClick={openLogin}><LogIn size={17} aria-hidden="true" /> Espace chef de site</button>
      ))}
      <button className="restart" onClick={() => setOnb(true)}><House size={16} aria-hidden="true" /> Revoir l'accueil</button>
      {isInstallable && (
        <button className="restart" onClick={install}><Download size={16} aria-hidden="true" /> Installer l'application</button>
      )}
      <button className="restart" onClick={() => setSheet('reset')}><RotateCcw size={16} aria-hidden="true" /> Restaurer les données officielles</button>
    </div>
  );

  const resultsList = (
    <Results live={live} importedAt={store.importedAt} events={events} pending={pending} site={site} q={q} openId={openId}
      onOpen={setOpen} onGoProgramme={() => goTab('programme')} onOpenAssistant={() => setSheet('assistant')} />
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
        <div className="pane detail view" key={openId ?? 'none'}>{detail ?? <p className="pick">Choisissez une épreuve.</p>}</div>
      </>
    );
  } else {
    body = (
      <div className="wrap view" key={`${tab}-${openId ?? ''}`}>
        {tab === 'medals' ? <Medals events={events} pending={pending} official={store.medals} onAsk={(q) => { setQuestionPrete(q); setSheet('assistant'); }}
          onVoirEpreuves={chercher} onVoirProgramme={() => goTab('programme')} />
          : tab === 'programme' ? <Programme pending={pending} site={site} q={q} />
          : tab === 'publish' ? (
            isResp ? (
              <Publish events={events} pending={pending} onPublish={(sid, pod) => {
                const id = store.publish(sid, pod);
                setTab('results');
                setOpen(id);
                toast('Podium publié en provisoire');
              }} />
            ) : (
              <News onOpenAssistant={() => setSheet('assistant')} onToast={toast} notifications={notifications} />
            )
          ) : detail ?? resultsList}
        {!detail && tab !== 'publish' && sideLinks('m-links')}
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: ReactNode; hidden?: boolean }[] = [
    { id: 'results', label: 'Résultats', icon: <path d="M6 20V11M12 20V5M18 20v-6" strokeWidth="3.2" strokeLinecap="round" /> },
    { id: 'programme', label: 'Programme', icon: <><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" strokeLinecap="round" /></> },
    { id: 'medals', label: 'Médailles', icon: <><circle cx="12" cy="15" r="5.5" /><path d="M8 3l4 6.5L16 3M12 13v4" strokeLinecap="round" /></> },
    {
      id: 'publish',
      label: isResp ? 'Publier' : 'Actualités',
      icon: isResp ? (
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34M6 4h12v5a6 6 0 0 1-12 0V4z" />
      ) : (
        <>
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z" />
        </>
      ),
      hidden: false,
    },
  ];

  return (
    <div className="app" id="phone">
      <header className="top gut">
        <div className="flag" aria-hidden="true"><i /><i /><i /></div>
        <div className="brand">
          <div className="logo">
            <img src="/brand/ayo-head.webp" alt="" className="logo-ayo" />
            <div><b>Podium Dakar</b><small className="logo-sub">Jeux Olympiques de la Jeunesse</small></div>
          </div>
          <label className="search">
            <Search size={18} aria-hidden="true" />
            <span className="vh">Rechercher</span>
            <input ref={searchRef} type="search" value={q}
              placeholder={dictee.ecoute ? 'J’écoute…' : 'Rechercher une épreuve, un athlète…'}
              onKeyDown={(e) => { if (e.key === 'Escape') { dictee.annuler(); setQ(''); e.currentTarget.blur(); } }}
              onChange={(e) => chercher(e.target.value)} />
            {!q && !dictee.ecoute && <kbd className="search-kbd" aria-hidden="true" title="Raccourci : /">/</kbd>}
            {dictee.disponible && (
              <>
                <BoutonMicro nom="Dicter votre recherche" ecoute={dictee.ecoute} onClick={dictee.basculer} />
                {dictee.ecoute && <span className="vh" role="status">J’écoute…</span>}
              </>
            )}
          </label>
          <div className="hright">
            <div className="site" hidden={tab !== 'results' && tab !== 'programme'}>
              <Combo label="Site" className="combo-site" value={site} options={siteOptions} searchPlaceholder="Rechercher un site…"
                onChange={(v) => { setSite(v); if (wide) setOpen(null); }} />
            </div>
            {isResp ? (
              <div className="acct-on">
                <span className="acct-av" aria-hidden="true"><ShieldCheck size={18} /></span>
                <span className="acct-txt"><b>Chef de site</b><small>Connecté</small></span>
                <button type="button" className="acct-out" onClick={logout}><LogOut size={16} aria-hidden="true" /> Se déconnecter</button>
              </div>
            ) : (
              <button type="button" className="acct-in" onClick={openLogin}><LogIn size={17} aria-hidden="true" /> Espace chef de site</button>
            )}
          </div>
        </div>
      </header>

      <header className="mtop mtop-maquette">
        <BanniereAnimee src="/brand/hero-resume.webp" alt="JOJ Dakar 2026" className="mtop-hero-banner" />
        <div className="mt-site-wrap" hidden={tab !== 'results' && tab !== 'programme'}>
          <Combo label="Site" className="mt-site" value={site} options={siteOptions} searchPlaceholder="Rechercher un site…"
            onChange={(v) => { setSite(v); if (wide) setOpen(null); }}
            trigger={<><MapPin size={18} aria-hidden="true" /><span>{site === ALL_SITES ? 'Tous les sites' : site}</span><ChevronDown size={16} aria-hidden="true" /></>} />
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
          <div className="side-brand">
            <img src="/brand/ayo-head.webp" alt="" />
            <b>DAKAR 2026</b><small>Jeux Olympiques<br />de la Jeunesse</small>
          </div>
          <div className="stats">
            <b className="stats-h"><CalendarDays size={16} aria-hidden="true" /> Aujourd'hui</b>
            {([
              ['live', live.length, 'en direct', 'results'],
              ['done', events.length, 'terminées', 'results'],
              ['next', pending.length, 'à venir', 'programme'],
            ] as const).map(([k, n, label, to]) => (
              <button key={k} type="button" className={`stat ${k}`} disabled={n === 0}
                title={n === 0 ? `Aucune épreuve ${label}` : `Voir les épreuves ${label}`}
                onClick={() => { setQ(''); goTab(to); }}>
                <strong>{n}</strong><span>{label}</span>
              </button>
            ))}
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
      {sheet === 'assistant' && (
        <AssistantSheet conversation={conversation} questionInitiale={questionPrete} onClose={() => { setSheet(null); setQuestionPrete(''); assistRef.current?.focus(); }} />
      )}
      {!onb && (sheet === null || sheet === 'assistant') && tab !== 'publish' && (
        <button
          type="button"
          ref={assistRef}
          className="assist-fab-voice"
          aria-haspopup="dialog"
          onClick={() => setSheet('assistant')}
          aria-label="Posez votre question à notre assistant vocal"
          title="Assistant des Jeux"
        >
          <span className="assist-fab-ring assist-fab-ring-1" aria-hidden="true" />
          <span className="assist-fab-ring assist-fab-ring-2" aria-hidden="true" />
          <span className="assist-fab-btn" aria-hidden="true">
            <Mic size={24} />
          </span>
        </button>
      )}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}

      {onb && <Onboarding canInstall={isInstallable} onInstall={install}
        onGuest={() => enter('pub')}
        onLogin={() => { enter('resp'); toast('Connecté : onglet Publier disponible'); }} />}

    </div>
  );
}
