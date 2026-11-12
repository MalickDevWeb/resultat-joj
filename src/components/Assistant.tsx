import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Scrim } from './Sheets';
import { ErrBox } from './ui';

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
const SUGGESTIONS = ['Combien de médailles pour le Sénégal ?', 'Où se passe la lutte de plage ?', 'Quelles finales aujourd’hui ?'];

/** Longueur en caractères, comme le serveur (un emoji compte pour un). */
const longueur = (texte: string) => [...texte].length;

/** Phrase d'erreur si la question ne peut pas partir, sinon null. Les espaces autour ne comptent pas. */
export function verifierQuestion(texte: string): string | null {
  const n = longueur(texte.trim());
  if (n === 0) return VIDE;
  return n > QUESTION_MAX ? TROP_LONGUE : null;
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

/** La conversation en cours, que l'application garde ouverte même quand la fenêtre se ferme (rien n'est stocké). */
export interface Conversation {
  fil: Message[];
  enAttente: string | null;
  envoyer: (question: string) => Promise<Issue>;
  recommencer: () => void;
}

function Bulle({ m }: { m: Message }) {
  const visiteur = m.role === 'visiteur';
  return (
    <div className={`assist-msg ${visiteur ? 'assist-moi' : 'assist-lui'}`}>
      <span className="vh">{visiteur ? 'Vous : ' : 'Assistant : '}</span>
      {paragraphes(m.texte).map((p, i) => <p key={i}>{p}</p>)}
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

/** Fenêtre de l'assistant des Jeux : le fil, les suggestions et le champ de question. */
export function AssistantSheet({ conversation, onClose }: { conversation: Conversation; onClose: () => void }) {
  const { fil, enAttente, envoyer, recommencer } = conversation;
  const [question, setQuestion] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [quota, setQuota] = useState(false);
  const enLigne = useEnLigne();
  const champ = useRef<HTMLTextAreaElement>(null);
  const filRef = useRef<HTMLDivElement>(null);

  // Le dernier message reste visible.
  useEffect(() => {
    const el = filRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [fil.length, enAttente]);

  const poser = async (texte: string) => {
    const refus = verifierQuestion(texte);
    setErreur(refus);
    if (refus) {
      setQuestion(texte);
      champ.current?.focus();
      return;
    }
    setQuestion('');
    const issue = await envoyer(texte.trim());
    if ('erreur' in issue) {
      setErreur(issue.erreur);
      setQuota(issue.quota);
      setQuestion(texte);
    }
    champ.current?.focus();
  };

  const bloque = enAttente !== null || quota;
  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!bloque && enLigne) void poser(question);
  };
  const entree = (ev: KeyboardEvent<HTMLTextAreaElement>) => {
    if (ev.key === 'Enter' && !ev.shiftKey && !ev.nativeEvent.isComposing) submit(ev);
  };
  const nouvelle = () => {
    recommencer();
    setErreur(null);
    champ.current?.focus();
  };
  const restant = compteur(question);

  return (
    <Scrim label="Assistant des Jeux" className="sheet-assist" onClose={onClose}>
      {(close) => (
        <>
          <div className="assist-top">
            <div className="sheet-grabber-area" aria-hidden="true">
              <div className="sheet-grabber" />
            </div>
            <div className="lhead assist-head">
              <img src="/brand/ayo-head.webp" alt="" className="assist-ayo" />
              <div>
                <h3>Assistant des Jeux</h3>
                <span className="badge b-next">Rédigé par Claude</span>
              </div>
              {fil.length > 0 && <button type="button" className="btn ghost" disabled={enAttente !== null} onClick={nouvelle}>Nouvelle conversation</button>}
            </div>
            <button type="button" className="sheet-x-btn" onClick={close} aria-label="Fermer">
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="assist-fil" ref={filRef} role="log" aria-label="Conversation" aria-busy={enAttente !== null}>
            <Bulle m={{ role: 'assistant', texte: ACCUEIL }} />
            {fil.length === 0 && enAttente === null && (enLigne ? (
              <div className="assist-sugg">
                <p className="meta">Suggestions</p>
                <div className="chips">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" disabled={bloque} onClick={() => void poser(s)}>{s}</button>
                  ))}
                </div>
              </div>
            ) : <ErrBox e={{ status: 0, code: 'HORS_CONNEXION', msg: HORS_CONNEXION }} />)}
            {fil.map((m, i) => <Bulle key={i} m={m} />)}
            {enAttente !== null && (
              <>
                <Bulle m={{ role: 'visiteur', texte: enAttente }} />
                <div className="assist-msg assist-lui" role="status">
                  <p>L’assistant cherche dans les résultats officiels…<span className="assist-points" aria-hidden="true"><i /><i /><i /></span></p>
                </div>
              </>
            )}
          </div>

          <div className="assist-bas">
            {erreur && <ErrBox e={{ status: 0, code: 'ASSISTANT', msg: erreur }} />}
            <form className="assist-form" noValidate onSubmit={submit}>
              <label className="vh" htmlFor="assist-question">Votre question</label>
              <textarea id="assist-question" ref={champ} rows={2} autoFocus value={question} disabled={quota}
                placeholder="Ex. : le Sénégal a gagné quoi en lutte ?"
                aria-describedby={restant ? 'assist-compteur' : undefined}
                onChange={(e) => setQuestion(e.target.value)} onKeyDown={entree} />
              <button className="btn" type="submit" disabled={bloque || !enLigne}>Envoyer</button>
            </form>
            {restant && <p className="meta assist-compteur" id="assist-compteur">{restant}</p>}
            <p className="meta assist-mention">
              Réponses rédigées par Claude à partir des données officielles de l’application. Elles peuvent contenir des erreurs.
            </p>
          </div>
        </>
      )}
    </Scrim>
  );
}
