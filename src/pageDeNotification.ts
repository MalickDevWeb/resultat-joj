/**
 * Page du site à ouvrir depuis une notification : seulement une page du site lui-même.
 * L'adresse est lue comme le fait le navigateur (qui retire tabulations et retours à la ligne :
 * « /\t/autre-site » deviendrait « //autre-site ») ; on ne garde que le chemin si le site ne change pas.
 */
export function pageDeNotification(url: unknown, origine: string): string {
  if (typeof url !== 'string') return '/';
  try {
    const lue = new URL(url, origine);
    return lue.origin === new URL(origine).origin ? lue.pathname + lue.search + lue.hash : '/';
  } catch {
    return '/';
  }
}
