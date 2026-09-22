/**
 * @module plot/plotFrame
 * The **plot frame**: everything a chart can decide from the box it was given,
 * before anything is drawn.
 *
 * A chart has two halves that keep getting tangled together — where the plotting
 * area *is* (margins, scales, tick counts, which labels fit) and what gets
 * *painted* in it (a line, a ribbon, an area). Tangled, the arithmetic is only
 * reachable by resizing a browser, and every new visual style has to re-derive
 * the geometry it draws into.
 *
 * So the frame is resolved once, as a value, from three inputs: the box, the
 * data extents and a few options. {@link ../marks} are handed the result and
 * derive nothing. That split is what makes a new mark one small module instead
 * of a branch inside a 300-line draw function — and it is what lets the margin
 * arithmetic below be asserted without mounting anything.
 *
 * Margins are derived from the type metrics that occupy them rather than
 * hard-coded, so every band is accounted for explicitly:
 *
 * ```text
 * tickPad -> tick label -> labelGap -> axis label
 * ```
 *
 * which is what guarantees an axis label can never land on top of the tick
 * labels at any box size.
 */

import { scaleLinear, type ScaleLinear } from 'd3-scale';

/** The box a chart was given, in px. Usually a DOM element's client size. */
export type PlotBox = {
	/** Width of the box in px. */
	width: number;
	/** Height of the box in px. */
	height: number;
};

/** A closed numeric interval, `[min, max]`. */
export type Extent = [number, number];

/** The four margins reserved around the plotting area, in px. */
export type PlotMargins = {
	/** Gutter for the y-axis tick labels. */
	left: number;
	/** Slack on the right so the last x tick is not clipped. */
	right: number;
	/** Band above the plot, sized for the y-axis label. */
	top: number;
	/** Band below the plot, sized for the tick row and the x-axis label. */
	bottom: number;
};

/** Type metrics the margins are derived from, in px. */
export type PlotTypography = {
	/** Font size of the tick labels. */
	tickFont: number;
	/** Font size of the axis labels. */
	labelFont: number;
	/** Gap between the plot edge and the tick labels. */
	tickPad: number;
	/** Gap between the tick labels and the axis label. */
	labelGap: number;
};

/**
 * One resolved plot frame. Everything a {@link ../marks} needs to know about
 * geometry, and nothing about appearance.
 */
export type PlotFrame = {
	/** The box the frame was computed for. */
	box: PlotBox;
	/** Reserved margins around the plotting area. */
	margins: PlotMargins;
	/** The plotting area itself, i.e. the box minus the margins. */
	inner: { width: number; height: number };
	/** Type metrics the margins were derived from. */
	type: PlotTypography;
	/**
	 * True when the x-axis label shares the tick row instead of sitting on its
	 * own row below it — the fold that keeps the plot at least
	 * {@link MIN_PLOT_HEIGHT} tall in a short box.
	 */
	inlineXLabel: boolean;
	/** True for boxes narrower than {@link NARROW_WIDTH}. */
	narrow: boolean;
	/** True for boxes shorter than {@link SHORT_HEIGHT}. */
	short: boolean;
	/** Suggested number of x ticks for this width. */
	xTicks: number;
	/** Suggested number of y ticks for this height. */
	yTicks: number;
	/** Data x -> px within the plotting area. */
	x: ScaleLinear<number, number>;
	/** Data y -> px within the plotting area (inverted: 0 is the bottom). */
	y: ScaleLinear<number, number>;
};

/** Options that change how a frame is resolved. All optional. */
export type PlotFrameOptions = {
	/**
	 * Fraction of the y extent added as headroom above and below, so the curve
	 * never touches the frame edge. `0.1` = 10%. Default `0.1`.
	 */
	yPad?: number;
	/** Round the y domain out to friendly tick values. Default `true`. */
	niceY?: boolean;
	/**
	 * Left inset of the x range in px, so the first point is not painted on the
	 * y axis. Dropped to `0` on a narrow box, where the width cannot spare it.
	 * Default `28`.
	 */
	xInset?: number;
};

/**
 * Floor for the box height, so a chart dropped into a container with no height
 * at all stays legible rather than collapsing to nothing.
 */
export const MIN_HEIGHT = 180;

/**
 * Height the plotting area must keep for itself. If stacking the x-axis label
 * under the tick labels would eat into this, the label folds onto the tick row
 * instead ({@link PlotFrame.inlineXLabel}).
 */
export const MIN_PLOT_HEIGHT = 200;

/** Below this width a box is {@link PlotFrame.narrow}: tighter gutter, no x inset. */
export const NARROW_WIDTH = 640;

/** Below this height a box is {@link PlotFrame.short}: smaller type, fewer ticks. */
export const SHORT_HEIGHT = 260;

/**
 * Resolves the plot frame for one box and one pair of data extents.
 *
 * Pure: the same arguments always give the same frame, which is what lets the
 * band arithmetic be asserted directly instead of by resizing a browser.
 *
 * @param box - The box to fill, in px. Height is floored at {@link MIN_HEIGHT}.
 * @param xExtent - Data extent of the x channel, `[min, max]`.
 * @param yExtent - Data extent of the y channel, `[min, max]`.
 * @param options - Padding, nicing and inset overrides.
 * @returns The resolved frame: margins, type metrics, tick counts and scales.
 */
export function computePlotFrame(
	box: PlotBox,
	xExtent: Extent,
	yExtent: Extent,
	options: PlotFrameOptions = {}
): PlotFrame {
	const { yPad = 0.1, niceY = true, xInset = 28 } = options;

	const width = box.width;
	const height = Math.max(MIN_HEIGHT, box.height);
	const narrow = width < NARROW_WIDTH;
	const short = height < SHORT_HEIGHT;

	const tickFont = short ? 10 : 11;
	const labelFont = short ? 12 : 14;
	const tickPad = 8;
	const labelGap = 8;

	// Tick labels on their own row, axis label on a second row below them.
	const stackedBottom = tickPad + tickFont + labelGap + labelFont + 2;
	// Both share one row; the label sits at the far right, where there is width.
	const inlineBottom = tickPad + Math.max(tickFont, labelFont) + 4;

	const top = labelFont + labelGap;
	const inlineXLabel = height - top - stackedBottom < MIN_PLOT_HEIGHT;

	const margins: PlotMargins = {
		left: narrow ? 38 : 45,
		right: 30,
		top,
		bottom: inlineXLabel ? inlineBottom : stackedBottom
	};

	const inner = {
		width: width - margins.left - margins.right,
		height: height - margins.top - margins.bottom
	};

	const x = scaleLinear()
		.domain(xExtent)
		.range([narrow ? 0 : xInset, Math.max(0, inner.width)]);

	const [yMin, yMax] = yExtent;
	const pad = (yMax - yMin) * yPad;
	const y = scaleLinear()
		.domain([yMin - pad, yMax + pad])
		.range([Math.max(0, inner.height), 0]);
	if (niceY) y.nice();

	return {
		box: { width, height },
		margins,
		inner,
		type: { tickFont, labelFont, tickPad, labelGap },
		inlineXLabel,
		narrow,
		short,
		// One tick per ~45px is the density at which four-digit labels stop
		// colliding; never fewer than two, or the axis stops being readable.
		xTicks: Math.max(2, Math.floor(inner.width / 45)),
		yTicks: short ? 4 : 6,
		x,
		y
	};
}
