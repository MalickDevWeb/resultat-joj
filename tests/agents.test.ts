/**
 * L'équipe d'agents de `.claude/agents/` : chacun est bien défini, les périmètres ne se chevauchent pas,
 * les relecteurs ne font que lire, et chaque agent garde les garde-fous de la méthode (CLAUDE.md).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const DIR = new URL('../.claude/agents/', import.meta.url);
const KNOWN_TOOLS = new Set(['Read', 'Grep', 'Glob', 'Bash', 'Edit', 'Write']);

interface Agent {
  file: string;
  name: string;
  description: string;
  tools: string[];
  body: string;
}

/** Lit l'en-tête `--- … ---` d'un agent : name, description, tools. */
function lireAgent(file: string): Agent {
  const texte = readFileSync(new URL(file, DIR), 'utf8');
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(texte);
  if (!m) throw new Error(`${file} : en-tête --- absent`);
  const champ = (cle: string) => new RegExp(`^${cle}: (.*)$`, 'm').exec(m[1] ?? '')?.[1]?.trim() ?? '';
  return {
    file,
    name: champ('name'),
    description: champ('description'),
    tools: champ('tools').split(',').map((t) => t.trim()).filter(Boolean),
    body: m[2] ?? '',
  };
}

const agents = readdirSync(DIR).filter((f) => f.endsWith('.md')).map(lireAgent);
const agent = (name: string) => {
  const a = agents.find((x) => x.name === name);
  if (!a) throw new Error(`agent ${name} introuvable`);
  return a;
};

describe('Équipe d’agents Claude Code', () => {
  it('the team is complete: ux-design, backend, frontend, relecteur and securite', () => {
    expect(agents.map((a) => a.name).sort()).toEqual(['backend', 'frontend', 'relecteur', 'securite', 'ux-design']);
  });

  it.each(agents.map((a) => [a.file, a] as const))('%s has a name matching its file, a description and known tools', (file, a) => {
    expect(a.name).toBe(file.replace(/\.md$/, ''));
    expect(a.description.length).toBeGreaterThan(60);
    expect(a.tools.length).toBeGreaterThan(0);
    for (const tool of a.tools) expect(KNOWN_TOOLS).toContain(tool);
  });

  it.each(['relecteur', 'securite'])('%s only reads: it can neither edit nor write files', (name) => {
    expect(agent(name).tools).not.toContain('Edit');
    expect(agent(name).tools).not.toContain('Write');
    expect(agent(name).body).toMatch(/ne modifies aucun fichier/);
  });

  it('scopes do not overlap: the backend leaves the screens, the frontend leaves the server', () => {
    expect(agent('backend').body).toContain('`api/`');
    expect(agent('backend').body).toMatch(/ne modifies ni `spec\.md`, ni `src\/components\/`/);
    expect(agent('frontend').body).toContain('`src/components/`');
    expect(agent('frontend').body).toMatch(/ne modifies ni `spec\.md`, ni `api\/`/);
    expect(agent('ux-design').body).toMatch(/n'écris aucun code/);
  });

  it.each(['backend', 'frontend'])('%s writes the test first, sees it fail for the right reason, and never bypasses checks', (name) => {
    const { body } = agent(name);
    expect(body).toContain('échoue pour la bonne raison');
    expect(body).toContain('npm run check');
    expect(body).toMatch(/Jamais `--no-verify`/);
  });

  it.each(['ux-design', 'backend', 'frontend'])('%s never pushes and leaves the validation to someone else', (name) => {
    expect(agent(name).body).toMatch(/ne pousses rien|ne commites rien et ne pousses rien/);
  });

  it('the backend keeps Claude safe: no key in the code, no visitor text, no Claude call in tests', () => {
    const { body } = agent('backend');
    expect(body).toContain('ANTHROPIC_API_KEY');
    expect(body).toContain("jamais un texte venu d'une requête");
    expect(body).toMatch(/n'appelle jamais le réseau ni Claude/);
  });

  it('the security auditor checks secrets, Claude credits, prompt injection, SSRF, XSS, headers and dependencies', () => {
    const { body } = agent('securite');
    for (const point of ['Secrets', 'Crédits Claude', 'Injection de prompt', 'SSRF', 'XSS', 'En-têtes', 'Dépendances']) {
      expect(body).toContain(point);
    }
    expect(body).toMatch(/n'appelles jamais l'API Claude/);
  });

  it('the reviewer judges with a clean context and gives a verdict with proof', () => {
    const { body } = agent('relecteur');
    expect(body).toContain('Converged');
    expect(body).toContain("Pas d'écart sans preuve");
    expect(body).toMatch(/ignore-le/);
  });
});
