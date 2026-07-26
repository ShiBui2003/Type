// Shared debounce primitive. Used both by FormBuilderContext (one timer
// per question id, dynamically) and by the dashboard's FormCard inline
// rename (a single fixed key, outside any builder context) - factored
// out so those two call sites can't drift into separately-hand-rolled
// setTimeout/clearTimeout copies that quietly diverge over time.

export function createKeyedDebouncer(delay: number) {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return function schedule(key: string, fn: () => void) {
    const existing = timers.get(key);
    if (existing) clearTimeout(existing);
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        fn();
      }, delay)
    );
  };
}
