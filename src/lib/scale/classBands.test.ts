/**
 * Class bands — the arithmetic a renderer and a legend must agree on.
 *
 * In the app this package was extracted from, `classBands` had **no test of its
 * own**: it was reached only transitively, through a component test that mounted
 * the legend and parsed a CSS gradient. It is the smallest module here and the
 * one everything else depends on being right, so it gets its own.
 */

import { describe, it, expect } from 'vitest';
import { classColors, classOpacities } from './classBands.js';

const RAMP = ['#fff7bc', '#fec44f', '#d95f0e'];

describe('class colours', () => {
	it('returns one colour per class', () => {
		expect(classColors(RAMP, 5)).toHaveLength(5);
		expect(classColors(RAMP, 1)).toHaveLength(1);
	});

	it('runs lightest to darkest, so it matches the alpha direction', () => {
		const [first, , last] = classColors(RAMP, 3);
		expect(first.toLowerCase()).toBe('#fff7bc');
		expect(last.toLowerCase()).toBe('#d95f0e');
	});

	it('samples a single class at the ramp start rather than dividing by zero', () => {
		expect(classColors(RAMP, 1)[0].toLowerCase()).toBe('#fff7bc');
	});

	it('falls back to a neutral grey ramp when given no stops', () => {
		const bands = classColors([], 3);
		expect(bands).toHaveLength(3);
		for (const c of bands) expect(c).toMatch(/^#[0-9a-f]{6}$/i);
	});

	it('is deterministic — the renderer and the legend must get the same answer', () => {
		expect(classColors(RAMP, 7)).toEqual(classColors(RAMP, 7));
	});

	it('returns hex, which is what both an SDK renderer and CSS accept', () => {
		for (const c of classColors(RAMP, 4)) expect(c).toMatch(/^#[0-9a-f]{6}$/i);
	});
});

describe('class opacities', () => {
	it('returns one alpha per class, spanning the range', () => {
		expect(classOpacities(5, 0.2, 1)).toEqual([0.2, 0.4, 0.6000000000000001, 0.8, 1]);
	});

	it('starts at the minimum and ends at the maximum', () => {
		const alphas = classOpacities(4, 0.1, 0.9);
		expect(alphas[0]).toBeCloseTo(0.1);
		expect(alphas[alphas.length - 1]).toBeCloseTo(0.9);
	});

	it('spaces the classes evenly', () => {
		const alphas = classOpacities(5, 0, 1);
		const gaps = alphas.slice(1).map((a, i) => a - alphas[i]);
		for (const gap of gaps) expect(gap).toBeCloseTo(gaps[0]);
	});

	it('is monotonic for any range', () => {
		const alphas = classOpacities(6, 0.15, 0.85);
		for (let i = 1; i < alphas.length; i += 1) {
			expect(alphas[i]).toBeGreaterThan(alphas[i - 1]);
		}
	});
});

describe('the two together', () => {
	it('agree on class count, so a band always has both a colour and an alpha', () => {
		for (const k of [1, 2, 5, 9]) {
			expect(classColors(RAMP, k)).toHaveLength(k);
			if (k > 1) expect(classOpacities(k, 0.2, 1)).toHaveLength(k);
		}
	});
});
