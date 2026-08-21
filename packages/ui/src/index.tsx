import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Info,
  X,
  ChevronRight,
} from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ==========================================================================
   1. BUTTON
   ========================================================================== */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'premium' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-[#4f46e5] text-white hover:bg-[#4338ca] focus:ring-[#4f46e5] shadow-sm hover:shadow',
      secondary:
        'bg-[#f1eded] dark:bg-[#1e2538] text-[#0b0e14] dark:text-[#f9fafb] hover:bg-[#ebe7e7] dark:hover:bg-[#28324a] focus:ring-gray-300',
      premium:
        'bg-[#d97706] text-white hover:bg-[#b45309] focus:ring-[#d97706] shadow-sm hover:shadow',
      outline:
        'border border-gray-200 dark:border-gray-700 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-[#4f46e5]',
      ghost:
        'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-gray-300',
      danger:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
      md: 'px-4 py-2 text-sm gap-2 rounded-xl',
      lg: 'px-6 py-3 text-base gap-2.5 rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  },
);
Button.displayName = 'Button';

/* ==========================================================================
   2. CARD & BENTO CARD
   ========================================================================== */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverLift?: boolean;
}

export function Card({ className, hoverLift = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#131722] p-6 shadow-[0_4px_20px_rgba(11,14,20,0.04)]',
        hoverLift &&
          'transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(11,14,20,0.08)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-lg font-bold tracking-tight text-[#0b0e14] dark:text-[#f9fafb]',
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-gray-500 dark:text-gray-400', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center pt-4 border-t border-gray-100 dark:border-gray-800', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* ==========================================================================
   3. BADGE & STATUS BADGE
   ========================================================================== */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'premium';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default:
      'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700',
    success:
      'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    warning:
      'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    error:
      'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    info:
      'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    premium:
      'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-bold',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-0.5 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full border',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/* ==========================================================================
   4. FORM INPUTS (INPUT, SELECT, TEXTAREA)
   ========================================================================== */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-sm">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#131722] px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-colors focus:border-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error &&
                'border-red-500 focus:border-red-500 focus:ring-red-500/20 text-red-900 dark:text-red-100',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#131722] px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 transition-colors focus:border-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 disabled:cursor-not-allowed disabled:bg-gray-50',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
        ) : null}
      </div>
    );
  },
);
Select.displayName = 'Select';

/* ==========================================================================
   5. MODAL
   ========================================================================== */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full rounded-2xl bg-white dark:bg-[#131722] p-6 shadow-2xl border border-gray-200 dark:border-gray-800 z-10 animate-in fade-in zoom-in-95 duration-200',
          sizes[size],
        )}
      >
        <div className="flex items-start justify-between pb-3">
          <div>
            <h2 className="text-lg font-bold text-[#0b0e14] dark:text-[#f9fafb]">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-3">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   6. STEPPER & PROGRESS
   ========================================================================== */
export interface Step {
  id: string;
  title: string;
  description?: string;
  status: 'completed' | 'current' | 'upcoming';
}

export function Stepper({ steps }: { steps: Step[] }) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, idx) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const isLast = idx === steps.length - 1;

          return (
            <li
              key={step.id}
              className={cn('relative flex items-center', !isLast && 'flex-1 pr-4')}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                    isCompleted && 'bg-[#0d9488] text-white',
                    isCurrent &&
                      'bg-[#4f46e5] text-white ring-4 ring-[#4f46e5]/20',
                    step.status === 'upcoming' &&
                      'bg-gray-200 dark:bg-gray-800 text-gray-500',
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <div className="hidden sm:block">
                  <div
                    className={cn(
                      'text-xs font-semibold',
                      isCurrent
                        ? 'text-[#4f46e5] dark:text-indigo-400'
                        : 'text-gray-700 dark:text-gray-300',
                    )}
                  >
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-[11px] text-gray-400">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'hidden sm:block h-0.5 flex-1 ml-4 mr-2',
                    isCompleted
                      ? 'bg-[#0d9488]'
                      : 'bg-gray-200 dark:bg-gray-800',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function ProgressBar({
  value,
  max = 100,
  className,
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={cn(
        'w-full h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden',
        className,
      )}
    >
      <div
        className="h-full bg-[#4f46e5] transition-all duration-500 rounded-full"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

/* ==========================================================================
   7. ALERT & EMPTY STATE
   ========================================================================== */
export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}: AlertProps) {
  const variants = {
    info: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800',
    success:
      'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-800',
    warning:
      'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800',
    danger:
      'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
  };

  const icons = {
    info: <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />,
    success: (
      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
    ),
    warning: (
      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
    ),
    danger: <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />,
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border text-sm',
        variants[variant],
        className,
      )}
    >
      {icons[variant]}
      <div className="flex-1">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/30',
        className,
      )}
    >
      {icon ? (
        <div className="p-3 mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-[#4f46e5]">
          {icon}
        </div>
      ) : (
        <div className="p-3 mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400">
          <Info className="w-6 h-6" />
        </div>
      )}
      <h4 className="text-base font-bold text-[#0b0e14] dark:text-[#f9fafb]">
        {title}
      </h4>
      {description && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ==========================================================================
   8. PAGE HEADER
   ========================================================================== */
export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
}: {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800 mb-6',
        className,
      )}
    >
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[#0b0e14] dark:text-[#f9fafb]">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
