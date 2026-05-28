import { HTMLAttributes } from "react";

type BadgeVariant =
  | "purple"
  | "pink"
  | "orange"
  | "tag-purple"
  | "tag-orange"
  | "tag-green"
  | "popular";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  purple: "bg-primary text-white rounded-full px-[10px] py-[4px]",
  pink: "bg-brand-pink text-white rounded-full px-[10px] py-[4px]",
  orange: "bg-brand-orange text-white rounded-full px-[10px] py-[4px]",
  "tag-purple": "bg-card-tint-lavender text-brand-purple-800 rounded-sm px-[8px] py-[2px]",
  "tag-orange": "bg-card-tint-peach text-brand-orange-deep rounded-sm px-[8px] py-[2px]",
  "tag-green": "bg-card-tint-mint text-brand-green rounded-sm px-[8px] py-[2px]",
  popular: "bg-primary text-white rounded-full px-[10px] py-[4px]",
};

export function Badge({ variant = "purple", className = "", children, ...props }: BadgeProps) {
  return (
    <span className={`inline-flex items-center text-caption-bold ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
