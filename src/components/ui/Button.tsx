import { ButtonHTMLAttributes } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "dark"
  | "ghost"
  | "link"
  | "on-dark"
  | "secondary-on-dark";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-pressed disabled:bg-hairline disabled:text-muted",
  secondary: "bg-transparent text-ink border border-hairline-strong hover:bg-surface",
  dark: "bg-ink-deep text-on-dark hover:opacity-90",
  ghost: "bg-transparent text-ink hover:bg-surface rounded-sm",
  link: "bg-transparent text-link-blue p-0 text-body-sm font-medium",
  "on-dark": "bg-on-dark text-ink hover:opacity-90",
  "secondary-on-dark": "bg-transparent text-on-dark border border-on-dark-muted hover:bg-white/10",
};

export function Button({ variant = "primary", className = "", children, type = "button", ...props }: ButtonProps) {
  const isLink = variant === "link";
  const base = isLink
    ? "inline-flex items-center cursor-pointer"
    : "inline-flex items-center justify-center cursor-pointer rounded-md px-[18px] py-[10px] text-button-md font-medium transition-colors";

  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
