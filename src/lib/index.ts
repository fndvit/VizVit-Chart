/**
 * @module @vit-foundation/chart
 *
 * Colour scales and the legends that describe them.
 *
 * The scale arithmetic and the legend ship together for one reason: a renderer
 * that paints classed data and a legend that explains it must agree on what a
 * class IS. {@link classColors} / {@link classOpacities} are that agreement;
 * the bar is what draws it.
 *
 * Leaf consumers should import the narrow subpath rather than this barrel:
 * `@vit-foundation/chart/scale`, `/legend`, `/PercentLegend.svelte`.
 */

export { default as ExampleChart } from './exampleChart/ExampleChart.svelte';

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
export { default as PercentLegend } from './legend/PercentLegend.svelte';
