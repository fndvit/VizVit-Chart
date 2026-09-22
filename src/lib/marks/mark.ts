/**
 * @module marks/mark
 * The **mark** contract: what every visual style of a series is handed, and
 * what it is allowed to decide.
 *
 * A mark is the seam that makes a new chart style cheap. It receives a resolved
 * {@link ../plot/plotFrame} and the rows, and renders SVG into the plotting
 * area — it does not compute margins, it does not read the box, and it does not
 * know where the data came from. Everything a mark needs was decided before it
 * ran.
 *
 * Because a mark is an ordinary Svelte component, adding a style is one
 * component plus one entry in {@link ./index}, and a consumer who does not want
 * to touch this package at all can pass their own component straight to the
 * chart. There is no branch anywhere that enumerates the styles.
 */

import type { Component } from 'svelte';
import type { PlotFrame } from '../plot/plotFrame.js';
import type { SeriesExtents, SeriesRow } from '../series/series.js';

/**
 * Appearance knobs a host may set. Every field is optional: a mark must render
 * sensibly with `{}`, picking its own defaults from the frame.
 */
export type MarkStyle = {
	/** Fill/stroke of the mark itself. */
	color?: string;
	/** Halo colour drawn beneath the mark; omit for no halo. */
	outlineColor?: string;
	/** Halo thickness in px, added to each side of the mark's own width. */
	outlineWidth?: number;
	/** Opacity of the mark, 0→1. */
	opacity?: number;
	/** Stroke width in px at the low end of the weight extent. */
	minWeight?: number;
	/**
	 * Stroke width in px at the high end of the weight extent. Defaults to a
	 * width the frame can actually carry — narrower boxes get a thinner curve.
	 */
	maxWeight?: number;
	/**
	 * Pieces per span for sampled marks. Higher is smoother and costs more SVG
	 * nodes.
	 */
	samples?: number;
};

/** Everything a mark is given. It derives nothing else. */
export type MarkProps = {
	/** The resolved geometry: margins, scales, tick counts. */
	frame: PlotFrame;
	/** The series to draw, in order. */
	rows: readonly SeriesRow[];
	/** Extents of the three channels, already computed from `rows`. */
	extents: SeriesExtents;
	/** Host appearance overrides. */
	style: MarkStyle;
};

/** A mark: any Svelte component accepting {@link MarkProps}. */
export type Mark = Component<MarkProps>;

/**
 * The stroke widths a weighted mark spans at this frame size.
 *
 * Exported because the mark and the legend that explains it must agree: a
 * legend swatch that advertises a thickness the curve never draws is a lie, and
 * the only way to prevent it is for both to call this. It is the same rule
 * {@link ../scale/classBands} exists for, one channel over.
 *
 * @param frame - The resolved frame; a narrow box carries a thinner curve.
 * @param style - Host overrides; `minWeight` / `maxWeight` win when set.
 * @returns `[min, max]` stroke width in px.
 */
export function weightRange(frame: PlotFrame, style: MarkStyle): [number, number] {
	return [style.minWeight ?? 1, style.maxWeight ?? (frame.narrow ? 20 : 42)];
}
