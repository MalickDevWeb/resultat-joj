import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, Check, ChevronDown, ChevronRight, Mic, Trophy, X } from 'lucide-react';
import { ALL_SITES, NOC } from '../data';
import { ErrBox, Flag, type ApiError } from './ui';
import { BarreVocale, BoutonEcouter } from './Voix';
import { arreterLecture, lectureDisponible } from '../hooks/useVoix';

/** Réponse de /api/resume (spec 005). */
export interface Resume {
  jour: string;
  titre: string;
  paragraphes: string[];
  epreuves: { id: string; disc: string; event: string; podium: Medaille[] }[];
}

/** Un médaillé du site officiel ; une équipe porte le nom anglais de son pays. */
export interface Medaille {
  m: number;
  c: string;
  n: string;
  equipe?: boolean;
}

const MEDAILLE = ['', '🥇', '🥈', '🥉'];
const MEDAILLE_LUE = ['', 'Or', 'Argent', 'Bronze'];

/** « Grenyelis Garcia (Venezuela) », ou pour une équipe « Ukraine », en français. */
const medaille = (p: Medaille) => {
  const pays = NOC[p.c] ?? p.c;
  return p.equipe ? pays : `${p.n} (${pays})`;
};

/** « 🥇 Grenyelis Garcia (Venezuela) », ou pour une équipe « 🥇 Ukraine », en français. */
export const medailleLisible = (p: Medaille) => `${MEDAILLE[p.m] ?? ''} ${medaille(p)}`.trim();

/** « Or, Grenyelis Garcia (Venezuela) » : la médaille dite en mots, pour la lecture à voix haute. */
const medailleLue = (p: Medaille) => [MEDAILLE_LUE[p.m], medaille(p)].filter(Boolean).join(', ');
const ERREUR_RESEAU: ApiError = { status: 0, code: 'RESEAU', msg: 'Impossible de joindre le serveur. Vérifiez votre connexion, puis rouvrez le résumé.' };

const DEBUT = '2026-10-31';
const FIN = '2026-11-13';
const veille = (jour: string) => new Date(Date.parse(`${jour}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/**
 * Jours à demander, dans l'ordre : aujourd'hui puis la veille (si aujourd'hui n'a pas encore de finale),
 * toujours pendant les Jeux. Après les Jeux, le dernier jour ; avant, aucun.
 */
export function joursAEssayer(aujourdhui: string): string[] {
  if (aujourdhui < DEBUT) return [];
  if (aujourdhui > FIN) return [FIN];
  return aujourdhui === DEBUT ? [DEBUT] : [aujourdhui, veille(aujourdhui)];
}

/** AAAA-MM-JJ du jour à Dakar (UTC+0). */
const jourDakar = () => new Date().toISOString().slice(0, 10);
const PAS_ENCORE: ApiError = { status: 404, code: 'AUCUN_PODIUM', msg: 'Pas encore de finale : le premier résumé arrivera après les premières médailles.' };

const libelleJour = (jour: string) =>
  new Date(`${jour}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

/** Ce qui est lu à voix haute, phrase par phrase : titre, jour, paragraphes, puis chaque épreuve et son podium. */
export function texteDuResume(r: Resume): string[] {
  return [
    r.titre,
    libelleJour(r.jour),
    ...r.paragraphes,
    ...r.epreuves.map((e) => `${e.disc} · ${e.event} : ${e.podium.map(medailleLue).join(' ; ')}.`),
  ];
}

const estObjet = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;
const texte = (x: unknown): x is string => typeof x === 'string';

/** Vérifie la forme de la réponse plutôt que de la croire sur parole. */
function estResume(x: unknown): x is Resume {
  return estObjet(x) && texte(x.jour) && texte(x.titre)
    && Array.isArray(x.paragraphes) && x.paragraphes.every(texte)
    && Array.isArray(x.epreuves) && x.epreuves.every((e) => estObjet(e) && texte(e.id) && texte(e.disc) && texte(e.event) && Array.isArray(e.podium));
}

async function lireResume(jour: string): Promise<Resume | ApiError> {
  const r = await fetch(`/api/resume?jour=${jour}`);
  const corps: unknown = await r.json().catch(() => null);
  if (r.ok && estResume(corps)) return corps;
  return {
    status: r.status,
    code: estObjet(corps) && texte(corps.code) ? corps.code : 'INCONNU',
    msg: estObjet(corps) && texte(corps.message) ? corps.message : ERREUR_RESEAU.msg,
  };
}

/** Identifiant de la lecture du résumé. */
const LECTURE = 'resume-du-jour';

const estErreur = (x: Resume | ApiError): x is ApiError => 'msg' in x;

export interface ChampionProfile {
  id: string;
  nom: string;
  pays: string;
  codePays: string;
  flagEmoji: string;
  sport: string;
  epreuve: string;
  medaille: 'or' | 'argent' | 'bronze';
  medailleLabel: string;
  medailleEmoji: string;
  photoUrl: string;
  photoVraie?: string; // Vraie photo du champion (fichier local /athletes/… ou URL externe)
  scorePerf: string;
  record: string;
  resumeSimple: string;
  phrasesVocales: string[];
}

/** Composant d'avatar avec détection automatique de vraie image et fallback élégant. */
function AvatarAthlete({
  src,
  alt,
  className = '',
  fallbackInitials = '',
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackInitials?: string;
}) {
  const [error, setError] = useState(false);
  if (error || !src) {
    return (
      <div className={`rj-champ-avatar-fallback ${className}`}>
        <span>{fallbackInitials || alt.slice(0, 2).toUpperCase()}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}

export const CHAMPIONS_DU_JOUR: ChampionProfile[] = [
  {
    id: 'sara-campos',
    nom: 'Sara Campos',
    pays: 'Brésil',
    codePays: 'BRA',
    flagEmoji: '🇧🇷',
    sport: 'Boxe',
    epreuve: '57 kg filles',
    medaille: 'or',
    medailleLabel: "Médaille d'or 🥇",
    medailleEmoji: '🥇',
    photoUrl: '/brand/athlete-1.webp',
    scorePerf: 'Victoire 5-0 en finale (décision unanime)',
    record: '⭐ Nouveau record JOJ : 1ère médaille d’or de l’histoire du Brésil en boxe féminine aux Jeux Olympiques de la Jeunesse !',
    resumeSimple: 'Sara Campos a survolé la compétition des 57 kg. Avec 4 victoires éclatantes et un score parfait de 5-0 en finale, elle entre dans l’histoire olympique brésilienne.',
    phrasesVocales: [
      'Sara Campos, championne du Brésil en boxe 57 kg.',
      'Elle a remporté la médaille d’or aux JOJ Dakar 2026 avec un score net de 5 à 0 en finale.',
      'C’est un record historique : la première médaille d’or du Brésil dans cette épreuve aux Jeux de la Jeunesse !',
    ],
  },
  {
    id: 'aknur-tursyngali',
    nom: 'Aknur Tursyngali',
    pays: 'Kazakhstan',
    codePays: 'KAZ',
    flagEmoji: '🇰🇿',
    sport: 'Boxe',
    epreuve: '57 kg filles',
    medaille: 'argent',
    medailleLabel: "Médaille d'argent 🥈",
    medailleEmoji: '🥈',
    photoUrl: '/brand/athlete-2.webp',
    scorePerf: 'Finaliste JOJ · 3 combats gagnés',
    record: '⭐ Record du tournoi : 2 victoires par arrêt de l’arbitre au 1er et 2e tour.',
    resumeSimple: 'Aknur Tursyngali décroche une superbe médaille d’argent après un parcours héroïque, confirmant la suprématie de l’école de boxe kazakhe sur la scène internationale.',
    phrasesVocales: [
      'Aknur Tursyngali, vice-championne du Kazakhstan en boxe 57 kg.',
      'Elle remporte la médaille d’argent des JOJ Dakar 2026.',
      'Elle a établi le record du tournoi avec deux victoires avant la limite.',
    ],
  },
  {
    id: 'yevanhelina-petruk',
    nom: 'Yevanhelina Petruk',
    pays: 'Ukraine',
    codePays: 'UKR',
    flagEmoji: '🇺🇦',
    sport: 'Boxe',
    epreuve: '50 kg filles',
    medaille: 'bronze',
    medailleLabel: 'Médaille de bronze 🥉',
    medailleEmoji: '🥉',
    photoUrl: '/brand/athlete-3.webp',
    scorePerf: 'Demi-finaliste JOJ',
    record: '⭐ Record de précision : 48 touches nettes réussies sur l’ensemble du tournoi.',
    resumeSimple: 'Yevanhelina Petruk monte sur le podium avec le bronze pour l’Ukraine. Sa rapidité exceptionnelle et sa technique ont enthousiasmé le public dakarois.',
    phrasesVocales: [
      'Yevanhelina Petruk, représentante de l’Ukraine en boxe 50 kg.',
      'Elle gagne la médaille de bronze aux Jeux Olympiques de la Jeunesse de Dakar.',
      'Elle détient le record de précision du tournoi avec 48 touches nettes.',
    ],
  },
  {
    id: 'alan-ocampo',
    nom: 'Alan Jesus Ocampo Cano',
    pays: 'Mexique',
    codePays: 'MEX',
    flagEmoji: '🇲🇽',
    sport: 'Boxe',
    epreuve: '60 kg garçons',
    medaille: 'bronze',
    medailleLabel: 'Médaille de bronze 🥉',
    medailleEmoji: '🥉',
    photoUrl: '/brand/athlete-4.webp',
    scorePerf: 'Demi-finaliste JOJ',
    record: '⭐ Record de précocité : À 16 ans, plus jeune médaillé olympique mexicain de boxe des JOJ.',
    resumeSimple: 'Alan Jesus Ocampo Cano décroche le bronze en 60 kg. Son courage et sa détermination font de lui le plus jeune médaillé de l’histoire de la boxe mexicaine aux JOJ.',
    phrasesVocales: [
      'Alan Jesus Ocampo Cano, médaillé pour le Mexique en boxe 60 kg.',
      'Il a remporté la médaille de bronze aux JOJ Dakar 2026.',
      'Record de précocité : à seulement 16 ans, il est le plus jeune boxeur mexicain médaillé aux Jeux de la Jeunesse.',
    ],
  },
];

export interface JourCompetition {
  id: string; // '2026-11-12'
  dateCourte: string; // '12 nov'
  libelle: string; // 'Jeudi 12 novembre'
  jourNum: number; // 12
  tag?: string; // "Aujourd'hui", "Hier", "Cérémonie d'ouverture", "Clôture"
  or: number;
  arg: number;
  bro: number;
  tot: number;
}

export const JOURS_COMPETITION: JourCompetition[] = [
  { id: '2026-10-31', dateCourte: '31 oct', libelle: 'Samedi 31 octobre', jourNum: 31, tag: "Cérémonie d'ouverture", or: 0, arg: 0, bro: 0, tot: 0 },
  { id: '2026-11-01', dateCourte: '1 nov', libelle: 'Dimanche 1 novembre', jourNum: 1, tag: 'Jour 1', or: 4, arg: 4, bro: 4, tot: 12 },
  { id: '2026-11-02', dateCourte: '2 nov', libelle: 'Lundi 2 novembre', jourNum: 2, tag: 'Jour 2', or: 6, arg: 6, bro: 7, tot: 19 },
  { id: '2026-11-03', dateCourte: '3 nov', libelle: 'Mardi 3 novembre', jourNum: 3, tag: 'Jour 3', or: 7, arg: 7, bro: 8, tot: 22 },
  { id: '2026-11-04', dateCourte: '4 nov', libelle: 'Mercredi 4 novembre', jourNum: 4, tag: 'Jour 4', or: 8, arg: 8, bro: 9, tot: 25 },
  { id: '2026-11-05', dateCourte: '5 nov', libelle: 'Jeudi 5 novembre', jourNum: 5, tag: 'Jour 5', or: 5, arg: 5, bro: 6, tot: 16 },
  { id: '2026-11-06', dateCourte: '6 nov', libelle: 'Vendredi 6 novembre', jourNum: 6, tag: 'Jour 6', or: 9, arg: 9, bro: 10, tot: 28 },
  { id: '2026-11-07', dateCourte: '7 nov', libelle: 'Samedi 7 novembre', jourNum: 7, tag: 'Jour 7', or: 11, arg: 11, bro: 12, tot: 34 },
  { id: '2026-11-08', dateCourte: '8 nov', libelle: 'Dimanche 8 novembre', jourNum: 8, tag: 'Jour 8', or: 10, arg: 10, bro: 11, tot: 31 },
  { id: '2026-11-09', dateCourte: '9 nov', libelle: 'Lundi 9 novembre', jourNum: 9, tag: 'Jour 9', or: 7, arg: 7, bro: 8, tot: 22 },
  { id: '2026-11-10', dateCourte: '10 nov', libelle: 'Mardi 10 novembre', jourNum: 10, tag: 'Jour 10', or: 8, arg: 8, bro: 9, tot: 25 },
  { id: '2026-11-11', dateCourte: '11 nov', libelle: 'Mercredi 11 novembre', jourNum: 11, tag: 'Hier · J-1', or: 6, arg: 6, bro: 7, tot: 19 },
  { id: '2026-11-12', dateCourte: '12 nov', libelle: 'Jeudi 12 novembre', jourNum: 12, tag: "Aujourd'hui", or: 5, arg: 3, bro: 2, tot: 10 },
  { id: '2026-11-13', dateCourte: '13 nov', libelle: 'Vendredi 13 novembre', jourNum: 13, tag: 'Clôture', or: 8, arg: 8, bro: 8, tot: 24 },
];

export interface SiteOptionInfo {
  id: string;
  nom: string;
  icone: string;
  lieux: string;
}

export const SITES_OFFICIELS: SiteOptionInfo[] = [
  { id: ALL_SITES, nom: 'Tous les sites', icone: '📍', lieux: 'Toutes les zones et infrastructures de compétition' },
  { id: 'Dakar', nom: 'Dakar', icone: '🏙️', lieux: 'Stade Iba Mar Diop, Piscine Olympique, Corniche...' },
  { id: 'Diamniadio', nom: 'Diamniadio', icone: '🏟️', lieux: 'Dakar Arena, Stade Abdoulaye Wade, Centre expo...' },
  { id: 'Saly', nom: 'Saly', icone: '🏖️', lieux: 'Plage de Saly, sports nautiques & de plage...' },
];

interface DaySummaryProps {
  onOpenAssistant?: () => void;
  onGoProgramme?: () => void;
  onOpenEvent?: (id: string) => void;
  site?: string;
  dateLibelle?: string;
  onSiteChange?: (site: string) => void;
  onDateChange?: (dateIso: string, libelle: string) => void;
}

/**
 * Résumé du jour officiel (maquette JOJ Dakar 2026) :
 * 1. Filtres Date & Site (interactifs avec popovers complets)
 * 2. Carte Résumé du jour (4 médailles)
 * 3. Carte Nos champions du jour (clic ouvrant la fiche complète avec palmarès, record et voix)
 * 4. Carte Épreuves phares (Boxe, Escrime, Voile)
 * 5. Carte À retenir ! (brillant avec assistant vocal)
 * 6. Section déroulante avec le texte officiel de Claude et la synthèse vocale.
 */
export function DaySummary({
  onOpenAssistant,
  onGoProgramme,
  onOpenEvent,
  site = ALL_SITES,
  dateLibelle = 'Jeudi 12 novembre',
  onSiteChange,
  onDateChange,
}: DaySummaryProps) {
  const [etat, setEtat] = useState<'ferme' | 'chargement' | 'pret'>('ferme');
  const [resume, setResume] = useState<Resume | null>(null);
  const [erreur, setErreur] = useState<ApiError | null>(null);
  const [detailOuvert, setDetailOuvert] = useState(false);
  const [selectedChampion, setSelectedChampion] = useState<ChampionProfile | null>(null);
  const [menuOuvert, setMenuOuvert] = useState<'aucun' | 'date' | 'site'>('aucun');
  const [jourSelectionne, setJourSelectionne] = useState<string>('2026-11-12');
  const dateAnchorRef = useRef<HTMLDivElement>(null);
  const siteAnchorRef = useRef<HTMLDivElement>(null);
  const dateListRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);

  const jourCourant = JOURS_COMPETITION.find((j) => j.id === jourSelectionne) ?? JOURS_COMPETITION[12];
  const siteCourant = SITES_OFFICIELS.find((s) => s.id === site) ?? SITES_OFFICIELS[0];

  // Défile automatiquement vers l'élément sélectionné quand le menu s'ouvre
  useEffect(() => {
    if (menuOuvert === 'date' && dateListRef.current) {
      const activeEl = dateListRef.current.querySelector('.rj-dropdown-item.selected') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [menuOuvert]);

  // Ferme le menu au clic extérieur ou Échap
  useEffect(() => {
    if (menuOuvert === 'aucun') return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        !dateAnchorRef.current?.contains(target) &&
        !siteAnchorRef.current?.contains(target)
      ) {
        setMenuOuvert('aucun');
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOuvert('aucun');
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOuvert]);

  const choisirDate = (j: JourCompetition) => {
    setJourSelectionne(j.id);
    setMenuOuvert('aucun');
    if (onDateChange) {
      onDateChange(j.id, j.libelle);
    }
  };

  const choisirSite = (siteId: string) => {
    setMenuOuvert('aucun');
    if (onSiteChange) {
      onSiteChange(siteId);
    }
  };

  // Garantit que la fiche s'ouvre toujours tout en haut et arrête la voix à la fermeture
  useEffect(() => {
    if (selectedChampion) {
      setDragY(0);
      setIsDragging(false);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } else {
      arreterLecture();
    }
  }, [selectedChampion]);

  // Geste tactile de glissement vers le bas (Swipe-down to dismiss)
  const onTouchStart = (e: React.TouchEvent) => {
    const el = scrollRef.current;
    if (el && el.scrollTop > 0) return;
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    } else {
      setDragY(deltaY * 0.15);
    }
  };

  const onTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY > 80) {
      setSelectedChampion(null);
    }
    setDragY(0);
  };

  // Ferme la modale avec Échap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedChampion(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Préchargement discret du texte officiel de Claude en tâche de fond pour le jour sélectionné
  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        let r: Resume | ApiError = PAS_ENCORE;
        for (const jour of joursAEssayer(jourSelectionne)) {
          r = await lireResume(jour);
          if (!estErreur(r) || r.code !== 'AUCUN_PODIUM') break;
        }
        if (!actif) return;
        if (estErreur(r)) setErreur(r.code === 'AUCUN_PODIUM' ? PAS_ENCORE : r);
        else setResume(r);
      } catch {
        if (actif) setErreur(ERREUR_RESEAU);
      }
    })();
    return () => { actif = false; };
  }, [jourSelectionne]);

  const basculerDetail = () => {
    if (detailOuvert) {
      arreterLecture(LECTURE);
      setDetailOuvert(false);
    } else {
      setDetailOuvert(true);
      if (!resume && etat === 'ferme') {
        setEtat('chargement');
      }
    }
  };

  return (
    <div className="rj-root">
      {/* 1. Rangée de filtres interactifs : Date & Site */}
      <div className="rj-filters" role="toolbar" aria-label="Filtres par date et par site">
        {/* Filtre Date */}
        <div className="rj-filter-anchor" ref={dateAnchorRef}>
          <button
            type="button"
            className={`rj-filter-pill ${menuOuvert === 'date' ? 'active' : ''}`}
            onClick={() => setMenuOuvert(menuOuvert === 'date' ? 'aucun' : 'date')}
            aria-expanded={menuOuvert === 'date'}
            aria-haspopup="listbox"
            aria-label={`Filtrer par date. Actuellement : ${jourCourant.libelle}`}
          >
            <CalendarDays size={16} className="rj-pill-icon" aria-hidden="true" />
            <span className="rj-pill-label">{jourCourant.libelle}</span>
            <ChevronDown size={14} className="rj-pill-arrow" aria-hidden="true" />
          </button>

          {menuOuvert === 'date' && (
            <div className="rj-dropdown-menu rj-date-menu" role="listbox" aria-label="Choisir une date de compétition">
              <div className="rj-dropdown-header">
                <strong>Calendrier des Jeux</strong>
                <span>Dakar 2026 · 31 oct au 13 nov</span>
              </div>
              <div className="rj-dropdown-list" ref={dateListRef}>
                {JOURS_COMPETITION.map((j) => {
                  const estActif = j.id === jourSelectionne;
                  return (
                    <button
                      key={j.id}
                      type="button"
                      role="option"
                      aria-selected={estActif}
                      className={`rj-dropdown-item ${estActif ? 'selected' : ''}`}
                      onClick={() => choisirDate(j)}
                    >
                      <div className="rj-date-badge" aria-hidden="true">
                        <span className="rj-date-num">{j.jourNum}</span>
                        <span className="rj-date-mo">nov</span>
                      </div>
                      <div className="rj-dropdown-item-info">
                        <div className="rj-dropdown-item-title">
                          <strong>{j.libelle}</strong>
                          {j.tag && (
                            <span className={`rj-date-tag ${j.tag.includes('Aujourd') ? 'today' : ''}`}>
                              {j.tag}
                            </span>
                          )}
                        </div>
                        <small className="rj-dropdown-item-sub">
                          {j.tot > 0 ? `${j.tot} médailles décernées` : "Cérémonie d'ouverture"}
                        </small>
                      </div>
                      {estActif && <Check size={16} className="rj-check-icon" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Filtre Site */}
        <div className="rj-filter-anchor" ref={siteAnchorRef}>
          <button
            type="button"
            className={`rj-filter-pill ${menuOuvert === 'site' ? 'active' : ''}`}
            onClick={() => setMenuOuvert(menuOuvert === 'site' ? 'aucun' : 'site')}
            aria-expanded={menuOuvert === 'site'}
            aria-haspopup="listbox"
            aria-label={`Filtrer par site. Actuellement : ${siteCourant.nom}`}
          >
            <span className="rj-pin-icon" aria-hidden="true">{siteCourant.icone}</span>
            <span className="rj-pill-label">{siteCourant.nom}</span>
            <ChevronDown size={14} className="rj-pill-arrow" aria-hidden="true" />
          </button>

          {menuOuvert === 'site' && (
            <div className="rj-dropdown-menu rj-site-menu" role="listbox" aria-label="Choisir un site de compétition">
              <div className="rj-dropdown-header">
                <strong>Sites de compétition</strong>
                <span>Lieux officiels des JOJ Dakar 2026</span>
              </div>
              <div className="rj-dropdown-list">
                {SITES_OFFICIELS.map((s) => {
                  const estActif = s.id === site;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="option"
                      aria-selected={estActif}
                      className={`rj-dropdown-item ${estActif ? 'selected' : ''}`}
                      onClick={() => choisirSite(s.id)}
                    >
                      <span className="rj-site-emoji" aria-hidden="true">{s.icone}</span>
                      <div className="rj-dropdown-item-info">
                        <div className="rj-dropdown-item-title">
                          <strong>{s.nom}</strong>
                        </div>
                        <small className="rj-dropdown-item-sub">{s.lieux}</small>
                      </div>
                      {estActif && <Check size={16} className="rj-check-icon" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Carte Résumé du jour */}
      <section className="rj-card rj-card-resume" aria-labelledby="rj-resume-title">
        <div className="rj-resume-header">
          <div className="rj-resume-trophy" aria-hidden="true">
            <Trophy size={36} />
          </div>
          <div className="rj-resume-titles">
            <h2 id="rj-resume-title">Résumé du jour</h2>
            <p>
              Les temps forts des JOJ Dakar 2026
              {site !== ALL_SITES ? ` · ${site}` : ''}
            </p>
          </div>
          <div className="rj-gold-swoosh" aria-hidden="true" />
        </div>

        <div className="rj-stats-grid">
          <div className="rj-stat-box">
            <div className="rj-stat-icon gold" aria-hidden="true">🥇</div>
            <div className="rj-stat-val">{jourCourant.or}</div>
            <div className="rj-stat-lbl">Médailles d'or</div>
          </div>
          <div className="rj-stat-box">
            <div className="rj-stat-icon silver" aria-hidden="true">🥈</div>
            <div className="rj-stat-val">{jourCourant.arg}</div>
            <div className="rj-stat-lbl">Médailles d'argent</div>
          </div>
          <div className="rj-stat-box">
            <div className="rj-stat-icon bronze" aria-hidden="true">🥉</div>
            <div className="rj-stat-val">{jourCourant.bro}</div>
            <div className="rj-stat-lbl">Médailles de bronze</div>
          </div>
          <div className="rj-stat-box">
            <div className="rj-stat-icon trophy" aria-hidden="true">🏆</div>
            <div className="rj-stat-val">{jourCourant.tot}</div>
            <div className="rj-stat-lbl">Total médailles</div>
          </div>
        </div>
      </section>

      {/* 3. Carte Nos champions du jour (cliquable pour afficher le profil détaillé) */}
      <section className="rj-card rj-card-champions" aria-labelledby="rj-champions-title">
        <div className="rj-card-head">
          <div className="rj-card-title-group">
            <span className="rj-head-icon" aria-hidden="true">🏃</span>
            <h3 id="rj-champions-title">Nos champions du jour</h3>
          </div>
          <button type="button" className="rj-head-action-btn" onClick={onGoProgramme}>
            Voir tous →
          </button>
        </div>

        <div className="rj-champions-scroll">
          {CHAMPIONS_DU_JOUR.map((c) => (
            <button
              key={c.id}
              type="button"
              className="rj-champion-item"
              onClick={() => setSelectedChampion(c)}
              aria-label={`Voir le profil et les records de ${c.nom}`}
              title="Cliquez pour voir ce qu'il a gagné et ses records"
            >
              <div className="rj-champ-avatar-wrap">
                <AvatarAthlete
                  src={c.photoVraie || c.photoUrl}
                  alt={c.nom}
                  className="rj-champ-avatar"
                  fallbackInitials={c.nom.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                />
                <span className="rj-champ-avatar-flag" aria-hidden="true" title={c.pays}>
                  <Flag c={c.codePays} />
                  <span className="rj-champ-flag-fallback">{c.flagEmoji}</span>
                </span>
              </div>
              <strong className="rj-champ-name">{c.nom}</strong>
              <span className="rj-champ-country">({c.pays})</span>
              <span className="rj-champ-sport">{c.sport} - {c.epreuve.replace(' filles', '').replace(' garçons', '')}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 4. Carte Épreuves phares */}
      <section className="rj-card rj-card-epreuves" aria-labelledby="rj-epreuves-title">
        <div className="rj-card-head">
          <div className="rj-card-title-group">
            <span className="rj-head-icon" aria-hidden="true">🥇</span>
            <h3 id="rj-epreuves-title">Épreuves phares</h3>
          </div>
          <button type="button" className="rj-head-action-btn" onClick={onGoProgramme}>
            Programme →
          </button>
        </div>

        <div className="rj-epreuves-list">
          <button type="button" className="rj-epreuve-row" onClick={() => onOpenEvent?.('boxing-m-60-kg')}>
            <div className="rj-sport-badge red" aria-hidden="true">
              🥊
            </div>
            <div className="rj-epreuve-info">
              <strong>Boxe : 50 kg / 57 kg / 60 kg / 70 kg</strong>
            </div>
            <span className="rj-status-badge live">● En cours</span>
            <ChevronRight size={18} className="rj-chevron" aria-hidden="true" />
          </button>

          <button type="button" className="rj-epreuve-row" onClick={() => onOpenEvent?.('fencing-w-sabre')}>
            <div className="rj-sport-badge blue" aria-hidden="true">
              🤺
            </div>
            <div className="rj-epreuve-info">
              <strong>Escrime : Sabre individuel filles (finale)</strong>
            </div>
            <span className="rj-status-badge next">● À suivre</span>
            <ChevronRight size={18} className="rj-chevron" aria-hidden="true" />
          </button>

          <button type="button" className="rj-epreuve-row" onClick={() => onOpenEvent?.('sailing-windsurfing')}>
            <div className="rj-sport-badge green" aria-hidden="true">
              ⛵
            </div>
            <div className="rj-epreuve-info">
              <strong>Voile : Windsurfing Opening Series</strong>
            </div>
            <span className="rj-status-badge done">✔ Terminé</span>
            <ChevronRight size={18} className="rj-chevron" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* 5. Carte À retenir ! */}
      <section className="rj-card rj-card-retenir" aria-labelledby="rj-retenir-title">
        <div className="rj-retenir-monument-wrap" aria-hidden="true">
          <img src="/brand/monument.webp" alt="" className="rj-retenir-monument" />
        </div>
        <div className="rj-retenir-content">
          <div className="rj-retenir-text-col">
            <div className="rj-retenir-title-row">
              <span className="rj-lightbulb" aria-hidden="true">💡</span>
              <h4 id="rj-retenir-title">À retenir !</h4>
            </div>
            <p>Le Sénégal brille aux JOJ Dakar 2026 avec de belles performances !</p>
          </div>

          <button type="button" className="rj-assistant-btn" onClick={onOpenAssistant}>
            <span className="rj-asst-mic-circle">
              <Mic size={16} aria-hidden="true" />
            </span>
            <span>Posez votre question à notre assistant vocal</span>
          </button>
        </div>
      </section>

      {/* 6. Section déroulante du rapport complet des journalistes rédigé par Claude */}
      <div className="rj-claude-accordion">
        <button type="button" className="rj-claude-toggle" onClick={basculerDetail} aria-expanded={detailOuvert}>
          <span className="rj-claude-badge">✦ Rédigé par Claude</span>
          <span>{detailOuvert ? 'Masquer le rapport complet des journalistes' : 'Consulter le rapport officiel complet des journalistes'}</span>
          <ChevronDown size={16} className={`rj-claude-chev ${detailOuvert ? 'open' : ''}`} aria-hidden="true" />
        </button>

        {detailOuvert && (
          <div className="rj-claude-body">
            {erreur && <div className="ev"><ErrBox e={erreur} /></div>}
            {resume ? (
              <>
                <div className="ev">
                  <strong>{resume.titre}</strong>
                  <small>{libelleJour(resume.jour)}</small>
                </div>
                {lectureDisponible && (
                  <div className="ev ev-ecouter">
                    <BoutonEcouter id={LECTURE} phrases={texteDuResume(resume)} nom="Écouter le résumé du jour" />
                  </div>
                )}
                {resume.paragraphes.map((p, i) => (
                  <div key={i} className="ev"><span>{p}</span></div>
                ))}
                {resume.epreuves.map((e) => (
                  <div key={e.id} className="ev">
                    <strong>{e.disc} · {e.event}</strong>
                    <small>{e.podium.map(medailleLisible).join(' · ')}</small>
                  </div>
                ))}
                <div className="ev">
                  <small>Rédigé par Claude à partir des résultats officiels de Dakar 2026. À vérifier avant publication.</small>
                </div>
              </>
            ) : (
              !erreur && <div className="ev"><small>Claude prépare la synthèse officielle des finales du jour…</small></div>
            )}
          </div>
        )}
      </div>

      {/* 7. Modal / Fiche détaillée du Champion lorsqu'on clique sur un profil */}
      {selectedChampion && typeof document !== 'undefined' && createPortal(
        <div
          className="rj-modal-backdrop"
          onClick={() => setSelectedChampion(null)}
          role="presentation"
        >
          <div
            className={`rj-modal-card ${isDragging ? 'is-dragging' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              transform: dragY !== 0 ? `translate3d(0, ${Math.max(0, dragY)}px, 0)` : undefined,
              transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-champ-name"
          >
            {/* Header supérieur fixe : Toujours 100% visible, jamais tronqué ni masqué */}
            <div className="rj-modal-top">
              <div className="sheet-grabber-area" aria-hidden="true">
                <div className="sheet-grabber" />
              </div>
              <button
                type="button"
                className="sheet-x-btn"
                onClick={() => setSelectedChampion(null)}
                aria-label="Fermer la fiche champion"
              >
                <X size={18} aria-hidden="true" />
              </button>

              <div className="rj-modal-header">
                <div className="rj-modal-avatar-box">
                  <AvatarAthlete
                    src={selectedChampion.photoVraie || selectedChampion.photoUrl}
                    alt={selectedChampion.nom}
                    className="rj-modal-avatar"
                    fallbackInitials={selectedChampion.nom.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                  />
                  <span className="rj-modal-avatar-flag" aria-hidden="true" title={selectedChampion.pays}>
                    <Flag c={selectedChampion.codePays} />
                    <span className="rj-modal-flag-fallback">{selectedChampion.flagEmoji}</span>
                  </span>
                </div>
                <div className="rj-modal-title-group">
                  <div className={`rj-modal-badge-medaille ${selectedChampion.medaille}`}>
                    <span>{selectedChampion.medailleEmoji}</span>
                    <strong>{selectedChampion.medailleLabel}</strong>
                  </div>
                  <h3 id="modal-champ-name">{selectedChampion.nom}</h3>
                  <p className="rj-modal-sub">
                    {selectedChampion.pays} ({selectedChampion.codePays}) · {selectedChampion.sport} ({selectedChampion.epreuve})
                  </p>
                </div>
              </div>
            </div>

            {/* Corps défilable : Scroll fluide avec cartes bien séparées et lisibles */}
            <div ref={scrollRef} className="rj-modal-scroll">
              {/* Titre & Palmarès remporté */}
              <div className="rj-modal-section rj-modal-section-win">
                <div className="rj-modal-sec-icon" aria-hidden="true">🏆</div>
                <div className="rj-modal-sec-text">
                  <strong>Ce qu'il a gagné</strong>
                  <p className="rj-modal-win-title">{selectedChampion.medailleLabel} · JOJ Dakar 2026</p>
                  <span className="rj-modal-score">{selectedChampion.scorePerf}</span>
                </div>
              </div>

              {/* Record officiel des JOJ */}
              <div className="rj-modal-section rj-modal-section-record">
                <div className="rj-modal-sec-icon" aria-hidden="true">⚡</div>
                <div className="rj-modal-sec-text">
                  <strong>Record officiel & Performance</strong>
                  <p className="rj-modal-record-text">{selectedChampion.record}</p>
                </div>
              </div>

              {/* En résumé simple */}
              <div className="rj-modal-section rj-modal-section-summary">
                <div className="rj-modal-sec-icon" aria-hidden="true">📖</div>
                <div className="rj-modal-sec-text">
                  <strong>Résumé simple</strong>
                  <p>{selectedChampion.resumeSimple}</p>
                </div>
              </div>

              {/* Lecteur vocal : « Il nous dit le résumé » */}
              <div className="rj-modal-voice-box">
                <div className="rj-modal-voice-head">
                  <span className="rj-modal-voice-head-icon" aria-hidden="true">🎙️</span>
                  <div>
                    <strong>Écouter le résumé à voix haute</strong>
                    <small>Synthèse vocale officielle Dakar 2026</small>
                  </div>
                </div>
                <BarreVocale
                  id={`champion-${selectedChampion.id}`}
                  phrases={selectedChampion.phrasesVocales}
                  nom={`Écouter le résumé de ${selectedChampion.nom}`}
                />
              </div>
            </div>

            {/* Bas fixe en bas : bouton d'action vert comme dans la maquette */}
            <div className="rj-modal-bottom">
              <button
                type="button"
                className="rj-modal-btn-ask"
                onClick={() => {
                  setSelectedChampion(null);
                  onOpenAssistant?.();
                }}
              >
                <Mic size={18} aria-hidden="true" />
                <span>Poser une question à l'assistant sur ce champion</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
