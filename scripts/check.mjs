import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

async function checkDirectory(directory) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const file = join(directory, entry.name);
		if (entry.isDirectory()) {
			await checkDirectory(file);
		} else if (/\.(?:js|mjs)$/.test(entry.name)) {
			const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
			if (result.error) throw result.error;
			if (result.status !== 0) process.exit(result.status || 1);
		}
	}
}

for (const directory of ['src', 'test', 'scripts']) await checkDirectory(directory);
console.log('Syntax checked all SDK source, tests and scripts.');
