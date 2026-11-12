import { useState } from 'react';
import { NOC } from '../data';
import { ErrBox, type ApiError } from './ui';

/** Réponse de /api/resume (spec 005). */
interface Resume {
  jour: string;
  titre: string;
  paragraphes: string[];
  epreuves: { id: string; disc: string; event: string; podium: Medaille[] }[];
}

/** Un médaillé du site officiel ; une équipe porte le nom anglais de son pays. */
interface Medaille {
  m: number;
  c: string;
  n: string;
  equipe?: boolean;
}

const MEDAILLE = ['', '🥇', '🥈', '🥉'];

/** « 🥇 Grenyelis Garcia (Venezuela) », ou pour une équipe « 🥇 Ukraine », en français. */
export const medailleLisible = (p: Medaille) => {
  const pays = NOC[p.c] ?? p.c;
  return `${MEDAILLE[p.m] ?? ''} ${p.equipe ? pays : `${p.n} (${pays})`}`.trim();
};
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

const estErreur = (x: Resume | ApiError): x is ApiError => 'msg' in x;

/** Résumé des médailles du jour, rédigé par Claude pour les journalistes. Chargé seulement à l'ouverture. */
export function DaySummary() {
  const [etat, setEtat] = useState<'ferme' | 'chargement' | 'pret'>('ferme');
  const [resume, setResume] = useState<Resume | null>(null);
  const [erreur, setErreur] = useState<ApiError | null>(null);

  const charger = async () => {
    if (etat !== 'ferme') return;
    setEtat('chargement');
    try {
      // Pas encore de finale aujourd'hui : on montre le résumé de la veille, toujours pendant les Jeux.
      let r: Resume | ApiError = PAS_ENCORE;
      for (const jour of joursAEssayer(jourDakar())) {
        r = await lireResume(jour);
        if (!estErreur(r) || r.code !== 'AUCUN_PODIUM') break;
      }
      if (estErreur(r)) setErreur(r.code === 'AUCUN_PODIUM' ? PAS_ENCORE : r);
      else setResume(r);
    } catch {
      setErreur(ERREUR_RESEAU);
    }
    setEtat('pret');
  };

  return (
    <div className="acc">
      <details onToggle={(e) => e.currentTarget.open && charger()}>
        <summary>
          <span className="ico picto t-y" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM9 9h6M9 13h6M9 17h3" /></svg>
          </span>
          <span className="sum">
            <b>Résumé du jour pour les journalistes</b>
            <span className="badge b-next">Rédigé par Claude</span>
          </span>
          <span />
          <svg className="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
        </summary>

        {etat === 'chargement' && <div className="ev"><small>Claude rédige le résumé des finales officielles…</small></div>}
        {erreur && <div className="ev"><ErrBox e={erreur} /></div>}
        {resume && (
          <>
            <div className="ev">
              <strong>{resume.titre}</strong>
              <small>{libelleJour(resume.jour)}</small>
            </div>
            {resume.paragraphes.map((p, i) => <div key={i} className="ev"><span>{p}</span></div>)}
            {resume.epreuves.map((e) => (
              <div key={e.id} className="ev">
                <strong>{e.disc} · {e.event}</strong>
                <small>{e.podium.map(medailleLisible).join(' · ')}</small>
              </div>
            ))}
            <div className="ev"><small>Rédigé par Claude à partir des résultats officiels de Dakar 2026. À vérifier avant publication.</small></div>
          </>
        )}
      </details>
    </div>
  );
}
