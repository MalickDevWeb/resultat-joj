import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, CalendarDays, MapPin, Medal as MedalIcon, Mic, PersonStanding, Trophy } from 'lucide-react';
import type { FicheDuPays } from '../pays';
import { Scrim } from './Sheets';
import { Flag, MiniMedal, Picto } from './ui';
import { BarreVocale } from './Voix';

const METAUX = ['Or', 'Argent', 'Bronze'];
/** Sous le nom : la devise de la maquette pour le pays hôte, sinon rien d'inventé. */
const devise = (code: string) => (code === 'SEN' ? 'Teranga, Excellence, Jeunesse' : `JOJ Dakar 2026 · ${code}`);
const initiales = (nom: string) => nom.split(/[\s/-]+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

/**
 * La fiche d'un pays (spec 008), d'après design/maquette-fiche-pays.png.
 * Elle affiche ce que `ficheDuPays` a calculé, rien de plus : aucune donnée inventée.
 */
export function FichePays({ fiche, onClose, onAsk, onVoirEpreuves, onVoirProgramme }: {
  fiche: FicheDuPays;
  /** `rendreLeFocus` est faux quand la fiche mène ailleurs (assistant, résultats, programme). */
  onClose: (rendreLeFocus: boolean) => void;
  onAsk?: (question: string) => void;
  onVoirEpreuves?: (nom: string) => void;
  onVoirProgramme?: () => void;
}) {
  const ailleurs = useRef(false);
  const [tous, setTous] = useState(false);
  const [voirSites, setVoirSites] = useState(false);
  const sitesRef = useRef<HTMLElement>(null);
  const montrerSites = () => {
    setVoirSites(true);
    requestAnimationFrame(() => sitesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };
  const rang = fiche.rang === 1 ? '1re' : `${fiche.rang}e`;
  const champions = tous ? fiche.liste : fiche.liste.slice(0, 3);
  const enMedailles = [...fiche.medailles, fiche.total];

  return (
    <Scrim label={`Fiche de ${fiche.nom}`} className="sheet-pays" onClose={() => onClose(!ailleurs.current)}>
      {(close) => {
        const aller = (suite: () => void) => () => { ailleurs.current = true; close(); suite(); };
        return (
          <div className="fp">
            <div className="fp-scroll">
              <header className="fp-hero">
                <img src="/brand/hero-banner-resume.webp" alt="" className="fp-banner" />
                <button type="button" className="fp-back" onClick={close} aria-label="Retour au tableau des médailles">
                  <ArrowLeft size={24} strokeWidth={2.6} aria-hidden="true" />
                </button>
              </header>

              <div className="fp-id">
                <div className="fp-flagpole" aria-hidden="true">
                  <span className="fp-pole" />
                  <span className="fp-cloth"><Flag c={fiche.code} /></span>
                </div>
                <div className="fp-name">
                  <h3>{fiche.nom}</h3>
                  <p className="fp-tag">{devise(fiche.code)}</p>
                  <p className="fp-rankpill">
                    <Trophy size={18} aria-hidden="true" />
                    <span><b>{rang}</b> Position{fiche.exAequo ? ' ex aequo' : ''} au classement général</span>
                  </p>
                </div>
              </div>

              <ul className="fp-cards" aria-label="Ses médailles">
                {enMedailles.map((n, k) => (
                  <li key={k} className={`fp-card fp-card${k}`}>
                    {k < 3 ? <MiniMedal k={k} /> : <MedalIcon size={30} aria-hidden="true" />}
                    <b>{n}</b>
                    <span>{k < 3 ? METAUX[k] : 'Total'}</span>
                  </li>
                ))}
              </ul>

              {fiche.sports.length > 0 && (
                <section className="fp-panel" aria-labelledby="fp-details">
                  <table className="fp-table">
                    <caption className="vh">Médailles par sport</caption>
                    <thead>
                      <tr>
                        <th scope="col" className="fp-th-sport">
                          <span className="fp-th-title" id="fp-details"><BarChart3 size={22} aria-hidden="true" /> Détails des médailles</span>
                        </th>
                        {METAUX.map((l, k) => <th key={l} scope="col"><MiniMedal k={k} ribbon={false} /><span>{l}</span></th>)}
                        <th scope="col"><Trophy size={18} aria-hidden="true" className="fp-th-cup" /><span>Total</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fiche.sports.map((s) => (
                        <tr key={s.disc}>
                          <th scope="row"><span className="fp-sport"><Picto d={s.disc} />{s.disc}</span></th>
                          <td>{s.medailles[0]}</td><td>{s.medailles[1]}</td><td>{s.medailles[2]}</td>
                          <td><span className="fp-tot">{s.total}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {fiche.nonDetaillees > 0 && <p className="fp-wait">{fiche.resume[fiche.resume.length - 1]}</p>}
                </section>
              )}

              <div className="fp-duo">
                <section className="fp-panel" aria-labelledby="fp-champions">
                  <h4 className="fp-band" id="fp-champions"><span aria-hidden="true">🏅</span> Nos champions</h4>
                  {champions.length > 0 ? (
                    <ul className="fp-champs">
                      {champions.map((x, i) => (
                        <li key={i}>
                          <span className={`fp-avatar fp-avatar${x.m}`} aria-hidden="true">{initiales(x.nom)}</span>
                          <span className="fp-champ">
                            <b>{x.nom}{x.equipe && <small> · équipe</small>}</b>
                            <span title={x.epreuve}>{x.disc}</span>
                          </span>
                          <span className="fp-champ-medal"><MiniMedal k={x.m - 1} /><span className="vh">{METAUX[x.m - 1]}</span></span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="fp-wait">Les médaillés ne sont pas encore détaillés sur Wikipédia.</p>}
                  {fiche.liste.length > 3 && (
                    <button type="button" className="fp-more" aria-expanded={tous} onClick={() => setTous(!tous)}>
                      {tous ? 'Voir moins' : `Voir tous les médaillés (${fiche.liste.length})`} <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  )}
                </section>

                <section className="fp-panel" aria-labelledby="fp-infos">
                  <h4 className="fp-band" id="fp-infos"><CalendarDays size={20} aria-hidden="true" /> Informations clés</h4>
                  <dl className="fp-keys">
                    <div><dt><CalendarDays size={18} aria-hidden="true" /> Classement actuel</dt><dd className="fp-big">{rang} <small>/ {fiche.nations}</small><span className="vh"> nations</span></dd></div>
                    <div><dt><Trophy size={18} aria-hidden="true" className="fp-gold" /> Total médailles</dt><dd>{fiche.total}</dd></div>
                    {METAUX.map((l, k) => (
                      <div key={l}><dt><MiniMedal k={k} /> {l}</dt><dd>{fiche.medailles[k]}</dd></div>
                    ))}
                  </dl>
                </section>
              </div>

              <section className="fp-retenir" aria-labelledby="fp-retenir">
                <div className="fp-retenir-text">
                  <h4 id="fp-retenir"><span aria-hidden="true">⭐</span> À retenir !</h4>
                  {fiche.resume.map((p) => <p key={p}>{p}</p>)}
                </div>
                <img src="/brand/monument.webp" alt="" className="fp-monument" />
                <div className="fp-retenir-voix">
                  <BarreVocale id={`pays-${fiche.code}`} phrases={fiche.resume} nom={`Écouter le résumé de ${fiche.nom}`} />
                  {onAsk && (
                    <button type="button" className="fp-ask-link" onClick={aller(() => onAsk(fiche.question))}>
                      <Mic size={16} aria-hidden="true" /> Poser une question à l’assistant sur ce pays
                    </button>
                  )}
                </div>
              </section>

              {voirSites && (
                <section className="fp-panel" aria-labelledby="fp-sites" ref={sitesRef} tabIndex={-1}>
                  <h4 className="fp-band" id="fp-sites"><MapPin size={20} aria-hidden="true" /> Ses sites</h4>
                  {fiche.sites.length > 0 ? (
                    <ul className="fp-sites">
                      {fiche.sites.map((s) => (
                        <li key={s.site}><MapPin size={18} aria-hidden="true" /><b>{s.site}</b><span>{s.total} médaille{s.total > 1 ? 's' : ''}</span></li>
                      ))}
                    </ul>
                  ) : <p className="fp-wait">Les sites de ses médailles ne sont pas encore connus.</p>}
                </section>
              )}

              <nav className="fp-actions" aria-label="Aller plus loin">
                {onVoirEpreuves && (
                  <button type="button" onClick={aller(() => onVoirEpreuves(fiche.nom))}>
                    <PersonStanding size={20} aria-hidden="true" /> Voir les épreuves
                  </button>
                )}
                {onVoirProgramme && (
                  <button type="button" onClick={aller(onVoirProgramme)}>
                    <CalendarDays size={20} aria-hidden="true" /> Voir le programme
                  </button>
                )}
                <button type="button" aria-expanded={voirSites} onClick={montrerSites}>
                  <MapPin size={20} aria-hidden="true" /> Voir les sites
                </button>
              </nav>

              <svg className="fp-foot" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0,22 C110,4 250,44 400,14 L400,60 L0,60 Z" fill="#e31b23" />
                <path d="M0,30 C120,12 250,50 400,24 L400,60 L0,60 Z" fill="#fdef42" />
                <path d="M0,38 C130,22 260,56 400,34 L400,60 L0,60 Z" fill="#0b7a3b" />
              </svg>
            </div>
          </div>
        );
      }}
    </Scrim>
  );
}
