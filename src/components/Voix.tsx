import { Mic, Square, Volume2 } from 'lucide-react';
import { lectureDisponible, useLecture } from '../hooks/useVoix';

/** Bouton rond du micro (spec 007). Son nom change pendant l'écoute ; pas d'aria-pressed. */
export function BoutonMicro({ nom, ecoute, disabled = false, onClick }: {
  nom: string;
  ecoute: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`micro${ecoute ? ' micro-ecoute' : ''}`} aria-label={ecoute ? 'Arrêter la dictée' : nom}
      disabled={disabled} onClick={onClick}>
      <Mic aria-hidden="true" />
    </button>
  );
}

/** « Écouter » / « Arrêter » : lit des phrases en français. Rien si le navigateur ne sait pas lire. */
export function BoutonEcouter({ id, phrases, nom }: { id: string; phrases: string[]; nom: string }) {
  const { lit, basculer } = useLecture(id);
  if (!lectureDisponible) return null;
  return (
    <button type="button" className="btn ghost ecouter" aria-label={lit ? 'Arrêter la lecture' : nom} onClick={() => basculer(phrases)}>
      {lit ? <Square aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
      {lit ? 'Arrêter' : 'Écouter'}
    </button>
  );
}
