import type { PodiumEvent, Session } from './data';

export interface Resultats {
  source: { name: string; url: string; license: string; fetchedAt: string };
  sites: string[];
  sports: { disc: string; site: string; venue: string }[];
  noc: Record<string, string>;
  events: PodiumEvent[];
  pending: Session[];
  medals: Medals | null;
}
export type Medals = Record<string, number[]>;

export const SPORTS: [string, string, string, string][];
export function buildResultats(opts?: {
  prev?: Partial<Resultats> | null;
  headers?: Record<string, string>;
  log?: (msg: string) => void;
}): Promise<Resultats>;
export function sameResults(a: Partial<Resultats> | null, b: Partial<Resultats> | null): boolean;
