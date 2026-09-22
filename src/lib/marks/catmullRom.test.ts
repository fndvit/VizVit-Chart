/**
 * The curve kernel, asserted without a DOM.
 *
 * This interpolation spent its whole life inlined in a chart's draw loop, where
 * it could not be called without an SVG. The properties below are the ones a
 * reader of the chart actually depends on — that the curve touches its data
 * points, and that the weight it reports is the weight between them.
 */

import { describe, it, expect } from 'vitest';
import { catmullRomPoint, sampleCurve, type Point } from './catmullRom.js';

const A: Point = [0, 0];
const B: Point = [10, 10];
const C: Point = [20, 0];
const D: Point = [30, 10];

describe('catmullRomPoint', () => {
	it('passes exactly through the span endpoints', () => {
		expect(catmullRomPoint(A, B, C, D, 0)).toEqual(B);
		expect(catmullRomPoint(A, B, C, D, 1)).toEqual(C);
	});

	it('stays inside the span horizontally', () => {
		for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) {
			const [x] = catmullRomPoint(A, B, C, D, t);
			expect(x).toBeGreaterThan(B[0]);
			expect(x).toBeLessThan(C[0]);
		}
	});

	it('is symmetric about the midpoint for a symmetric span', () => {
		const [x] = catmullRomPoint(A, B, C, D, 0.5);
		expect(x).toBeCloseTo((B[0] + C[0]) / 2, 10);
	});
});

describe('sampleCurve', () => {
	it('cannot describe a curve from fewer than two points', () => {
		expect(sampleCurve([], [], 10)).toEqual([]);
		expect(sampleCurve([A], [1], 10)).toEqual([]);
	});

	it('emits samples per span, not per series', () => {
		expect(sampleCurve([A, B, C], [1, 2, 3], 10)).toHaveLength(20);
		expect(sampleCurve([A, B, C, D], [1, 2, 3, 4], 5)).toHaveLength(15);
	});

	it('is continuous — each segment starts where the last ended', () => {
		const segs = sampleCurve([A, B, C, D], [1, 2, 3, 4], 8);
		for (let i = 1; i < segs.length; i++) {
			expect(segs[i].from[0]).toBeCloseTo(segs[i - 1].to[0], 10);
			expect(segs[i].from[1]).toBeCloseTo(segs[i - 1].to[1], 10);
		}
	});

	it('starts at the first point and ends at the last', () => {
		const segs = sampleCurve([A, B, C], [1, 2, 3], 6);
		expect(segs[0].from).toEqual(A);
		expect(segs[segs.length - 1].to).toEqual(C);
	});

	it('interpolates the weight across a span, bounded by its ends', () => {
		const segs = sampleCurve([A, B], [10, 20], 4);
		const weights = segs.map((s) => s.weight);
		expect(Math.min(...weights)).toBeGreaterThan(10);
		expect(Math.max(...weights)).toBeLessThan(20);
		// Monotonic, because the ends are.
		expect([...weights].sort((a, b) => a - b)).toEqual(weights);
	});

	it('treats a missing weight as zero rather than NaN', () => {
		const segs = sampleCurve([A, B], [], 2);
		expect(segs.every((s) => Number.isFinite(s.weight))).toBe(true);
	});

	it('refuses a sample count below one instead of looping forever', () => {
		expect(sampleCurve([A, B], [1, 2], 0)).toEqual([]);
	});
});
