import { HTMLAttributes } from "react";

type CardVariant =
  | "base"
  | "feature"
  | "feature-yellow-bold"
  | "agent-tile"
  | "pricing"
  | "pricing-featured";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variants: Record<CardVariant, string> = {
  base: "bg-canvas border border-hairline",
  feature: "bg-canvas border border-hairline",
  "feature-yellow-bold": "bg-card-tint-yellow-bold text-charcoal border-0",
  "agent-tile": "bg-canvas border border-hairline",
  pricing: "bg-canvas border border-hairline",
  "pricing-featured": "bg-surface border-2 border-primary",
};

export function Card({ variant = "base", className = "", children, ...props }: CardProps) {
  const padding = variant === "feature" || variant === "feature-yellow-bold" || variant === "pricing" || variant === "pricing-featured"
    ? "p-xxl"
    : "p-xl";

  return (
    <div className={`rounded-lg ${padding} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
