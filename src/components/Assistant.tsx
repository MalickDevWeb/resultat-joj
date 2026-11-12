import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Check, CheckCheck, ChevronRight, Keyboard, Mic, Send, Star, User, X } from 'lucide-react';
import { Scrim } from './Sheets';
import { ErrBox } from './ui';
import { MENTION, RIEN_ENTENDU, nettoyerDictee } from '../hooks/voix';
import { lireAVoixHaute, useDictee } from '../hooks/useVoix';
import { BarreVocale } from './Voix';

/** Un message du fil : la question du visiteur ou la réponse de l'assistant (spec 006). */
export interface Message {
  role: 'visiteur' | 'assistant';
  texte: string;
}

/** Réponse de /api/assistant. */
interface Reponse {
  reponse: string;
  horsSujet: boolean;
}

/** Ce que l'écran fait d'un envoi : afficher la réponse, ou une phrase d'erreur (et, au quota du jour, tout désactiver). */
export type Issue = { reponse: string } | { erreur: string; quota: boolean };

const QUESTION_MAX = 500;
const COMPTEUR_DES = 400;
const MESSAGE_MAX = 1000;
const ECHANGES_MAX = 6;

const VIDE = 'Écrivez votre question avant de l’envoyer.';
const TROP_LONGUE = `Votre question dépasse ${QUESTION_MAX} caractères. Raccourcissez-la.`;
const ILLISIBLE = 'La réponse de l’assistant n’a pas pu être lue. Réessayez.';
const TROP_DE_QUESTIONS = 'Vous avez posé beaucoup de questions. Réessayez dans quelques minutes.';
const QUOTA_DU_JOUR = 'L’assistant a répondu à toutes les questions possibles aujourd’hui. Revenez demain.';
const INDISPONIBLE = 'L’assistant n’est pas disponible pour le moment. Réessayez dans un instant.';
const NON_ENVOYEE = 'Cette question n’a pas pu être envoyée. Commencez une nouvelle conversation, puis réessayez.';
export const RESEAU = 'Impossible de joindre l’assistant. Vérifiez votre connexion, puis réessayez.';
const HORS_CONNEXION = 'Vous êtes hors connexion. L’assistant revient dès que le réseau revient.';

const ACCUEIL = 'Bonjour ! Posez votre question sur les JOJ Dakar 2026 : médailles, podiums, sites et dates.';
export const SUGGESTIONS = ['Combien de médailles pour le Sénégal ?', 'Où se passe la lutte de plage ?', 'Quelles finales aujourd’hui ?'];

/** Raccourcis défilants sous forme de puces (spec 006 & maquette). */
const RACCOURCIS = [
  { label: '🏆 Palmarès', question: 'Quel est le palmarès du Sénégal aux JOJ ?' },
  { label: '📅 Dates', question: 'Quelles sont les dates des épreuves aujourd’hui ?' },
  { label: '🏟️ Sites', question: 'Quels sont les sites des JOJ Dakar 2026 ?' },
  { label: '🥇 Médailles', question: 'Combien de médailles pour le Sénégal ?' },
];

/** Longueur en caractères, comme le serveur (un emoji compte pour un). */
const longueur = (texte: string) => [...texte].length;

/** Phrase d'erreur si la question ne peut pas partir, sinon null. Les espaces autour ne comptent pas. */
export function verifierQuestion(texte: string): string | null {
  const n = longueur(texte.trim());
  if (n === 0) return VIDE;
  return n > QUESTION_MAX ? TROP_LONGUE : null;
}

/**
 * Question dictée, prête à relire : première lettre en majuscule, « ? » à la fin, au plus 500 caractères.
 * Null si rien n'a été dit.
 */
export function questionDictee(dicte: string): string | null {
  const texte = nettoyerDictee(dicte);
  if (!texte) return null;
  const [premiere = '', ...suite] = [...texte];
  const phrase = premiere.toLocaleUpperCase('fr-FR') + suite.join('');
  const question = phrase.endsWith('?') ? phrase : `${phrase} ?`;
  return [...question].slice(0, QUESTION_MAX).join('');
}

/** « 432 / 500 » au-delà de 400 caractères, sinon rien. */
export function compteur(texte: string): string | null {
  const n = longueur(texte.trim());
  return n > COMPTEUR_DES ? `${n} / ${QUESTION_MAX}` : null;
}

/** Les 6 derniers échanges complets, visiteur puis assistant, chaque texte coupé à 1 000 caractères. */
export function historiqueAEnvoyer(fil: Message[]): Message[] {
  const complet = fil.length - (fil.length % 2);
  return fil
    .slice(Math.max(0, complet - 2 * ECHANGES_MAX), complet)
    .map((m) => ({ role: m.role, texte: [...m.texte].slice(0, MESSAGE_MAX).join('') }));
}

const estObjet = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

/** Vérifie la forme de la réponse plutôt que de la croire sur parole. */
export function estReponse(x: unknown): x is Reponse {
  return estObjet(x) && typeof x.reponse === 'string' && x.reponse.trim() !== '' && typeof x.horsSujet === 'boolean';
}

const PHRASE_DU_CODE: Record<string, string> = { TROP_DE_QUESTIONS, QUOTA_DU_JOUR, ASSISTANT_INDISPONIBLE: INDISPONIBLE };

/** Phrase de l'écran quand le refus du serveur n'a pas de message lisible : d'après le code, sinon le statut. */
function phraseDeSecours(statut: number, code: string): string {
  if (PHRASE_DU_CODE[code]) return PHRASE_DU_CODE[code];
  if (code) return NON_ENVOYEE;
  if (statut === 429) return TROP_DE_QUESTIONS;
  return statut >= 500 ? INDISPONIBLE : NON_ENVOYEE;
}

/** Ce que l'écran montre d'une réponse du serveur : la réponse vérifiée, ou la phrase du serveur, ou la sienne. */
export function lireIssue(statut: number, corps: unknown): Issue {
  if (statut >= 200 && statut < 300) return estReponse(corps) ? { reponse: corps.reponse } : { erreur: ILLISIBLE, quota: false };
  const code = estObjet(corps) && typeof corps.code === 'string' ? corps.code : '';
  const message = estObjet(corps) && typeof corps.message === 'string' ? corps.message.trim() : '';
  return { erreur: message || phraseDeSecours(statut, code), quota: code === 'QUOTA_DU_JOUR' };
}

/** Un paragraphe par ligne non vide. */
export const paragraphes = (texte: string) => texte.split('\n').map((l) => l.trim()).filter(Boolean);

/** D'où vient la question : on répond comme on a demandé (007-AS8). */
export type Origine = 'voix' | 'clavier';

/** Une question posée à la voix reçoit sa réponse lue à voix haute ; une question écrite, une réponse écrite. */
export const lireLaReponse = (origine: Origine) => origine === 'voix';

/** Ce que la voix lit d'une réponse : un paragraphe par phrase, sans les ** du gras ni les emojis. */
export function phrasesDeLaReponse(texte: string): string[] {
  return paragraphes(texte)
    .map((p) => p.replace(/\*\*/g, '').replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\u{FE0F}\u{200D}]/gu, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** Formate **gras** sans HTML pour la sécurité (spec 006). */
function FormaterTexte({ texte }: { texte: string }) {
  const morceaux = texte.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {morceaux.map((m, idx) => {
        if (m.startsWith('**') && m.endsWith('**') && m.length >= 4) {
          return <strong key={idx}>{m.slice(2, -2)}</strong>;
        }
        return m;
      })}
    </>
  );
}

const commenceParEmoji = (texte: string) => /^\s*[\u{1F300}-\u{1FAFF}]/u.test(texte);
const parleDeMedailles = (texte: string) => /\b(médaille|médailles|or|argent|bronze|podium)\b/i.test(texte);
const parleDuSenegal = (texte: string) => /\b(sénégal|senegal)\b/i.test(texte);

function formatHeure(d = new Date()) {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** La conversation en cours, que l'application garde ouverte même quand la fenêtre se ferme (rien n'est stocké). */
export interface Conversation {
  fil: Message[];
  enAttente: string | null;
  envoyer: (question: string) => Promise<Issue>;
  recommencer: () => void;
}

/** Une bulle du fil, comme WhatsApp : Ayo à gauche (avatar en haut), le visiteur à droite. */
function Bulle({
  m,
  lecture,
  heure,
  statutVisiteur = 'lu',
}: {
  m: Message;
  lecture?: string;
  heure: string;
  statutVisiteur?: 'envoye' | 'lu';
}) {
  const lignes = paragraphes(m.texte);

  if (m.role === 'visiteur') {
    return (
      <div className="wa-row wa-row-moi">
        <div className="wa-bubble wa-bubble-moi">
          <span className="vh">Vous : </span>
          {lignes.map((p, i) => <p key={i}><FormaterTexte texte={p} /></p>)}
          <div className="wa-bubble-meta">
            <span className="wa-time">{heure}</span>
            <span className="wa-checks" aria-hidden="true">
              {statutVisiteur === 'lu' ? <CheckCheck size={16} className="wa-check-blue" /> : <Check size={16} className="wa-check-gray" />}
            </span>
          </div>
        </div>
        <div className="wa-avatar wa-avatar-user" aria-hidden="true">
          <User size={20} fill="currentColor" />
        </div>
      </div>
    );
  }

  // La médaille et le bandeau ne concernent que les vraies réponses, pas le message d'accueil.
  const medaille = lecture !== undefined && parleDeMedailles(m.texte);
  const senegal = lecture !== undefined && parleDuSenegal(m.texte);
  return (
    <div className="wa-row wa-row-lui">
      <div className="wa-avatar wa-avatar-ayo" aria-hidden="true">
        <img src="/brand/ayo-head.webp" alt="" />
      </div>
      <div className="wa-col">
        <div className="wa-bubble wa-bubble-lui">
          <span className="vh">Assistant : </span>
          {lignes.map((p, i) => (
            <p key={i}>
              {i === 0 && medaille && !commenceParEmoji(p) && <span className="wa-medal-lead" aria-hidden="true">🏅 </span>}
              <FormaterTexte texte={p} />
            </p>
          ))}
          <div className="wa-bubble-meta">
            {senegal && <span className="wa-senegal-pill">🏆 Vive le Sénégal ! 🇸🇳</span>}
            <span className="wa-time">{heure}</span>
          </div>
        </div>
        {lecture && <BarreVocale id={lecture} phrases={phrasesDeLaReponse(m.texte)} nom="Écouter la réponse" />}
      </div>
    </div>
  );
}

/** Le réseau est-il là ? Suit les événements online / offline du navigateur. */
function useEnLigne() {
  const [enLigne, setEnLigne] = useState(() => navigator.onLine);
  useEffect(() => {
    const maj = () => setEnLigne(navigator.onLine);
    addEventListener('online', maj);
    addEventListener('offline', maj);
    return () => { removeEventListener('online', maj); removeEventListener('offline', maj); };
  }, []);
  return enLigne;
}

/** Fenêtre de l'assistant des Jeux : refonte complète conforme à la maquette WhatsApp. */
export function AssistantSheet({ conversation, onClose, questionInitiale = '' }: {
  conversation: Conversation;
  onClose: () => void;
  /** Question prête dans le champ, non envoyée (ex. depuis la fiche d'un pays, 008-AS5). */
  questionInitiale?: string;
}) {
  const { fil, enAttente, envoyer, recommencer } = conversation;
  const [question, setQuestion] = useState(questionInitiale);
  const [erreur, setErreur] = useState<string | null>(null);
  const [quota, setQuota] = useState(false);
  const enLigne = useEnLigne();
  const champ = useRef<HTMLTextAreaElement>(null);
  const filRef = useRef<HTMLDivElement>(null);
  const shortcutsRef = useRef<HTMLDivElement>(null);
  // L'heure de chaque message est notée une fois, à son arrivée, puis ne bouge plus.
  const ouverture = useRef(formatHeure());
  const heures = useRef<string[]>([]);
  if (fil.length === 0) heures.current = [];
  const heureDe = (i: number) => (heures.current[i] ??= formatHeure());

  // Chaque mot entendu fait « battre » le micro et les ondes : l'écran bouge au rythme de la voix (007-AS3).
  const [battement, setBattement] = useState(0);
  const dictee = useDictee({
    surEnCours: (entendu) => {
      setQuestion(entendu);
      setBattement((b) => b + 1);
    },
    surTexte: (dicte) => {
      const texte = questionDictee(dicte);
      if (texte === null) return setErreur(RIEN_ENTENDU);
      // La voix est une recherche directe : la question part aussitôt la phrase finie (007-AS2).
      // Hors connexion ou en attente, elle reste dans le champ, prête à partir.
      if (bloque || !enLigne) return setQuestion(texte);
      void poser(texte, 'voix');
    },
    surErreur: setErreur,
  });

  // Scroll automatique au dernier message.
  useEffect(() => {
    const el = filRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [fil.length, enAttente]);

  const poser = async (texte: string, origine: Origine = 'clavier') => {
    dictee.annuler();
    const refus = verifierQuestion(texte);
    setErreur(refus);
    if (refus) {
      setQuestion(texte);
      champ.current?.focus();
      return;
    }
    setQuestion('');
    // La réponse arrivera juste après la question : sa place dans le fil est connue d'avance.
    const placeDeLaReponse = fil.length + 1;
    const issue = await envoyer(texte.trim());
    if ('erreur' in issue) {
      setErreur(issue.erreur);
      setQuota(issue.quota);
      setQuestion(texte);
    } else if (lireLaReponse(origine)) {
      lireAVoixHaute(`reponse-${placeDeLaReponse}`, phrasesDeLaReponse(issue.reponse));
    }
    champ.current?.focus();
  };

  const bloque = enAttente !== null || quota;
  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    dictee.annuler();
    if (!bloque && enLigne) void poser(question);
  };

  const entree = (ev: KeyboardEvent<HTMLTextAreaElement>) => {
    if (ev.key === 'Enter' && !ev.shiftKey && !ev.nativeEvent.isComposing) {
      ev.preventDefault();
      submit(ev);
    }
  };

  const nouvelle = () => {
    recommencer();
    setErreur(null);
    champ.current?.focus();
  };

  const restant = compteur(question);
  const dicter = () => {
    if (!dictee.ecoute) {
      setErreur(null);
      setBattement(0);
    }
    dictee.basculer();
  };

  const scrollShortcuts = () => shortcutsRef.current?.scrollBy({ left: 160, behavior: 'smooth' });

  const aDuTexte = question.trim().length > 0;

  return (
    <Scrim label="Assistant des Jeux" className="sheet-assist" onClose={onClose}>
      {(close) => (
        <div className="wa-app-card">
          {/* 1. En-tête de nuit : stade illuminé, feux d'artifice, logo et Ayo en grand. */}
          <div className="wa-hero">
            <svg className="wa-hero-decor" viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
              <g className="wa-fireworks">
                {[[262, 26, 13], [345, 48, 15], [384, 16, 9], [228, 12, 7], [310, 14, 8]].map(([x, y, r], k) => (
                  <g key={k} transform={`translate(${x} ${y})`}>
                    {Array.from({ length: 12 }, (_, j) => (
                      <line key={j} x1="0" y1={r * 0.35} x2="0" y2={r} transform={`rotate(${j * 30})`} />
                    ))}
                  </g>
                ))}
              </g>
              <g className="wa-stadium">
                <ellipse cx="300" cy="150" rx="150" ry="34" className="wa-stadium-bowl" />
                <path d="M150 150 Q 300 92 450 150" className="wa-stadium-roof" />
                <path d="M162 140 Q 300 100 438 140" className="wa-stadium-lights" />
                <path d="M176 130 Q 300 108 424 130" className="wa-stadium-lights" />
                <ellipse cx="300" cy="156" rx="118" ry="20" className="wa-stadium-glow" />
              </g>
            </svg>

            <div className="wa-brand">
              <svg viewBox="0 0 48 44" className="wa-emblem" aria-hidden="true">
                <circle cx="10" cy="8" r="5" fill="#00a651" />
                <path d="M3 22c4-6 8-8 12-6s3 12 5 26" stroke="#00a651" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <circle cx="24" cy="6" r="5.5" fill="#fdef42" />
                <path d="M15 20c4-4 8-5 12-1s0 13-3 23" stroke="#fdef42" strokeWidth="5" strokeLinecap="round" fill="none" />
                <circle cx="39" cy="8" r="5" fill="#e31b23" />
                <path d="M45 22c-4-6-8-8-12-6s-5 12-9 26" stroke="#e31b23" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              </svg>
              <div className="wa-brand-text">
                <b className="wa-brand-title">DAKAR<br />2026</b>
                <span className="wa-brand-sub">Jeux Olympiques<br />de la Jeunesse</span>
              </div>
            </div>

            <div className="wa-hero-ayo" aria-hidden="true">
              <img src="/brand/ayo.webp" alt="" />
            </div>
          </div>

          <button type="button" className="wa-close-btn" onClick={close} aria-label="Fermer">
            <X size={22} strokeWidth={2.6} aria-hidden="true" />
          </button>

          {/* 2. Carte blanche qui chevauche l'en-tête, avec le ruban tricolore en haut à droite. */}
          <div className="wa-chat-header">
            <svg className="wa-card-ribbon" viewBox="0 0 220 120" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0,4 C70,6 120,40 220,64 L220,82 C120,58 70,26 0,22 Z" fill="#00853f" />
              <path d="M0,22 C70,26 120,58 220,82 L220,98 C120,76 70,44 0,38 Z" fill="#fdef42" />
              <path d="M0,38 C70,44 120,76 220,98 L220,120 C120,96 70,62 0,56 Z" fill="#e31b23" />
            </svg>
            <div className="wa-profile">
              <div className="wa-avatar-ring">
                <img src="/brand/ayo-head.webp" alt="" className="wa-profile-avatar" />
                <span className="wa-online-pill" aria-hidden="true" />
              </div>
              <div className="wa-profile-meta">
                <div className="wa-name-row">
                  <h3>Assistant des Jeux</h3>
                  <span className="wa-verified" title="Répond à partir des données officielles de l’application"
                    role="img" aria-label="Répond à partir des données officielles de l’application">
                    <Check size={12} strokeWidth={3.5} aria-hidden="true" />
                  </span>
                </div>
                <p className="wa-status-text">
                  {enAttente !== null
                    ? <span className="wa-typing">écrit…</span>
                    : <><span className="wa-sparkle" aria-hidden="true">✦</span> Rédigé par Claude</>}
                </p>
              </div>
            </div>
            <button type="button" className="wa-btn-restart" disabled={enAttente !== null} onClick={nouvelle}>
              <span className="wa-restart-star" aria-hidden="true"><Star size={12} fill="currentColor" stroke="none" /></span>
              <span>Nouvelle conversation</span>
            </button>
          </div>

          {/* 3. Le fil, sur fond clair au motif discret. */}
          <div className="wa-fil" ref={filRef} role="log" aria-label="Conversation" aria-busy={enAttente !== null}>
            <p className="wa-notice">Réponses rédigées par Claude à partir des données officielles de l’application. Elles peuvent contenir des erreurs.</p>
            <Bulle m={{ role: 'assistant', texte: ACCUEIL }} heure={ouverture.current} />

            {!enLigne && <ErrBox e={{ status: 0, code: 'HORS_CONNEXION', msg: HORS_CONNEXION }} />}

            {fil.map((m, i) => (
              <Bulle key={i} m={m} heure={heureDe(i)}
                lecture={m.role === 'assistant' ? `reponse-${i}` : undefined}
                statutVisiteur={i < fil.length - 1 || enAttente === null ? 'lu' : 'envoye'} />
            ))}

            {enAttente !== null && (
              <>
                <Bulle m={{ role: 'visiteur', texte: enAttente }} heure={heureDe(fil.length)} statutVisiteur="envoye" />
                <div className="wa-row wa-row-lui" role="status">
                  <div className="wa-avatar wa-avatar-ayo" aria-hidden="true">
                    <img src="/brand/ayo-head.webp" alt="" />
                  </div>
                  <div className="wa-bubble wa-bubble-lui wa-bubble-thinking">
                    <p>L’assistant cherche dans les résultats officiels…<span className="assist-points" aria-hidden="true"><i /><i /><i /></span></p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 4. Le bas : raccourcis, infobulle, saisie. */}
          <div className="wa-bottom">
            <div className="wa-shortcuts-container">
              <div className="wa-shortcuts" ref={shortcutsRef}>
                {RACCOURCIS.map((r) => (
                  <button key={r.label} type="button" className="wa-chip" disabled={bloque || !enLigne} onClick={() => void poser(r.question)}>
                    {r.label}
                  </button>
                ))}
              </div>
              <button type="button" className="wa-chip-arrow" aria-label="Voir d’autres raccourcis" onClick={scrollShortcuts}>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>

            {erreur && <ErrBox e={{ status: 0, code: 'ASSISTANT', msg: erreur }} />}
            {dictee.mention && <p className="wa-meta-note">{MENTION}</p>}

            <div className="wa-tip-row">
              {dictee.ecoute
                ? (
                  <span className="wa-mic-tooltip wa-listening" role="status">
                    <Mic size={14} aria-hidden="true" />J’écoute…
                    <span className="wa-ondes" key={battement} aria-hidden="true"><i /><i /><i /><i /><i /></span>
                  </span>
                )
                : !aDuTexte && dictee.disponible && <span className="wa-mic-tooltip" aria-hidden="true"><Mic size={14} />Appuyez pour parler</span>}
            </div>

            <form className="wa-input-row" noValidate onSubmit={submit}>
              <button type="button" className="wa-kbd-btn" aria-label="Écrire au clavier" onClick={() => champ.current?.focus()}>
                <Keyboard size={22} aria-hidden="true" />
              </button>
              <div className="wa-input-capsule">
                <label className="vh" htmlFor="assist-question">Votre question</label>
                <textarea id="assist-question" ref={champ} rows={1} autoFocus value={question} disabled={quota}
                  placeholder={dictee.ecoute ? 'Parlez, je vous écoute…' : 'Écrivez votre message…'}
                  aria-describedby={restant ? 'assist-compteur' : undefined}
                  onChange={(e) => setQuestion(e.target.value)} onKeyDown={entree} />
              </div>
              {(aDuTexte || !dictee.disponible) && !dictee.ecoute ? (
                <button className="wa-action-btn" type="submit" disabled={bloque || !enLigne} aria-label="Envoyer">
                  <Send size={24} aria-hidden="true" />
                </button>
              ) : (
                <button type="button" className={`wa-action-btn wa-mic-btn${dictee.ecoute ? ' is-listening' : ''}`}
                  disabled={bloque}
                  aria-label={dictee.ecoute ? 'Arrêter la dictée' : 'Dicter votre question'} onClick={dicter}>
                  <span className="wa-pulse-ring" aria-hidden="true" />
                  <span className="wa-pulse-ring ring-2" aria-hidden="true" />
                  {dictee.ecoute && battement > 0 && <span className="wa-voix-onde" key={battement} aria-hidden="true" />}
                  <Mic size={28} aria-hidden="true" />
                </button>
              )}
            </form>
            {restant && <p className="wa-compteur" id="assist-compteur">{restant}</p>}
          </div>

          {/* 5. Pied : bandes vert-jaune-rouge, silhouette de Dakar, « Dakar 2026 » manuscrit. */}
          <div className="wa-skyline-footer" aria-hidden="true">
            <svg className="wa-skyline-svg" viewBox="0 0 400 70" preserveAspectRatio="none">
              <rect width="400" height="70" fill="#00853f" />
              <path d="M0,10 C120,2 260,24 400,4 L400,16 C260,36 120,14 0,22 Z" fill="#fdef42" />
              <path d="M0,22 C120,14 260,36 400,16 L400,30 C260,50 120,28 0,36 Z" fill="#e31b23" />
            </svg>
            <svg className="wa-skyline-city" viewBox="0 0 200 48" aria-hidden="true">
              <g fill="#ffffff">
                <rect x="4" y="34" width="10" height="14" /><rect x="16" y="28" width="8" height="20" />
                <rect x="26" y="32" width="12" height="16" /><rect x="40" y="24" width="9" height="24" />
                <rect x="51" y="30" width="12" height="18" />
                <rect x="66" y="22" width="3" height="26" /><polygon points="67.5,16 65,22 70,22" />
                <path d="M70 36 Q 78 26 86 36 Z" /><rect x="70" y="36" width="16" height="12" />
                <rect x="87" y="22" width="3" height="26" /><polygon points="88.5,16 86,22 91,22" />
                <path d="M96 48 Q 110 34 126 48 Z" />
                <path d="M108 40 L 111 8 L 114 40 Z" /><circle cx="111" cy="6" r="2.4" />
                <path d="M112 16 L 119 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <rect x="130" y="30" width="10" height="18" /><rect x="142" y="26" width="8" height="22" />
                <rect x="152" y="32" width="12" height="16" /><rect x="166" y="24" width="9" height="24" />
                <rect x="177" y="34" width="14" height="14" />
              </g>
            </svg>
            <span className="wa-skyline-text">Dakar 2026</span>
          </div>
        </div>
      )}
    </Scrim>
  );
}
