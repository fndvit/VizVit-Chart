/**
 * @module @vit-foundation/chart
 *
 * Charts, the scales behind them, and the legends that describe them.
 *
 * Two ideas hold the package together. The first is that **a renderer that
 * paints classed data and a legend that explains it must agree on what a class
 * is** — {@link classColors} / {@link classOpacities} are that agreement, and
 * {@link weightRange} is the same agreement for a thickness channel.
 *
 * The second is the **mark**: a chart resolves its geometry into a
 * {@link computePlotFrame plot frame}, and a small component decides what the
 * series looks like in it. Adding a visual style is one component, not a branch
 * inside a chart.
 *
 * It knows nothing about maps and nothing about any dataset.
 *
 * Leaf consumers should import the narrow subpath rather than this barrel:
 * `@vit-foundation/chart/scale`, `/legend`, `/plot`, `/marks`, `/series`,
 * `/SeriesPlot.svelte`, `/PercentLegend.svelte`.
 */

export { default as SeriesPlot } from './SeriesPlot.svelte';
export { default as PercentLegend } from './legend/PercentLegend.svelte';
export { default as WeightWedge } from './legend/WeightWedge.svelte';
export { default as PlotAxes } from './plot/PlotAxes.svelte';

export {
	computePlotFrame,
	MIN_HEIGHT,
	MIN_PLOT_HEIGHT,
	NARROW_WIDTH,
	SHORT_HEIGHT,
	type Extent,
	type PlotBox,
	type PlotFrame,
	type PlotFrameOptions,
	type PlotMargins,
	type PlotTypography
} from './plot/plotFrame.js';
export {
	estimateTextWidth,
	formatCompact,
	formatInteger,
	visibleXTicks
} from './plot/axisTicks.js';

export { isSeriesRow, seriesExtents, type SeriesExtents, type SeriesRow } from './series/series.js';

export { MARKS, Area, Line, Ribbon, type MarkName } from './marks/index.js';
export { catmullRomPoint, sampleCurve, type Point, type Segment } from './marks/catmullRom.js';
export { weightRange, type Mark, type MarkProps, type MarkStyle } from './marks/mark.js';

export { classColors, classOpacities } from './scale/classBands.js';
export {
	axisMaxOf,
	bandEdges,
	barGradient,
	formatBreak,
	maxLabelOf,
	pickLabels,
	ticksOf,
	type OpacitySpec,
	type PercentBarSpec,
	type Tick
} from './legend/percentBar.js';
