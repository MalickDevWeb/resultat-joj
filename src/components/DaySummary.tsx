import { useState } from 'react';
import { NOC } from '../data';
import { ErrBox, type ApiError } from './ui';

/** Réponse de /api/resume (spec 005). */
interface Resume {
  jour: string;
  titre: string;
  paragraphes: string[];
  epreuves: { id: string; disc: string; event: string; podium: { m: number; c: string; n: string }[] }[];
}

const MEDAILLE = ['', '🥇', '🥈', '🥉'];
const ERREUR_RESEAU: ApiError = { status: 0, code: 'RESEAU', msg: 'Impossible de joindre le serveur. Vérifiez votre connexion, puis rouvrez le résumé.' };

/** AAAA-MM-JJ du jour à Dakar (UTC+0), décalé de `decalage` jours. */
const jourDakar = (decalage = 0) => new Date(Date.now() + decalage * 86_400_000).toISOString().slice(0, 10);

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
      // Pas encore de finale aujourd'hui : on montre le résumé de la veille.
      let r = await lireResume(jourDakar());
      if (estErreur(r) && r.code === 'AUCUN_PODIUM') r = await lireResume(jourDakar(-1));
      if (estErreur(r)) setErreur(r);
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
                <small>{e.podium.map((p) => `${MEDAILLE[p.m] ?? ''} ${p.n} (${NOC[p.c] ?? p.c})`).join(' · ')}</small>
              </div>
            ))}
            <div className="ev"><small>Rédigé par Claude à partir des résultats officiels de Dakar 2026. À vérifier avant publication.</small></div>
          </>
        )}
      </details>
    </div>
  );
}
