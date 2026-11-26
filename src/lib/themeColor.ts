import type { ResolvedTheme } from '../types/citylit';

export const THEME_COLORS: Record<ResolvedTheme, string> = {
  dark: '#0e0f13',
  daylight: '#a8d8ec',
  studio: '#f7f7f4',
};

export function syncThemeColor(theme: ResolvedTheme, doc: Document = document): void {
  const meta = doc.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  meta?.setAttribute('content', THEME_COLORS[theme]);
}
