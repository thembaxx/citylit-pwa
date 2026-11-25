import { useEffect, useState } from 'react';

/**
 * Generic media-query hook with live updates.
 *
 * Used for layout decisions that must match CSS exactly (phone vs. tablet,
 * short landscape phones, coarse pointers, wide desktop stages).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True on coarse pointers (touch), where hover affordances never fire. */
export function useCoarsePointer(): boolean {
  return useMediaQuery('(hover: none) and (pointer: coarse)');
}

/** True on short viewports — typically a phone held in landscape. */
export function useShortViewport(maxHeightPx = 560): boolean {
  return useMediaQuery(`(max-height: ${maxHeightPx}px)`);
}

/**
 * True when the viewport is wide enough for a side drawer (tablet landscape
 * and up). Used by the search / info surfaces, which switch from a bottom
 * sheet to a right-hand drawer.
 */
export function useSideDrawerLayout(minWidthPx = 1024): boolean {
  return useMediaQuery(`(min-width: ${minWidthPx}px)`);
}
