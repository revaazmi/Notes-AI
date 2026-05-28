import { InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function TextInput({ label, error, className = "", id, ...props }: TextInputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-xs">
      {label && (
        <label htmlFor={inputId} className="text-body-sm font-medium text-slate">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`h-[44px] rounded-md border bg-canvas px-md text-body-md text-ink placeholder:text-muted transition-colors focus:border-2 focus:border-primary focus:outline-none ${
          error ? "border-semantic-error" : "border-hairline-strong"
        } ${className}`}
        {...props}
      />
      {error && <span className="text-body-sm text-semantic-error">{error}</span>}
    </div>
  );
}
