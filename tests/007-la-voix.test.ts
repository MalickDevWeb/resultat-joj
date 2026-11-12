import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import configVercel from '../vercel.json';

const schemaEnTetes = z.object({
  headers: z.array(
    z.object({
      source: z.string(),
      headers: z.array(z.object({ key: z.string(), value: z.string() })),
    }),
  ),
});

function politiqueDesPermissions(): Map<string, string> {
  const pageEntiere = schemaEnTetes
    .parse(configVercel)
    .headers.find((regle) => regle.source === '/(.*)');
  const enTete = pageEntiere?.headers.find((h) => h.key === 'Permissions-Policy');
  const directives = (enTete?.value ?? '').split(',').map((d) => d.trim().split('='));
  return new Map(directives.map(([nom, valeur]) => [nom ?? '', valeur ?? '']));
}

describe('007 — la voix (en-têtes)', () => {
  it('007-AS7: Permissions-Policy allows the microphone for the site itself only, still no camera nor geolocation', () => {
    const politique = politiqueDesPermissions();
    expect(politique.get('microphone')).toBe('(self)');
    expect(politique.get('camera')).toBe('()');
    expect(politique.get('geolocation')).toBe('()');
  });
});
