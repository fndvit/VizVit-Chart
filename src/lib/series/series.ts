/**
 * @module series/series
 * The row contract every mark draws, and the extents a {@link ../plot/plotFrame}
 * is built from.
 *
 * A chart that takes its rows as a prop can be handed anything — a CSV column
 * that went missing parses to `NaN`, and a single `NaN` poisons an extent, which
 * collapses a scale's domain and draws nothing at all. So "what counts as a
 * drawable row" is a thing the loader, the chart and every other caller have to
 * agree on, and {@link isSeriesRow} is that agreement.
 *
 * The channel names are deliberately `x` / `y` / `weight` rather than anything a
 * dataset would recognise. This module was lifted out of a chart whose row type
 * was `{ year, area, production }`, which meant any second dataset had to speak
 * the first one's vocabulary to use it.
 */

import type { Extent } from '../plot/plotFrame.js';

/**
 * One point of a series: a position, and optionally a magnitude that a mark may
 * encode as thickness, radius or opacity.
 */
export type SeriesRow = {
	/** Position along the x axis. */
	x: number;
	/** Position along the y axis. */
	y: number;
	/**
	 * Third channel, if the mark uses one — stroke width for a ribbon, radius
	 * for a dot. Marks that ignore it draw identically without it.
	 */
	weight?: number;
};

/** The three extents a frame and a weight scale are built from. */
export type SeriesExtents = {
	/** `[min, max]` of the x channel. */
	x: Extent;
	/** `[min, max]` of the y channel. */
	y: Extent;
	/** `[min, max]` of the weight channel; `[0, 0]` when no row carries one. */
	weight: Extent;
};

/**
 * The row-shape contract: finite `x` and `y`, and a finite `weight` if present.
 *
 * Loaders should filter through this, so a bad row is dropped rather than
 * silently blanking the whole chart.
 *
 * @param value - Candidate row, typically straight from a parser.
 * @returns True when the value can be drawn.
 */
export function isSeriesRow(value: unknown): value is SeriesRow {
	if (!value || typeof value !== 'object') return false;
	const row = value as Record<string, unknown>;
	if (!Number.isFinite(row.x) || !Number.isFinite(row.y)) return false;
	return row.weight === undefined || Number.isFinite(row.weight);
}

/**
 * The extents of a series, in one pass.
 *
 * Rolled by hand rather than with three `d3.extent` calls so that an empty
 * series returns a defined, degenerate result (`[0, 0]`) instead of
 * `[undefined, undefined]` — a chart asked to draw nothing should render an
 * empty frame, not throw.
 *
 * @param rows - The series, in draw order.
 * @returns The x, y and weight extents.
 */
export function seriesExtents(rows: readonly SeriesRow[]): SeriesExtents {
	if (rows.length === 0) return { x: [0, 0], y: [0, 0], weight: [0, 0] };

	let xMin = Infinity;
	let xMax = -Infinity;
	let yMin = Infinity;
	let yMax = -Infinity;
	let wMin = Infinity;
	let wMax = -Infinity;
	let sawWeight = false;

	for (const row of rows) {
		if (row.x < xMin) xMin = row.x;
		if (row.x > xMax) xMax = row.x;
		if (row.y < yMin) yMin = row.y;
		if (row.y > yMax) yMax = row.y;
		if (row.weight !== undefined) {
			sawWeight = true;
			if (row.weight < wMin) wMin = row.weight;
			if (row.weight > wMax) wMax = row.weight;
		}
	}

	return {
		x: [xMin, xMax],
		y: [yMin, yMax],
		weight: sawWeight ? [wMin, wMax] : [0, 0]
	};
}
