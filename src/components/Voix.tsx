import { Mic, Play, Square, Volume2 } from 'lucide-react';
import { lectureDisponible, useLecture } from '../hooks/useVoix';

/** Bouton rond du micro (spec 007). Son nom change pendant l'écoute ; pas d'aria-pressed. */
export function BoutonMicro({ nom, ecoute, disabled = false, onClick, className = '' }: {
  nom: string;
  ecoute: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button type="button" className={`micro${ecoute ? ' micro-ecoute' : ''} ${className}`} aria-label={ecoute ? 'Arrêter la dictée' : nom}
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

/**
 * Barre « message vocal » audio sous chaque réponse d'Ayo (spec 006 & maquette) :
 * Bouton rond vert ▶︎, ondes vertes animées pendant la lecture, durée estimée (≈ 15 car./sec).
 */
export function BarreVocale({ id, phrases, nom }: { id: string; phrases: string[]; nom: string }) {
  const { lit, basculer } = useLecture(id);
  const texteComplet = phrases.join(' ');
  const totalChars = [...texteComplet].length;
  // ~15 caractères par seconde
  const sec = Math.max(3, Math.round(totalChars / 15));
  const duree = String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');

  // 23 hauteurs de barres pour former une onde vocale naturelle
  const BARRES = [6, 12, 18, 10, 14, 22, 26, 16, 10, 14, 24, 28, 18, 12, 20, 26, 14, 8, 12, 20, 16, 10, 6];

  if (!lectureDisponible) return null;

  return (
    <div className={`wa-voice-player ${lit ? 'is-playing' : ''}`}>
      <button
        type="button"
        className="wa-play-btn"
        aria-label={lit ? 'Arrêter la lecture' : nom}
        onClick={() => basculer(phrases)}
      >
        {lit ? (
          <Square size={16} fill="currentColor" />
        ) : (
          <Play size={20} fill="currentColor" style={{ marginLeft: 3 }} />
        )}
      </button>

      <div className="wa-waveform" aria-hidden="true">
        {BARRES.map((h, i) => (
          <span
            key={i}
            className="wa-wave-bar"
            style={{
              height: `${h}px`,
              animationDelay: lit ? `${(i * 0.06).toFixed(2)}s` : undefined,
            }}
          />
        ))}
      </div>

      <span className="wa-voice-duration">{duree}</span>
    </div>
  );
}
