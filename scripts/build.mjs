import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

await Promise.all([
	build({
		entryPoints: ['src/index.js'],
		outfile: 'dist/proseid.js',
		bundle: true,
		format: 'esm',
		target: ['es2020'],
		sourcemap: true,
		legalComments: 'none'
	}),
	build({
		entryPoints: ['src/index.js'],
		outfile: 'dist/proseid.min.js',
		bundle: true,
		format: 'iife',
		globalName: 'ProseID',
		target: ['es2020'],
		minify: true,
		sourcemap: true,
		legalComments: 'none'
	}),
	cp('src/index.d.ts', 'dist/index.d.ts')
]);

console.log('Built dist/proseid.js and dist/proseid.min.js');

