import { URL } from 'url';

export function join(base: string, path: string): string {
  return new URL(
    ensureTrailingSlash(base) + removeLeadingSlash(path)
  ).toString();
}

function ensureTrailingSlash(path: string): string {
  return path.endsWith('/') ? path : path + '/';
}

function removeLeadingSlash(path: string): string {
  return path.startsWith('/') ? path.slice(1) : path;
}
