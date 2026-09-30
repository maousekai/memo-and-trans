import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

export async function verifyDictionarySnapshot(directory, createManifest = false, replaceManifest = false) {
  try {
    const meta = JSON.parse(await readFile(path.join(directory, 'meta.json'), 'utf8'));
    if (!Array.isArray(meta.shardKeys) || !meta.shardKeys.length || meta.shardKeys.some((key) => !/^[a-z0-9_]$/.test(key))) return false;
    const files = ['meta.json', 'headwords.json', ...meta.shardKeys.map((key) => `shards/${key}.json`)];
    const hashes = {};
    let count = 0;
    for (const name of files) {
      const bytes = await readFile(path.join(directory, name));
      const data = JSON.parse(bytes.toString('utf8'));
      if (name.startsWith('shards/')) {
        if (!data.entries || !data.aliases || !data.ranks) return false;
        count += Object.keys(data.entries).length;
      }
      if (name === 'headwords.json' && (!Array.isArray(data) || data.length !== meta.headwordCount)) return false;
      hashes[name] = createHash('sha256').update(bytes).digest('hex');
    }
    if (count !== meta.headwordCount) return false;
    const manifestPath = path.join(directory, 'sha256.json');
    if (replaceManifest) {
      await writeFile(manifestPath, JSON.stringify(hashes, null, 2) + '\n');
      return true;
    }
    let recorded;
    try { recorded = JSON.parse(await readFile(manifestPath, 'utf8')); }
    catch (error) {
      if (error.code !== 'ENOENT' || !createManifest) return false;
      await writeFile(manifestPath, JSON.stringify(hashes, null, 2) + '\n');
      return true;
    }
    return files.every((name) => recorded[name] === hashes[name]);
  } catch { return false; }
}
