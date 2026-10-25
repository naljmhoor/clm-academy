import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'danger' | 'academy' | 'secondary' | 'ghost' | 'danger-link' | 'link';
type Size = 'sm' | 'md' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANT: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink/85 disabled:bg-ink/40',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  academy: 'bg-academy text-white hover:bg-academy/90 disabled:bg-academy/40',
  secondary: 'border border-line bg-white text-ink hover:bg-surface-sunken disabled:text-ink-faint',
  ghost: 'text-ink-soft hover:bg-surface-sunken hover:text-ink disabled:text-ink-faint',
  'danger-link': 'text-red-600 hover:text-red-700 disabled:text-red-300',
  link: 'text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline disabled:text-ink-faint',
};
const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  icon: 'h-8 w-8 justify-center',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex shrink-0 items-center rounded-md font-medium transition-colors disabled:cursor-not-allowed',
        VARIANT[variant],
        variant.endsWith('link') ? 'h-auto px-0' : SIZE[size],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
});

export function IconButton({ label, className, ...rest }: ButtonProps & { label: string }) {
  return <Button variant="ghost" size="icon" aria-label={label} title={label} className={clsx('text-ink-soft', className)} {...rest} />;
}
