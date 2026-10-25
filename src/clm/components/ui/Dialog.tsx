import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Right side of the header (e.g. status transition chips). */
  headerAside?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  showClose?: boolean;
  /** Stable anchor for guided tours. */
  tour?: string;
}

const WIDTH = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' };

export function Dialog({ open, onClose, title, description, headerAside, children, footer, width = 'md', showClose, tour }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/25 px-4 py-16" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" data-tour={tour} className={clsx('w-full rounded-xl bg-white shadow-pop', WIDTH[width])}>
        <div className="flex items-start gap-4 px-5 pb-2 pt-5">
          <div className="flex-1">
            <h2 className="text-base font-semibold">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
          </div>
          {headerAside}
          {showClose && (
            <button type="button" onClick={onClose} aria-label="Close" className="text-ink-muted hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {children && <div className="px-5 py-3">{children}</div>}
        {footer && <div className="flex items-center justify-end gap-2 px-5 pb-5 pt-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/10" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="flex h-full w-full max-w-md flex-col border-l border-line bg-white shadow-pop">
        <div className="flex items-center justify-between px-4 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
