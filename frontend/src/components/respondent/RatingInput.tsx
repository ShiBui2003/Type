"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export function RatingInput({
  scale,
  value,
  onChange,
}: {
  scale: number;
  value: unknown;
  onChange: (value: number) => void;
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const selected = typeof value === "number" ? value : Number(value) || 0;
  const displayValue = hoverValue ?? selected;

  return (
    <div
      className="flex gap-1"
      onMouseLeave={() => setHoverValue(null)}
      role="radiogroup"
      aria-label="Rating"
    >
      {Array.from({ length: scale }).map((_, i) => {
        const starValue = i + 1;
        const filled = starValue <= displayValue;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={starValue === selected}
            aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
            onMouseEnter={() => setHoverValue(starValue)}
            onClick={() => onChange(starValue)}
            className="p-0.5 transition-transform duration-150 ease-tf hover:scale-110"
          >
            <Star
              className="h-8 w-8"
              style={{
                color: "var(--form-fg)",
                opacity: filled ? 1 : 0.25,
                fill: filled ? "var(--form-fg)" : "transparent",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
