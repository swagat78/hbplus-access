import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

// Counts from the number currently on screen to `target`. Returns null until
// there is a target, so callers can show a placeholder.
export function useCountUp(target: number | null | undefined, duration = 900) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(0);
  const shown = useRef(0);

  useEffect(() => {
    if (target == null) return;

    const from = shown.current;
    const total = reduceMotion ? 0 : duration;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = total === 0 ? 1 : Math.min(1, (now - start) / total);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (target - from) * eased);
      shown.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduceMotion]);

  return target == null ? null : value;
}
