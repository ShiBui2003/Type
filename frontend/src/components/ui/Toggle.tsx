"use client";

// The one toggle switch, built to the measured spec (see
// docs/typeform-design-spec.md section 8): 28x16px track, fully pilled,
// #655D67 when on, 10x10 white knob, 0.15s transform transition.
// The brief calls this control a "required toggle" specifically, and a
// default checkbox is the single biggest tell that a settings panel is
// generic rather than Typeform-like.
//
// A real <button role="switch"> rather than a styled checkbox: it gets
// keyboard activation (Space/Enter) and the correct screen-reader state
// from aria-checked for free, without hiding an input behind CSS.
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        // Off-state track colour was a GAP in the recon (measuring it
        // would have meant changing a live setting), so it uses the
        // faint ink token rather than an invented value.
        className={`relative h-4 w-7 shrink-0 rounded-full transition-colors duration-200 ease-tf ${
          checked ? "bg-ink-muted" : "bg-ink-faint"
        }`}
      >
        {/* Travel = track(28) - knob(10) - inset(2) - inset(2) = 14px,
            so the knob sits 2px from each end in both states. */}
        <span
          className="absolute top-1/2 left-0.5 h-2.5 w-2.5 rounded-full bg-white transition-transform duration-150"
          style={{ transform: `translateY(-50%) translateX(${checked ? 14 : 0}px)` }}
        />
      </button>
      {label}
    </label>
  );
}
