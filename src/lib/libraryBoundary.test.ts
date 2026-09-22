/**
 * The packaging boundary, pinned.
 *
 * This package was carved out of a map application, so the failure mode is
 * obvious: a convenient import pulls a map concept, a dataset's column name or a
 * host's design token back in. The same test in `@vit-foundation/map` caught two
 * real leaks the day it was written, so it is here from the start.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const LIBRARY_ROOT = 'src/lib';

/**
 * Every `.ts` / `.svelte` source file under a root, recursively — excluding
 * tests, which `files` already keeps out of the published package and which are
 * free to import test runners and to name the vocabulary they forbid.
 */
function sourceFiles(root: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(root)) {
		const path = join(root, entry);
		if (statSync(path).isDirectory()) out.push(...sourceFiles(path));
		else if (/\.(test|spec)\.(ts|js)$/.test(entry)) continue;
		else if (entry.endsWith('.ts') || entry.endsWith('.svelte')) out.push(path);
	}
	return out;
}

/** Every module specifier imported by a source file. */
function specifiersOf(source: string): string[] {
	return [
		...[...source.matchAll(/^\s*import\s[^'"]*from\s+['"]([^'"]+)['"]/gm)].map((m) => m[1]),
		...[...source.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1])
	];
}

/** Source with documentation stripped — comments may cite anything. */
function codeOf(file: string): string {
	return readFileSync(file, 'utf8')
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/\/\/.*$/gm, '');
}

const files = sourceFiles(LIBRARY_ROOT);

describe('the published surface', () => {
	it('finds the library sources', () => {
		expect(files.length).toBeGreaterThan(0);
	});

	it('depends on nothing but chroma-js, d3-scale and svelte', () => {
		const ALLOWED = ['chroma-js', 'd3-scale', 'svelte'];
		const offenders: string[] = [];
		for (const file of files) {
			for (const specifier of specifiersOf(readFileSync(file, 'utf8'))) {
				if (specifier.startsWith('.')) continue; // internal
				const pkg = specifier.startsWith('@')
					? specifier.split('/').slice(0, 2).join('/')
					: specifier.split('/')[0];
				if (!ALLOWED.includes(pkg)) offenders.push(`${file} imports ${specifier}`);
			}
		}
		expect(offenders).toEqual([]);
	});

	it('uses fully specified relative specifiers, which Node does not guess', () => {
		// `svelte-package` emits relative specifiers verbatim; a bare `./foo`
		// builds here and is unimportable from the published package.
		const offenders: string[] = [];
		for (const file of files) {
			for (const specifier of specifiersOf(readFileSync(file, 'utf8'))) {
				if (!specifier.startsWith('.')) continue;
				if (!/\.(js|ts|svelte|json)$/.test(specifier)) {
					offenders.push(`${file} imports ${specifier}`);
				}
			}
		}
		expect(offenders).toEqual([]);
	});

	it('names no map vocabulary in executable code', () => {
		// A legend describes a SCALE. Anything that knows about a map, a tier or a
		// projection has wandered in from the application this came from.
		const MAP = /\b(basemap|arcgis|maplibre|pmtiles|h3|geojson|latitude|longitude|tier)\b/i;
		const offenders: string[] = [];
		for (const file of files) {
			const hit = codeOf(file).match(MAP);
			if (hit) offenders.push(`${file} names ${hit[0]}`);
		}
		expect(offenders).toEqual([]);
	});

	it('names no dataset vocabulary in executable code', () => {
		const DOMAIN = /\b(natgeo|cropgrids|schneider|glcfcs|koppen|pepsico|crop|soil)\b/i;
		const offenders: string[] = [];
		for (const file of files) {
			const hit = codeOf(file).match(DOMAIN);
			if (hit) offenders.push(`${file} names ${hit[0]}`);
		}
		expect(offenders).toEqual([]);
	});

	it("assumes no host's CSS framework or design tokens", () => {
		// The component shipped with Tailwind utilities and the app's own theme
		// tokens (`text-story-dark`, `text-xxs`), which made it unstyleable
		// anywhere else. Presentation is custom properties with fallbacks now.
		// Only `class="…"` attributes are checked: `tabular-nums` is also a real
		// CSS value (`font-variant-numeric`), which the component legitimately uses.
		const FRAMEWORK = /\b(text-|bg-|font-|gap-|flex-|w-|h-|p[xytblr]?-|m[xytblr]?-)\S/;
		const offenders: string[] = [];
		for (const file of files.filter((f) => f.endsWith('.svelte'))) {
			for (const [, value] of readFileSync(file, 'utf8').matchAll(/class="([^"]*)"/g)) {
				const literal = value.replace(/\{[^}]*\}/g, ' ');
				if (FRAMEWORK.test(literal)) offenders.push(`${file} uses "${literal.trim()}"`);
			}
		}
		expect(offenders).toEqual([]);
	});
});
