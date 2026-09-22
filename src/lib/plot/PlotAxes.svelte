<!--
  @component PlotAxes

  The furniture around a mark: horizontal grid rules, the two tick rows and the
  two axis labels. It draws no data.

  It is a separate component from the chart for the same reason the frame is a
  separate value — a mark should be able to assume the axes exist without being
  able to move them, and a chart that swaps its mark should not redraw its axes.

  Position comes entirely from the {@link ./plotFrame} it is handed; appearance
  comes entirely from CSS custom properties, so the component renders standalone
  and restyles without a CSS framework.

  | property                   | default        |
  |----------------------------|----------------|
  | `--vit-chart-font`         | `inherit`      |
  | `--vit-chart-axis-color`   | `currentColor` |
  | `--vit-chart-grid-color`   | `#cacaca`      |
  | `--vit-chart-grid-opacity` | `0.5`          |

  @property frame - The resolved plot frame (margins, scales, tick counts)
  @property xLabel - Text for the x-axis label; `''` draws none
  @property yLabel - Text for the y-axis label; `''` draws none
  @property formatX - How an x tick value is written
  @property formatY - How a y tick value is written
-->
<script lang="ts">
	import type { PlotFrame } from './plotFrame.js';
	import { formatCompact, formatInteger, visibleXTicks } from './axisTicks.js';

	let {
		frame,
		xLabel = '',
		yLabel = '',
		formatX = formatInteger,
		formatY = formatCompact
	}: {
		frame: PlotFrame;
		xLabel?: string;
		yLabel?: string;
		formatX?: (value: number) => string;
		formatY?: (value: number) => string;
	} = $props();

	const yTicks = $derived(frame.y.ticks(frame.yTicks));
	const xTicks = $derived(visibleXTicks(frame, formatX, xLabel));

	/**
	 * Top edge of the x-axis label. On its own row it clears the tick labels by
	 * `labelGap`; inline it shares the tick row's top edge.
	 */
	const xLabelY = $derived(
		frame.inlineXLabel
			? frame.inner.height + frame.type.tickPad
			: frame.inner.height + frame.type.tickPad + frame.type.tickFont + frame.type.labelGap
	);
</script>

<g class="vit-axes">
	<!-- Grid rules, behind everything. -->
	<g class="grid">
		{#each yTicks as t (t)}
			<line x1={0} x2={frame.inner.width} y1={frame.y(t)} y2={frame.y(t)} />
		{/each}
	</g>

	<!-- Y ticks, in the left gutter. -->
	<g class="tick" text-anchor="end" font-size={frame.type.tickFont}>
		{#each yTicks as t (t)}
			<text x={-frame.type.tickPad} y={frame.y(t)} dominant-baseline="middle">{formatY(t)}</text>
		{/each}
	</g>

	<!-- X ticks, below the plot. `hanging` means y is the top edge of the text,
	     so the band it occupies is known rather than inferred. -->
	<g class="tick" text-anchor="middle" font-size={frame.type.tickFont}>
		{#each xTicks as t (t)}
			<text x={frame.x(t)} y={frame.inner.height + frame.type.tickPad} dominant-baseline="hanging"
				>{formatX(t)}</text
			>
		{/each}
	</g>

	{#if yLabel}
		<text
			class="label"
			font-size={frame.type.labelFont}
			x={-frame.margins.left}
			y={-frame.type.labelGap}
			text-anchor="start">{yLabel}</text
		>
	{/if}

	{#if xLabel}
		<text
			class="label"
			font-size={frame.type.labelFont}
			x={frame.inner.width + frame.margins.right}
			y={xLabelY}
			text-anchor="end"
			dominant-baseline="hanging">{xLabel}</text
		>
	{/if}
</g>

<style>
	.vit-axes {
		font-family: var(--vit-chart-font, inherit);
	}
	.grid line {
		stroke: var(--vit-chart-grid-color, #cacaca);
		stroke-opacity: var(--vit-chart-grid-opacity, 0.5);
	}
	.tick text,
	.label {
		fill: var(--vit-chart-axis-color, currentColor);
	}
</style>
