/** Règles de sécurité hors spec, trouvées par l'agent securite. */
import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import { noterErreur } from '../api/journal';
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

  it('a failure is logged with its type and status, never with an API key', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fausseCle = `sk-ant-${'a1b2'.repeat(10)}`;
    noterErreur('essai', Object.assign(new Error(`invalid x-api-key ${fausseCle}`), { name: 'AuthenticationError', status: 401 }));
    expect(log).toHaveBeenCalledWith('[essai] AuthenticationError 401 : invalid x-api-key sk-ant-…');
    log.mockRestore();
  });
});
