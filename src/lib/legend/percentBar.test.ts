/**
 * The percent bar's arithmetic, asserted directly.
 *
 * `PercentLegend.test.ts` is the companion: it mounts the component and
 * regex-parses `style.background`, which is how this arithmetic had to be tested
 * while it lived in `$derived` blocks. These are the tests that could not be
 * written then — band edges, label thinning and axis scaling as numbers, with no
 * DOM and no gradient string to parse.
 */

import { describe, it, expect } from 'vitest';
import {
	axisMaxOf,
	bandEdges,
	barGradient,
	formatBreak,
	maxLabelOf,
	pickLabels,
	ticksOf,
	type PercentBarSpec
} from './percentBar.js';

const RAMP = ['#f7f7f7', '#999999', '#252525'];

describe('the axis', () => {
	it('defaults to 100 for a missing, zero or non-finite max', () => {
		expect(axisMaxOf({ max: null })).toBe(100);
		expect(axisMaxOf({ max: undefined })).toBe(100);
		expect(axisMaxOf({ max: 0 })).toBe(100);
		expect(axisMaxOf({ max: Number.NaN })).toBe(100);
		expect(axisMaxOf({ max: Number.POSITIVE_INFINITY })).toBe(100);
	});

	it('uses a real positive max', () => {
		expect(axisMaxOf({ max: 42 })).toBe(42);
	});
});

describe('the high-end label', () => {
	it('clamps a percent to a whole 1–100', () => {
		expect(maxLabelOf({ max: 63.4, unit: 'pct' })).toBe('63%');
		expect(maxLabelOf({ max: 0.2, unit: 'pct' })).toBe('1%');
		expect(maxLabelOf({ max: 1000, unit: 'pct' })).toBe('100%');
	});

	it('formats hectares compactly and does not clamp them', () => {
		expect(maxLabelOf({ max: 12_500, unit: 'ha' })).toMatch(/ha$/);
		expect(maxLabelOf({ max: 12_500, unit: 'ha' })).not.toBe('100%');
	});
});

describe('break formatting', () => {
	it('keeps one decimal below 10, because skewed fields cluster near zero', () => {
		expect(formatBreak(0.4)).toBe('0.4');
		expect(formatBreak(9.87)).toBe('9.9');
	});

	it('rounds to whole at 10 and above', () => {
		expect(formatBreak(10.4)).toBe('10');
		expect(formatBreak(63.8)).toBe('64');
	});
});

describe('band edges', () => {
	it('brackets the breaks with 0 and 100', () => {
		expect(bandEdges([25, 50, 75], 100)).toEqual([0, 25, 50, 75, 100]);
	});

	it('produces one more edge than breaks, so k breaks delimit k+1 classes', () => {
		expect(bandEdges([10, 20], 100)).toHaveLength(4);
	});

	it('scales positions by the axis max', () => {
		expect(bandEdges([25, 50], 50)).toEqual([0, 50, 100, 100]);
	});

	it('collapses a break past the axis max to a zero-width band, never inverting', () => {
		const edges = bandEdges([50, 400], 100);
		expect(edges).toEqual([0, 50, 100, 100]);
		for (let i = 1; i < edges.length; i += 1) {
			expect(edges[i]).toBeGreaterThanOrEqual(edges[i - 1]);
		}
	});

	it('forces monotonicity when breaks arrive out of order', () => {
		const edges = bandEdges([60, 20], 100);
		expect(edges).toEqual([0, 60, 60, 100]);
	});

	it('treats a non-finite break as 0', () => {
		expect(bandEdges([Number.NaN, 50], 100)).toEqual([0, 0, 50, 100]);
	});
});

describe('label thinning', () => {
	const cands = [
		{ pct: 10, label: '10' },
		{ pct: 20, label: '20' },
		{ pct: 30, label: '30' },
		{ pct: 90, label: '90' }
	];

	it('writes nothing when the cap is zero', () => {
		expect(pickLabels(cands, 300, 0).size).toBe(0);
	});

	it('never writes more than the cap', () => {
		expect(pickLabels(cands, 300, 2).size).toBeLessThanOrEqual(2);
		expect(pickLabels(cands, 300, 3).size).toBeLessThanOrEqual(3);
	});

	it('never writes more labels than there are candidates', () => {
		expect(pickLabels(cands, 300, 10).size).toBeLessThanOrEqual(cands.length);
	});

	it('maximises the narrowest gap across the whole row, ends included', () => {
		// Writing one of 5 / 50 / 95: the middle one leaves gaps of 50 and 50,
		// while either end leaves a 5 against the fixed "0" or "100" label.
		const keep = [
			...pickLabels(
				[
					{ pct: 5, label: '5' },
					{ pct: 50, label: '50' },
					{ pct: 95, label: '95' }
				],
				400,
				1
			)
		];
		expect(keep).toEqual([1]);
	});

	it('drops labels that would collide on a narrow bar', () => {
		const tight = [
			{ pct: 50, label: '50' },
			{ pct: 51, label: '51' }
		];
		expect(pickLabels(tight, 80, 2).size).toBe(1);
	});

	it('lets everything through before the bar has been measured', () => {
		const tight = [
			{ pct: 50, label: '50' },
			{ pct: 51, label: '51' }
		];
		expect(pickLabels(tight, 0, 2).size).toBe(2);
	});
});

describe('ticks', () => {
	const spec: PercentBarSpec = { colors: RAMP, max: 100, breaks: [20, 40, 60] };

	it('places each break at its share of the axis', () => {
		expect(ticksOf(spec, 400, 10).map((t) => t.pct)).toEqual([20, 40, 60]);
	});

	it('drops breaks outside the axis — they have nowhere to sit', () => {
		const t = ticksOf({ ...spec, breaks: [-5, 0, 50, 100, 150] }, 400, 10);
		expect(t.map((x) => x.value)).toEqual([50]);
	});

	it('falls back to the opacity channel when colour is not classed', () => {
		const t = ticksOf(
			{ colors: RAMP, max: 100, opacity: { min: 0.2, max: 1, breaks: [30] } },
			400,
			10
		);
		expect(t.map((x) => x.value)).toEqual([30]);
	});

	it('prefers the colour channel when both are classed', () => {
		const t = ticksOf(
			{ colors: RAMP, max: 100, breaks: [70], opacity: { min: 0.2, max: 1, breaks: [30] } },
			400,
			10
		);
		expect(t.map((x) => x.value)).toEqual([70]);
	});
});

describe('the gradient', () => {
	it('is the plain ramp when nothing is classed', () => {
		expect(barGradient({ colors: RAMP }, 0)).toBe(
			'linear-gradient(to right, #f7f7f7, #999999, #252525)'
		);
	});

	it('is the darkest stop twice in the flat variant', () => {
		expect(barGradient({ colors: RAMP, flat: true }, 0)).toBe(
			'linear-gradient(to right, #252525, #252525)'
		);
	});

	it('emits hard stops at every class cut when the colour channel is classed', () => {
		const css = barGradient({ colors: RAMP, max: 100, breaks: [50] }, 1);
		// Two classes → the shared edge carries two different colours.
		expect(css).toMatch(/50%/);
		expect(css.match(/#[0-9a-f]{6}/g)!.length).toBeGreaterThan(2);
	});

	it('keeps the smooth ramp when ticks mode is requested instead of steps', () => {
		const stepped = barGradient({ colors: RAMP, max: 100, breaks: [50], mode: 'steps' }, 1);
		const ticked = barGradient({ colors: RAMP, max: 100, breaks: [50], mode: 'ticks' }, 1);
		expect(ticked).not.toBe(stepped);
		expect(ticked).toBe('linear-gradient(to right, #f7f7f7, #999999, #252525)');
	});

	it('carries alpha when an opacity channel is present', () => {
		const css = barGradient(
			{ colors: RAMP, max: 100, opacity: { min: 0.2, max: 1, breaks: null } },
			0
		);
		// chroma writes the modern space-separated form, `rgb(r g b / a)`.
		expect(css).toMatch(/rgb\([^)]*\/[^)]*\)/);
		expect(css).toContain('/ 0.2');
	});

	it('emits no zero-width segment for a break beyond the axis', () => {
		const css = barGradient({ colors: RAMP, max: 100, breaks: [50, 400] }, 1);
		// A collapsed band must not produce a reversed or repeated stop pair.
		const positions = [...css.matchAll(/ (\d+(?:\.\d+)?)%/g)].map((m) => Number(m[1]));
		for (let i = 1; i < positions.length; i += 1) {
			expect(positions[i]).toBeGreaterThanOrEqual(positions[i - 1]);
		}
	});
});
