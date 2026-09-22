/**
 * The row contract and the extents built from it.
 *
 * The guard exists because one `NaN` collapses a scale's domain and blanks the
 * whole chart with no error anywhere, so "what counts as a drawable row" has to
 * be a thing a loader can check before the chart ever sees it.
 */

import { describe, it, expect } from 'vitest';
import { isSeriesRow, seriesExtents } from './series.js';

describe('isSeriesRow', () => {
	it('accepts a row with and without a weight', () => {
		expect(isSeriesRow({ x: 1, y: 2 })).toBe(true);
		expect(isSeriesRow({ x: 1, y: 2, weight: 3 })).toBe(true);
	});

	it('rejects the NaN a missing CSV column parses to', () => {
		expect(isSeriesRow({ x: NaN, y: 2 })).toBe(false);
		expect(isSeriesRow({ x: 1, y: NaN })).toBe(false);
		expect(isSeriesRow({ x: 1, y: 2, weight: NaN })).toBe(false);
	});

	it('rejects infinities, which break a scale just as thoroughly', () => {
		expect(isSeriesRow({ x: Infinity, y: 2 })).toBe(false);
	});

	it('rejects non-objects and missing channels', () => {
		expect(isSeriesRow(null)).toBe(false);
		expect(isSeriesRow(undefined)).toBe(false);
		expect(isSeriesRow(42)).toBe(false);
		expect(isSeriesRow({ x: 1 })).toBe(false);
	});
});

describe('seriesExtents', () => {
	const rows = [
		{ x: 2000, y: 300, weight: 5 },
		{ x: 2010, y: 800, weight: 1 },
		{ x: 2024, y: 500, weight: 9 }
	];

	it('reports the min and max of each channel', () => {
		expect(seriesExtents(rows)).toEqual({ x: [2000, 2024], y: [300, 800], weight: [1, 9] });
	});

	it('returns a degenerate extent for an empty series rather than undefined', () => {
		// A chart asked to draw nothing should render an empty frame, not throw.
		expect(seriesExtents([])).toEqual({ x: [0, 0], y: [0, 0], weight: [0, 0] });
	});

	it('reports a zero weight extent when no row carries one', () => {
		expect(seriesExtents([{ x: 1, y: 2 }]).weight).toEqual([0, 0]);
	});

	it('ignores rows that carry no weight when some do', () => {
		expect(
			seriesExtents([
				{ x: 1, y: 1, weight: 4 },
				{ x: 2, y: 2 }
			]).weight
		).toEqual([4, 4]);
	});
});
