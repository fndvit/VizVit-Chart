/**
 * @module plot/axisTicks
 * Which x ticks actually get written, once the axis label is in the way.
 *
 * When a box is too short to give the x-axis label its own row, the label folds
 * onto the tick row and sits at the far right — where it will happily overlap
 * the last two or three tick labels. The original chart solved this by rendering
 * every tick, measuring it with `getComputedTextLength()` and removing the ones
 * that collided. That works, but it can only run inside a live SVG, so the rule
 * was unassertable and only visible by resizing a browser.
 *
 * Estimating the width instead makes the rule a pure function of the frame. The
 * estimate is deliberately slightly generous, because the failure modes are not
 * symmetric: dropping a tick that would have fitted costs nothing a reader would
 * notice, while keeping one that does not fit prints two labels on top of each
 * other.
 */

import type { PlotFrame } from './plotFrame.js';

/**
 * Average glyph width as a fraction of font size, for the proportional
 * sans-serif faces these charts are set in. Digits are the common case on an
 * axis and run a little narrower than this, which is the generous direction.
 */
const GLYPH_RATIO = 0.6;

/**
 * Estimated rendered width of a string, without a DOM.
 *
 * @param text - The string that will be drawn.
 * @param fontSize - Font size in px.
 * @returns Approximate width in px.
 */
export function estimateTextWidth(text: string, fontSize: number): number {
	return text.length * fontSize * GLYPH_RATIO;
}

/**
 * The x tick values that should be written for a frame.
 *
 * When the axis label has its own row every candidate tick survives. When the
 * label shares the tick row, any tick whose label would reach into the label's
 * space is dropped.
 *
 * @param frame - The resolved frame; supplies the scale, the type metrics and
 *   whether the label is inline.
 * @param format - How a tick value is written; its output is what gets measured.
 * @param axisLabel - The x-axis label text, or `''` when there is none.
 * @returns The tick values to draw, ascending.
 */
export function visibleXTicks(
	frame: PlotFrame,
	format: (value: number) => string,
	axisLabel: string
): number[] {
	const ticks = frame.x.ticks(frame.xTicks);
	if (!frame.inlineXLabel || axisLabel === '') return ticks;

	// The label is right-aligned to the outer edge of the plot's right margin.
	const labelWidth = estimateTextWidth(axisLabel, frame.type.labelFont);
	const labelLeft = frame.inner.width + frame.margins.right - labelWidth - frame.type.labelGap;

	return ticks.filter((value) => {
		const half = estimateTextWidth(format(value), frame.type.tickFont) / 2;
		return frame.x(value) + half <= labelLeft;
	});
}

/**
 * The default way a y value is written: compact notation, so 800000000 reads as
 * "800M" rather than as nine digits on a 45px gutter.
 *
 * Uses `Intl.NumberFormat` rather than a formatting library — it is the platform,
 * it localises, and it keeps the package's dependency list at two.
 *
 * @param value - The tick value.
 * @returns The label to draw.
 */
export function formatCompact(value: number): string {
	return new Intl.NumberFormat(undefined, {
		notation: 'compact',
		maximumSignificantDigits: 3
	}).format(value);
}

/**
 * The default way an x value is written: a plain integer, which is what a year
 * axis wants and what a category index wants.
 *
 * @param value - The tick value.
 * @returns The label to draw.
 */
export function formatInteger(value: number): string {
	return String(Math.round(value));
}
