import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface PopoverProps {
  /** Render prop for the trigger; receives open state and a toggle. */
  trigger: (p: { open: boolean; toggle: () => void; ref: (el: HTMLElement | null) => void }) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: 'start' | 'end';
  width?: number | 'trigger';
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Portal-based popover so it is never clipped by scrolling tables or cards. */
export function Popover({ trigger, children, align = 'start', width, className, open: controlled, onOpenChange }: PopoverProps) {
  const [inner, setInner] = useState(false);
  const open = controlled ?? inner;
  const setOpen = useCallback(
    (v: boolean) => {
      if (controlled === undefined) setInner(v);
      onOpenChange?.(v);
    },
    [controlled, onOpenChange],
  );
  const anchor = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  // Nesting depth = number of open popover panels the trigger sits inside.
  const depth = useRef(0);
  if (open) {
    const parent = anchor.current?.closest('[data-popover-panel]');
    depth.current = parent ? Number(parent.getAttribute('data-depth')) + 1 : 0;
  }
  const [pos, setPos] = useState<{ top: number; left: number; w?: number; up: boolean }>({ top: 0, left: 0, up: false });

  const place = useCallback(() => {
    const a = anchor.current?.getBoundingClientRect();
    if (!a) return;
    const ph = panel.current?.offsetHeight ?? 240;
    const pw = width === 'trigger' ? a.width : (width ?? panel.current?.offsetWidth ?? 220);
    const up = a.bottom + ph + 8 > window.innerHeight && a.top - ph - 8 > 0;
    let left = align === 'end' ? a.right - pw : a.left;
    left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
    setPos({ top: up ? a.top - ph - 4 : a.bottom + 4, left, w: width === 'trigger' ? a.width : typeof width === 'number' ? width : undefined, up });
  }, [align, width]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || anchor.current?.contains(t)) return;
      // Clicks inside a nested popover (also portalled to body) must not close this one.
      if (t instanceof Element && t.closest('[data-popover-panel]')) {
        const other = t.closest('[data-popover-panel]');
        if (other !== panel.current && Number(other?.getAttribute('data-depth')) > depth.current) return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onMove = () => place();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    const ro = new ResizeObserver(onMove);
    if (panel.current) ro.observe(panel.current);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
      ro.disconnect();
    };
  }, [open, place, setOpen]);

  const close = () => setOpen(false);

  return (
    <>
      {trigger({ open, toggle: () => setOpen(!open), ref: (el) => (anchor.current = el) })}
      {open &&
        createPortal(
          <div
            ref={panel}
            data-popover-panel
            data-depth={depth.current}
            style={{ top: pos.top, left: pos.left, width: pos.w }}
            className={clsx('fixed z-[60] rounded-lg border border-line bg-white shadow-pop', className)}
          >
            {typeof children === 'function' ? children(close) : children}
          </div>,
          document.body,
        )}
    </>
  );
}

export interface MenuItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  hint?: string;
  danger?: boolean;
  onSelect: () => void;
}

export function MenuList({ items, close, title }: { items: MenuItem[]; close: () => void; title?: string }) {
  return (
    <div className="min-w-[180px] py-1">
      {title && <div className="border-b border-line px-3 pb-2 pt-1.5 text-xs font-medium text-ink-soft">{title}</div>}
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          disabled={it.disabled}
          title={it.disabled ? it.hint : undefined}
          onClick={() => {
            it.onSelect();
            close();
          }}
          className={clsx(
            'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm',
            it.disabled ? 'cursor-not-allowed text-ink-faint' : it.danger ? 'text-red-600 hover:bg-red-50' : 'hover:bg-surface-sunken',
          )}
        >
          {it.icon}
          <span className="flex-1">{it.label}</span>
        </button>
      ))}
    </div>
  );
}
