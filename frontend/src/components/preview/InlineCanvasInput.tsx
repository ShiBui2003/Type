"use client";

import { useEffect, useRef } from "react";

// The one inline-editing primitive for the builder's preview canvas,
// shared by the welcome screen and question titles so both behave
// identically.
//
// A transparent <textarea> styled to inherit the canvas theme, NOT
// contentEditable: with contentEditable, React re-rendering the node
// from state fights the browser over caret position and the cursor
// jumps to the end mid-word. A textarea is a real form control with no
// such conflict, and gives the same "the preview is the input" feel.
export function InlineCanvasInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Height follows content so long text wraps instead of scrolling
  // inside a fixed box. Runs on every render because the value can also
  // change from outside (e.g. the header title feeding the placeholder,
  // or switching to a different question).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  });

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      spellCheck={false}
      className={`w-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none placeholder:opacity-40 ${className}`}
    />
  );
}
