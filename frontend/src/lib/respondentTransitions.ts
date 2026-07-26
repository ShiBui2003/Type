// Direction-aware slide+fade for the respondent flow's screen transitions
// (standard AnimatePresence carousel pattern - each screen's `custom` is
// the same `direction` value AnimatePresence itself receives, so the
// exiting screen picks the right exit variant). Duration/easing live
// here, in one place, per the brief's own instruction to expose them for
// hand-tuning rather than hardcoding per screen.
export const SLIDE_VARIANTS = {
  enter: (direction: 1 | -1) => ({ opacity: 0, y: direction === 1 ? 24 : -24 }),
  center: { opacity: 1, y: 0 },
  exit: (direction: 1 | -1) => ({ opacity: 0, y: direction === 1 ? -24 : 24 }),
};

export const SLIDE_TRANSITION = { duration: 0.3, ease: [0.55, 0, 0.1, 1] as const };
