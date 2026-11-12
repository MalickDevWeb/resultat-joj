import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import configVercel from '../vercel.json';
import { questionDictee } from '../src/components/Assistant';
import { texteDuResume } from '../src/components/DaySummary';
import { hitEvent } from '../src/components/Results';
import type { PodiumEvent } from '../src/data';
import {
  creerDictee,
  creerLecteur,
  creerMention,
  MENTION,
  nettoyerDictee,
  phraseDeDictee,
  reconnaissanceDuNavigateur,
  syntheseDuNavigateur,
  voixFrancaise,
  type MoteurDeLecture,
  type ReconnaissanceVocale,
  type VoixDisponible,
} from '../src/hooks/voix';

const schemaEnTetes = z.object({
  headers: z.array(
    z.object({
      source: z.string(),
      headers: z.array(z.object({ key: z.string(), value: z.string() })),
    }),
  ),
});

function politiqueDesPermissions(): Map<string, string> {
  const pageEntiere = schemaEnTetes
    .parse(configVercel)
    .headers.find((regle) => regle.source === '/(.*)');
  const enTete = pageEntiere?.headers.find((h) => h.key === 'Permissions-Policy');
  const directives = (enTete?.value ?? '').split(',').map((d) => d.trim().split('='));
  return new Map(directives.map(([nom, valeur]) => [nom ?? '', valeur ?? '']));
}

describe('007 — la voix (en-têtes)', () => {
  it('007-AS7: Permissions-Policy allows the microphone for the site itself only, still no camera nor geolocation', () => {
    const politique = politiqueDesPermissions();
    expect(politique.get('microphone')).toBe('(self)');
    expect(politique.get('camera')).toBe('()');
    expect(politique.get('geolocation')).toBe('()');
  });
});

// ---------- Écran : dicter et écouter (T03) ----------

/** Faux moteur de reconnaissance : enregistre la configuration et laisse le test parler à sa place. */
class FausseReconnaissance implements ReconnaissanceVocale {
  static derniere: FausseReconnaissance | null = null;
  static refuseDeDemarrer = false;
  lang = '';
  continuous = true;
  interimResults = true;
  maxAlternatives = 5;
  onresult: ReconnaissanceVocale['onresult'] = null;
  onerror: ReconnaissanceVocale['onerror'] = null;
  onend: ReconnaissanceVocale['onend'] = null;
  demarrages = 0;
  arrets = 0;
  abandons = 0;
  constructor() { FausseReconnaissance.derniere = this; }
  start() {
    if (FausseReconnaissance.refuseDeDemarrer) throw new Error('déjà démarré');
    this.demarrages += 1;
  }
  stop() { this.arrets += 1; }
  abort() { this.abandons += 1; }
  entendre(texte: string, final: boolean) {
    const resultat = Object.assign([{ transcript: texte }], { isFinal: final });
    this.onresult?.({ resultIndex: 0, results: [resultat] });
  }
  echouer(code: string) { this.onerror?.({ error: code }); }
  finir() { this.onend?.(); }
}

function dicter(enLigne = true) {
  const recu = { texte: [] as string[], erreurs: [] as string[], fins: 0 };
  const dictee = creerDictee(FausseReconnaissance, {
    surTexte: (t) => recu.texte.push(t),
    surErreur: (p) => recu.erreurs.push(p),
    surFin: () => { recu.fins += 1; },
  }, enLigne);
  return { dictee, recu, micro: FausseReconnaissance.derniere };
}

/** Faux moteur de lecture : garde les phrases dites et laisse le test finir chaque phrase. */
function fauxMoteur(voix: VoixDisponible[] = []) {
  const dites: { texte: string; voix: VoixDisponible | null; finir: (ok: boolean) => void }[] = [];
  let taire = 0;
  const moteur: MoteurDeLecture = {
    dire: (texte, v, surFin) => { dites.push({ texte, voix: v, finir: surFin }); },
    taire: () => { taire += 1; },
    voix: () => voix,
  };
  return { moteur, dites, taire: () => taire };
}

describe('007 — la voix (écran)', () => {
  it('007-AS1: a dictated search is trimmed and loses its final full stop, like typed text', () => {
    expect(nettoyerDictee('  Sénégal lutte. ')).toBe('Sénégal lutte');
    expect(nettoyerDictee('Sénégal lutte')).toBe('Sénégal lutte');
  });

  it('007-AS1: « Sénégal lutte » finds the beach wrestling events with a Senegalese medallist', () => {
    const epreuve = (disc: string, c: string): PodiumEvent => ({
      id: `${disc}-${c}`, disc, name: '80 kg garçons', site: 'Saly', venue: 'Plage de Saly', time: '', status: 'off',
      versions: [{ v: 1, at: '11 nov.', by: 'Wikipédia', motif: null, valid: null, pod: [{ n: 'Moussa Ndiaye', c, m: 1 }] }],
    });
    expect(hitEvent('Sénégal lutte', epreuve('Lutte de plage', 'SEN'))).toBe(true);
    expect(hitEvent('Sénégal lutte', epreuve('Lutte de plage', 'JOR'))).toBe(false);
    expect(hitEvent('Sénégal lutte', epreuve('Judo', 'SEN'))).toBe(false);
    expect(hitEvent('Moussa', epreuve('Judo', 'SEN'))).toBe(true);
  });

  it('007-AS2: a dictated question gets a capital letter and a question mark, cut at 500 characters', () => {
    expect(questionDictee('combien de médailles pour le Sénégal')).toBe('Combien de médailles pour le Sénégal ?');
    expect(questionDictee('où est la lutte ?')).toBe('Où est la lutte ?');
    expect(questionDictee('quelles finales aujourd’hui.')).toBe('Quelles finales aujourd’hui ?');
    expect([...(questionDictee('é'.repeat(600)) ?? '')]).toHaveLength(500);
    expect(questionDictee('   ')).toBeNull();
  });

  it('007-AS3: dictation listens in French for one sentence, keeps only final results and stops by itself', () => {
    const { recu, micro } = dicter();
    expect(micro?.lang).toBe('fr-FR');
    expect(micro?.continuous).toBe(false);
    expect(micro?.interimResults).toBe(false);
    expect(micro?.demarrages).toBe(1);
    micro?.entendre('Sénégal', false);
    micro?.entendre('Sénégal lutte', true);
    micro?.finir();
    expect(recu).toEqual({ texte: ['Sénégal lutte'], erreurs: [], fins: 1 });
  });

  it('007-AS3: a second touch stops the microphone and keeps what was heard, leaving the screen cancels silently', () => {
    const premier = dicter();
    premier.dictee.arreter();
    expect(premier.micro?.arrets).toBe(1);
    premier.micro?.entendre('Sénégal', true);
    premier.micro?.finir();
    expect(premier.recu).toEqual({ texte: ['Sénégal'], erreurs: [], fins: 1 });

    const second = dicter();
    second.dictee.arreter();
    second.micro?.finir();
    expect(second.recu).toEqual({ texte: [], erreurs: [], fins: 1 });

    const troisieme = dicter();
    troisieme.dictee.annuler();
    expect(troisieme.micro?.abandons).toBe(1);
    troisieme.micro?.entendre('Sénégal', true);
    troisieme.micro?.echouer('aborted');
    troisieme.micro?.finir();
    expect(troisieme.recu).toEqual({ texte: [], erreurs: [], fins: 0 });
  });

  it('007-AS4: each browser error becomes a clear French sentence, a wanted stop says nothing', () => {
    expect(phraseDeDictee('not-allowed')).toBe('Autorisez le micro pour dicter.');
    expect(phraseDeDictee('service-not-allowed')).toBe('Autorisez le micro pour dicter.');
    expect(phraseDeDictee('audio-capture')).toBe('Aucun micro n’a été trouvé.');
    expect(phraseDeDictee('no-speech')).toBe('Je n’ai rien entendu. Réessayez.');
    expect(phraseDeDictee('network')).toBe('La dictée a besoin d’internet.');
    expect(phraseDeDictee('language-not-supported')).toBe('La dictée n’a pas fonctionné. Réessayez.');
    expect(phraseDeDictee('aborted')).toBeNull();
  });

  it('007-AS4: an error, an empty dictation, no network or a failed start are explained', () => {
    const refuse = dicter();
    refuse.micro?.echouer('not-allowed');
    refuse.micro?.finir();
    expect(refuse.recu).toEqual({ texte: [], erreurs: ['Autorisez le micro pour dicter.'], fins: 1 });

    const muet = dicter();
    muet.micro?.finir();
    expect(muet.recu.erreurs).toEqual(['Je n’ai rien entendu. Réessayez.']);

    FausseReconnaissance.derniere = null;
    const horsLigne = dicter(false);
    expect(horsLigne.micro).toBeNull();
    expect(horsLigne.recu).toEqual({ texte: [], erreurs: ['La dictée a besoin d’internet.'], fins: 1 });

    FausseReconnaissance.refuseDeDemarrer = true;
    const bloque = dicter();
    FausseReconnaissance.refuseDeDemarrer = false;
    expect(bloque.recu).toEqual({ texte: [], erreurs: ['La dictée n’a pas fonctionné. Réessayez.'], fins: 1 });
  });

  it('007-AS5: reading prefers a French voice', () => {
    const anglaise = { lang: 'en-US', name: 'Samantha' };
    const canadienne = { lang: 'fr-CA', name: 'Amélie' };
    const francaise = { lang: 'fr-FR', name: 'Thomas' };
    expect(voixFrancaise([anglaise, canadienne, francaise])).toBe(francaise);
    expect(voixFrancaise([anglaise, canadienne])).toBe(canadienne);
    expect(voixFrancaise([anglaise])).toBeNull();
  });

  it('007-AS5: one reading at a time, read in order, the button comes back at the end, on stop or on failure', () => {
    const francaise = { lang: 'fr-FR', name: 'Thomas' };
    const { moteur, dites, taire } = fauxMoteur([francaise]);
    const lecteur = creerLecteur(moteur);
    const fins: string[] = [];

    lecteur.lire(['Premier.', 'Second.'], () => fins.push('réponse'));
    expect(dites.map((d) => d.texte)).toEqual(['Premier.', 'Second.']);
    expect(dites[0]?.voix).toBe(francaise);
    dites[0]?.finir(true);
    expect(fins).toEqual([]);
    dites[1]?.finir(true);
    expect(fins).toEqual(['réponse']);

    lecteur.lire(['Résumé.'], () => fins.push('résumé'));
    lecteur.lire(['Autre réponse.'], () => fins.push('autre'));
    expect(fins).toEqual(['réponse', 'résumé']);
    expect(taire()).toBe(1);
    dites[2]?.finir(false);
    expect(fins).toEqual(['réponse', 'résumé']);

    dites[3]?.finir(false);
    expect(fins).toEqual(['réponse', 'résumé', 'autre']);
    lecteur.arreter();
    expect(fins).toHaveLength(3);
  });

  it('007-AS5: the day summary is read with words instead of medal emojis', () => {
    expect(texteDuResume({
      jour: '2026-11-12',
      titre: 'Le Sénégal en or',
      paragraphes: ['Une journée historique.'],
      epreuves: [{ id: 'lutte', disc: 'Lutte de plage', event: '60 kg garçons', podium: [
        { m: 1, c: 'SEN', n: 'Moussa Ndiaye' },
        { m: 2, c: 'UKR', n: 'Ukraine', equipe: true },
        { m: 3, c: 'JOR', n: 'Ali Hassan' },
      ] }],
    })).toEqual([
      'Le Sénégal en or',
      'jeudi 12 novembre',
      'Une journée historique.',
      'Lutte de plage · 60 kg garçons : Or, Moussa Ndiaye (Sénégal) ; Argent, Ukraine ; Bronze, Ali Hassan (Jordanie).',
    ]);
  });

  it('007-AS6: without speech recognition or synthesis in the browser, there is no button', () => {
    expect(reconnaissanceDuNavigateur({})).toBeNull();
    expect(reconnaissanceDuNavigateur({ webkitSpeechRecognition: FausseReconnaissance })).toBe(FausseReconnaissance);
    expect(reconnaissanceDuNavigateur({ SpeechRecognition: FausseReconnaissance })).toBe(FausseReconnaissance);
    expect(syntheseDuNavigateur({})).toBeNull();
  });

  it('007-AS7: the privacy notice shows on the first dictation only, once per visit if storage fails', () => {
    const memoire = new Map<string, string>();
    const stockage = { getItem: (k: string) => memoire.get(k) ?? null, setItem: (k: string, v: string) => { memoire.set(k, v); } };
    expect(creerMention(stockage)()).toBe(true);
    expect(creerMention(stockage)()).toBe(false);
    expect(MENTION).toBe('Votre navigateur peut envoyer votre voix à ses serveurs pour l’écrire. Podium Dakar ne l’enregistre pas.');

    const casse = { getItem: (): string | null => { throw new Error('bloqué'); }, setItem: () => { throw new Error('bloqué'); } };
    const premiereDeLaVisite = creerMention(casse);
    expect(premiereDeLaVisite()).toBe(true);
    expect(premiereDeLaVisite()).toBe(false);
  });
});
