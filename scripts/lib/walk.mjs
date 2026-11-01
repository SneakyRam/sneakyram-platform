import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

/** Yields the path of every file under `dir`, depth first. */
export async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.isFile()) yield path;
  }
}

/** Turns an OS path into a forward-slash path, so rules behave the same on Windows. */
export const toPosix = (path) => path.split('\\').join('/');
