import { useCallback, useEffect, useRef, useState } from 'react';
import type { PodiumEvent } from '../data';
import {
  ACTIVEES, BLOQUEES, DESACTIVEES, INDISPONIBLES,
  alertesDesMedailles, alertesDuDirect, etatDesNotifications, type Alerte, type EtatNotifications,
} from '../notifications';
import type { LiveSession } from './useLive';

const CLE = 'podium-notifications';
const support = () => typeof window !== 'undefined' && 'Notification' in window;

function lireChoix(): boolean {
  try { return localStorage.getItem(CLE) === '1'; } catch { return false; }
}
function garderChoix(v: boolean) {
  try { v ? localStorage.setItem(CLE, '1') : localStorage.removeItem(CLE); } catch { /* stockage indisponible : le choix vaut pour la visite */ }
}

/** Montre une alerte par le service worker (barre de notifications du téléphone), sinon par le navigateur. */
async function montrer(a: Alerte) {
  const options: NotificationOptions = { body: a.texte, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: a.cle, data: '/' };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return await reg.showNotification(a.titre, options);
    new Notification(a.titre, options);
  } catch {
    /* le navigateur a refusé à ce moment-là : rien à faire, l'application continue */
  }
}

/** Le choix du visiteur et la permission du navigateur (spec 009-AS1, AS5). `basculer` rend la phrase à afficher. */
export function useNotifications() {
  const [voulues, setVoulues] = useState(lireChoix);
  const [permission, setPermission] = useState<NotificationPermission>(() => (support() ? Notification.permission : 'default'));
  const etat: EtatNotifications = etatDesNotifications(support(), permission, voulues);

  const basculer = useCallback(async (): Promise<string> => {
    if (!support()) return INDISPONIBLES;
    if (etat === 'actives') {
      setVoulues(false);
      garderChoix(false);
      return DESACTIVEES;
    }
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p !== 'granted') return BLOQUEES;
    setVoulues(true);
    garderChoix(true);
    return ACTIVEES;
  }, [etat]);

  return { etat, basculer };
}

/**
 * Annonce ce qui change pendant que les notifications sont actives (spec 009-AS2…AS4) :
 * la première lecture après l'activation sert de point de départ, puis une alerte par nouveauté.
 */
export function useAlertes(actives: boolean, live: LiveSession[], directLu: boolean, events: PodiumEvent[]) {
  const avantDirect = useRef<LiveSession[] | null>(null);
  const avantPodiums = useRef<PodiumEvent[] | null>(null);
  const deja = useRef(new Set<string>());

  useEffect(() => {
    if (!actives || !directLu) { avantDirect.current = null; return; }
    const alertes = alertesDuDirect(avantDirect.current, live);
    avantDirect.current = live;
    alertes.filter((a) => !deja.current.has(a.cle)).forEach((a) => { deja.current.add(a.cle); void montrer(a); });
  }, [actives, directLu, live]);

  useEffect(() => {
    if (!actives) { avantPodiums.current = null; return; }
    const alertes = alertesDesMedailles(avantPodiums.current, events);
    avantPodiums.current = events;
    alertes.filter((a) => !deja.current.has(a.cle)).forEach((a) => { deja.current.add(a.cle); void montrer(a); });
  }, [actives, events]);
}
