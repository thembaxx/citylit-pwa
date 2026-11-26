import assert from 'node:assert/strict';
import test from 'node:test';
import { THEME_COLORS, syncThemeColor } from './themeColor.ts';

test('theme colors match the app shell backgrounds', () => {
  assert.deepEqual(THEME_COLORS, {
    dark: '#0e0f13',
    daylight: '#a8d8ec',
    studio: '#f7f7f4',
  });
});

test('syncThemeColor updates the theme-color meta tag', () => {
  const attrs = new Map<string, string>();
  const meta = {
    setAttribute: (key: string, value: string) => attrs.set(key, value),
  } as unknown as HTMLMetaElement;
  const doc = {
    querySelector: (selector: string) => (selector === 'meta[name="theme-color"]' ? meta : null),
  } as unknown as Document;

  syncThemeColor('daylight', doc);
  assert.equal(attrs.get('content'), THEME_COLORS.daylight);

  syncThemeColor('studio', doc);
  assert.equal(attrs.get('content'), THEME_COLORS.studio);
});

test('syncThemeColor is safe when the document has no theme-color meta tag', () => {
  const doc = { querySelector: () => null } as unknown as Document;
  assert.doesNotThrow(() => syncThemeColor('dark', doc));
});
