import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import { matches } from '../data';

export interface ComboOption {
  value: string;
  label: string;
  /** Texte secondaire (code pays, lieu…), aussi pris en compte par la recherche. */
  hint?: string;
  /** Petit visuel à gauche (drapeau, pictogramme…). */
  icon?: ReactNode;
  /** Regroupement affiché en intertitre (ex. le sport). */
  group?: string;
  /** Mots en plus pour la recherche, non affichés. */
  keywords?: string;
}

interface Props {
  value: string;
  options: ComboOption[];
  onChange: (value: string) => void;
  label: string; // nom accessible
  id?: string;
  className?: string;
  searchPlaceholder?: string;
  /** Contenu du bouton, si l'on veut autre chose que l'option choisie. */
  trigger?: ReactNode;
}

/** Liste déroulante avec recherche : clavier (↑ ↓ Entrée Échap), recherche sans accents, regroupements. */
export function Combo({ value, options, onChange, label, id, className = '', searchPlaceholder = 'Rechercher…', trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; width: number; maxH: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const uid = useId();
  const listId = `${uid}-list`;

  const sel = options.find((o) => o.value === value);
  const shown = useMemo(
    () => options.filter((o) => matches(q, o.label, o.hint ?? '', o.group ?? '', o.keywords ?? '', o.value)),
    [options, q],
  );

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.max(r.width, Math.min(320, innerWidth - 24));
    const left = Math.min(Math.max(12, r.left), innerWidth - width - 12);
    const below = innerHeight - r.bottom - 12;
    const above = r.top - 12;
    if (below >= 260 || below >= above) setPos({ left, top: r.bottom + 6, width, maxH: Math.min(380, below - 6) });
    else setPos({ left, bottom: innerHeight - r.top + 6, width, maxH: Math.min(380, above - 6) });
  };

  const openList = () => {
    place();
    setQ('');
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  };
  const pick = (o: ComboOption | undefined) => {
    if (!o) return;
    onChange(o.value);
    close();
  };

  useLayoutEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => { setActive(0); }, [q]);

  // Ferme au clic extérieur ; se replace au défilement / redimensionnement.
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!popRef.current?.contains(t) && !btnRef.current?.contains(t)) close(false);
    };
    const move = () => place();
    addEventListener('pointerdown', down, true);
    addEventListener('resize', move);
    addEventListener('scroll', move, true);
    return () => {
      removeEventListener('pointerdown', down, true);
      removeEventListener('resize', move);
      removeEventListener('scroll', move, true);
    };
  }, [open]);

  // Garde l'option active visible.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(shown.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(shown.length - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(shown[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'Tab') close(false);
  };

  let lastGroup: string | undefined;

  return (
    <>
      <button ref={btnRef} id={id} type="button" className={`combo ${className}`} aria-haspopup="listbox" aria-expanded={open}
        aria-label={`${label} : ${sel?.label ?? 'aucun'}`}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openList(); } }}>
        {trigger ?? (
          <>
            {sel?.icon && <span className="combo-ico">{sel.icon}</span>}
            <span className="combo-val">{sel ? sel.label : 'Choisir…'}</span>
            {sel?.hint && <span className="combo-hint">{sel.hint}</span>}
            <ChevronDown size={18} aria-hidden="true" className="combo-chev" />
          </>
        )}
      </button>
      {open && pos && createPortal(
        <div ref={popRef} className="combo-pop" style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width }}>
          <label className="combo-search">
            <Search size={17} aria-hidden="true" />
            <input ref={inputRef} type="text" role="combobox" aria-expanded="true" aria-controls={listId} aria-label={`Rechercher : ${label}`}
              aria-activedescendant={shown[active] ? `${uid}-o${active}` : undefined}
              placeholder={searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} />
          </label>
          <ul ref={listRef} id={listId} role="listbox" aria-label={label} className="combo-list" style={{ maxHeight: pos.maxH - 58 }}>
            {shown.length === 0 && <li className="combo-empty">Aucun résultat pour « {q.trim()} »</li>}
            {shown.map((o, i) => {
              const head = o.group && o.group !== lastGroup ? o.group : null;
              lastGroup = o.group;
              return (
                <li key={o.value} role="presentation">
                  {head && <div className="combo-group" aria-hidden="true">{head}</div>}
                  <div id={`${uid}-o${i}`} data-i={i} role="option" aria-selected={o.value === value}
                    className={`combo-opt${i === active ? ' on' : ''}`}
                    onPointerMove={() => setActive(i)} onClick={() => pick(o)}>
                    {o.icon && <span className="combo-ico">{o.icon}</span>}
                    <span className="combo-val">{o.label}</span>
                    {o.hint && <span className="combo-hint">{o.hint}</span>}
                    {o.value === value && <Check size={16} aria-hidden="true" className="combo-check" />}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>,
        document.body,
      )}
    </>
  );
}
