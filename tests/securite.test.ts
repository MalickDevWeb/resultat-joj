/** Règles de sécurité hors spec, trouvées par l'agent securite. */
import { describe, expect, it } from 'vitest';
import { pageDeNotification } from '../src/pageDeNotification';

const SITE = 'https://resultat-joj-jugu.vercel.app';

describe('Sécurité', () => {
  it.each([
    ['/?tab=medals', '/?tab=medals'],
    ['/epreuves/abc', '/epreuves/abc'],
  ])('a notification opens a page of the site itself: %s', (url, page) => {
    expect(pageDeNotification(url, SITE)).toBe(page);
  });

  it.each([
    '//evil.com', '/\\evil.com', '/\t/evil.com', '/\n/evil.com', 'https://evil.com/x', 'javascript:alert(1)', 42, undefined,
  ])('a notification never opens another site: %j', (url) => {
    expect(pageDeNotification(url, SITE)).toBe('/');
  });
});
