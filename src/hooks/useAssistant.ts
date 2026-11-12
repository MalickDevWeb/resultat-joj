import { useCallback, useRef, useState } from 'react';
import { RESEAU, historiqueAEnvoyer, lireIssue, type Conversation, type Issue, type Message } from '../components/Assistant';

/** Pose la question à /api/assistant, avec les échanges précédents. Ne lève jamais : renvoie une phrase d'erreur. */
async function demander(question: string, fil: Message[]): Promise<Issue> {
  try {
    const r = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, historique: historiqueAEnvoyer(fil) }),
    });
    const corps: unknown = await r.json().catch(() => null);
    return lireIssue(r.status, corps);
  } catch {
    return { erreur: RESEAU, quota: false };
  }
}

/**
 * La conversation avec l'assistant des Jeux. Elle vit tant que l'application est ouverte (fenêtre fermée comprise)
 * et disparaît au rechargement : rien n'est stocké. Seuls les échanges réussis entrent dans le fil.
 */
export function useAssistant(): Conversation {
  const [fil, setFil] = useState<Message[]>([]);
  const [enAttente, setEnAttente] = useState<string | null>(null);
  const filRef = useRef(fil);
  filRef.current = fil;

  const envoyer = useCallback(async (question: string) => {
    setEnAttente(question);
    const issue = await demander(question, filRef.current);
    if ('reponse' in issue) {
      const reponse = issue.reponse;
      setFil((f) => [...f, { role: 'visiteur', texte: question }, { role: 'assistant', texte: reponse }]);
    }
    setEnAttente(null);
    return issue;
  }, []);

  const recommencer = useCallback(() => setFil([]), []);

  return { fil, enAttente, envoyer, recommencer };
}
