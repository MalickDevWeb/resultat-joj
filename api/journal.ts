/**
 * Note la cause d'un échec dans les journaux de Vercel (privés, visibles seulement par le propriétaire du projet).
 * Le visiteur ne voit jamais ce texte : il reçoit une phrase claire en français.
 * Seuls le type d'erreur, son statut HTTP et un message court sont notés : jamais de clé, jamais de requête.
 */
export function noterErreur(ou: string, erreur: unknown): void {
  const champ = (cle: string): unknown =>
    typeof erreur === 'object' && erreur !== null && cle in erreur ? Reflect.get(erreur, cle) : undefined;
  const nom = champ('name');
  const statut = champ('status');
  const message = champ('message');
  const texte = (typeof message === 'string' ? message : String(erreur))
    .replace(/sk-ant-[\w-]+/g, 'sk-ant-…') // par prudence, si une clé apparaissait dans un message
    .slice(0, 300);
  console.error(`[${ou}] ${typeof nom === 'string' ? nom : typeof erreur}${typeof statut === 'number' ? ` ${statut}` : ''} : ${texte}`);
}
