import React from 'react';

const fieldBase =
  'w-full bg-transparent text-[var(--color-text-primary)] rounded-[var(--radius-md)] ' +
  'border border-[var(--color-border-strong)] px-4 py-3 outline-none ' +
  'transition-[box-shadow,border-color] duration-200 ' +
  'placeholder:text-[var(--color-text-secondary)] ' +
  'focus:border-transparent focus:shadow-[0_0_0_2px_var(--color-primary)] ' +
  'disabled:opacity-55 aria-[invalid=true]:border-[var(--color-danger)]';

interface FieldShellProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  id: string;
  children: React.ReactNode;
}

/** Shared label + hint + error scaffold so every field is consistent and accessible. */
export const Field: React.FC<FieldShellProps> = ({ label, hint, error, required, id, children }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label htmlFor={id} className="text-sm font-medium text-[var(--color-text-primary)]">
        {label}
        {required && <span className="text-[var(--color-danger)] ms-1" aria-hidden="true">*</span>}
      </label>
    )}
    {children}
    {hint && !error && (
      <p id={`${id}-hint`} className="text-xs text-[var(--color-text-secondary)]">{hint}</p>
    )}
    {error && (
      <p id={`${id}-error`} className="text-xs text-[var(--color-danger)]" role="alert">{error}</p>
    )}
  </div>
);

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, id, required, className = '', ...props }, ref) => {
    const fieldId = id || props.name || React.useId();
    return (
      <Field label={label} hint={hint} error={error} required={required} id={fieldId}>
        <input
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={`${fieldBase} ${className}`}
          {...props}
        />
      </Field>
    );
  },
);
Input.displayName = 'Input';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, id, required, className = '', rows = 4, ...props }, ref) => {
    const fieldId = id || props.name || React.useId();
    return (
      <Field label={label} hint={hint} error={error} required={required} id={fieldId}>
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={`${fieldBase} resize-y ${className}`}
          {...props}
        />
      </Field>
    );
  },
);
Textarea.displayName = 'Textarea';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, id, required, className = '', children, ...props }, ref) => {
    const fieldId = id || props.name || React.useId();
    return (
      <Field label={label} hint={hint} error={error} required={required} id={fieldId}>
        <select
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={!!error}
          className={`${fieldBase} appearance-none cursor-pointer ${className}`}
          {...props}
        >
          {children}
        </select>
      </Field>
    );
  },
);
Select.displayName = 'Select';

export default Input;
