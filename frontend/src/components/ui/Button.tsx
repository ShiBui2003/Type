import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger";
}

// Fill color lives on a ::before layer (.tf-btn in globals.css), not the
// button's own background-color - lets hover transition smoothly and
// lets disabled dim just the fill to ~3% opacity instead of washing out
// the whole button uniformly (see .tf-btn:disabled).
export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`tf-btn tf-btn-${variant} rounded-md px-3 py-1.5 text-sm font-medium ${className}`}
      {...props}
    />
  );
}
