<!--
  @component SeriesPlot

  A series of `{ x, y, weight }` drawn into a responsive box, with the visual
  style chosen by a **mark**.

  This is the generalisation of a chart that was written once for one story:
  production against time, thickened by area harvested. Everything that made it
  that chart and no other is now a prop — the row channels are `x`/`y`/`weight`
  rather than a dataset's column names, every string is passed in, and *how the
  series looks* is a component.

  ```svelte
  <SeriesPlot {rows} mark="ribbon" markStyle={{ color: '#FFD700' }} />
  <SeriesPlot {rows} mark="line" />
  <SeriesPlot {rows} mark={MyOwnMark} />
  ```

  A new style never edits this file: `mark` takes either a name from
  {@link ./marks/index} or any component satisfying {@link ./marks/mark}'s
  `MarkProps`. That is the seam the whole package is arranged around.

  It draws rows and fetches nothing — loading is the caller's job, so the same
  chart serves a CSV, an API and a fixture.

  ## Hover
  The chart owns hit-testing, because it is the only thing that knows which row
  a pointer is over. It does **not** own the card: `onhover` reports the row and
  the point in container coordinates, and the host draws whatever its design
  system draws, positioned however it positions things.

  ## Theming
  | property                     | default        |
  |------------------------------|----------------|
  | `--vit-chart-font`           | `inherit`      |
  | `--vit-chart-axis-color`     | `currentColor` |
  | `--vit-chart-grid-color`     | `#cacaca`      |
  | `--vit-chart-grid-opacity`   | `0.5`          |
  | `--vit-chart-hatch-color`    | `#00000020`    |
  | `--vit-chart-highlight-ring` | `#ffffff`      |

  @property rows - The series, ascending by x. Fewer than two draws nothing
  @property mark - A built-in mark name, or your own component
  @property markStyle - Colour, halo, opacity and weight-range overrides
  @property xLabel - Text for the x-axis label; `''` draws none
  @property yLabel - Text for the y-axis label; `''` draws none
  @property formatX - How an x tick value is written
  @property formatY - How a y tick value is written
  @property legend - Caption and end labels for the weight key; `null` hides it
  @property highlights - x ranges to hatch: `{from}` marks a point, `{from,to}` a band
  @property frameOptions - Padding, nicing and inset overrides for the frame
  @property onhover - Called with the row under the pointer and its container point
  @property onleave - Called when the pointer leaves the plot
  @property overlay - Snippet rendered above the plot, for the host's own card
  @property class - Extra classes appended to the container
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { computePlotFrame, type PlotFrameOptions } from './plot/plotFrame.js';
	import PlotAxes from './plot/PlotAxes.svelte';
	import { formatCompact, formatInteger } from './plot/axisTicks.js';
	import WeightWedge from './legend/WeightWedge.svelte';
	import { MARKS, type MarkName } from './marks/index.js';
	import { weightRange, type Mark, type MarkStyle } from './marks/mark.js';
	import { seriesExtents, type SeriesRow } from './series/series.js';

	/** One x range to emphasise; `to` omitted marks a single point. */
	type Highlight = { from: number; to?: number };

	/** Where the pointer is, in container coordinates. */
	type HoverPoint = { x: number; y: number };

	let {
		rows,
		mark = 'ribbon',
		markStyle = {},
		xLabel = '',
		yLabel = '',
		formatX = formatInteger,
		formatY = formatCompact,
		legend = null,
		highlights = [],
		frameOptions = {},
		onhover = undefined,
		onleave = undefined,
		overlay = undefined,
		class: className = ''
	}: {
		rows: readonly SeriesRow[];
		mark?: MarkName | Mark;
		markStyle?: MarkStyle;
		xLabel?: string;
		yLabel?: string;
		formatX?: (value: number) => string;
		formatY?: (value: number) => string;
		legend?: { title?: string; low?: string; high?: string } | null;
		highlights?: Highlight[];
		frameOptions?: PlotFrameOptions;
		onhover?: (row: SeriesRow, point: HoverPoint) => void;
		onleave?: () => void;
		overlay?: Snippet;
		class?: string;
	} = $props();

	/** The plot wrapper, whose box drives every measurement. */
	let plotEl = $state<HTMLDivElement>();
	/** Measured box. The SVG is absolutely positioned, so it can never feed back. */
	let box = $state({ width: 0, height: 0 });

	// The wrapper's height is usually a viewport unit, so a viewport resize has
	// to be observed too — watching the element catches both.
	$effect(() => {
		const el = plotEl;
		if (!el) return;
		const measure = () => (box = { width: el.clientWidth, height: el.clientHeight });
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	});

	const extents = $derived(seriesExtents(rows));
	const frame = $derived(computePlotFrame(box, extents.x, extents.y, frameOptions));
	const drawable = $derived(rows.length >= 2 && frame.inner.width > 0 && frame.inner.height > 0);

	/** Resolved mark component — a registry name or the host's own. */
	const MarkView = $derived(typeof mark === 'string' ? MARKS[mark] : mark);

	/** Shared with the legend, so the swatch cannot outgrow the curve. */
	const strokes = $derived(weightRange(frame, markStyle));

	/** The hovered row, mirrored on the plot as a small ring. */
	let hovered = $state<SeriesRow | null>(null);

	/**
	 * The row nearest an x position, by binary search.
	 *
	 * @param value - An x value in data units.
	 * @returns The closest row, or `null` for an empty series.
	 */
	function nearestRow(value: number): SeriesRow | null {
		if (rows.length === 0) return null;
		let lo = 0;
		let hi = rows.length - 1;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (rows[mid].x < value) lo = mid + 1;
			else hi = mid;
		}
		const after = rows[lo];
		const before = rows[Math.max(0, lo - 1)];
		return Math.abs(after.x - value) < Math.abs(value - before.x) ? after : before;
	}

	/**
	 * Translates a pointer event into a row and a container point.
	 *
	 * @param event - The pointer event on the hit-test surface.
	 */
	function handleMove(event: PointerEvent) {
		if (!drawable) return;
		const rect = (event.currentTarget as SVGRectElement).getBoundingClientRect();
		const row = nearestRow(frame.x.invert(event.clientX - rect.left));
		if (!row) return;
		hovered = row;
		onhover?.(row, {
			x: event.clientX - rect.left + frame.margins.left,
			y: event.clientY - rect.top + frame.margins.top
		});
	}

	function handleLeave() {
		hovered = null;
		onleave?.();
	}
</script>

<div class="vit-plot {className}">
	{#if legend}
		<div class="vit-plot__legend">
			<WeightWedge
				range={strokes}
				color={markStyle.color ?? 'currentColor'}
				outlineColor={markStyle.outlineColor}
				outlineWidth={markStyle.outlineWidth ?? 0}
				width={frame.narrow ? 56 : 80}
				title={legend.title ?? ''}
				low={legend.low ?? 'Low'}
				high={legend.high ?? 'High'}
				titleFont={frame.type.labelFont}
				endFont={frame.type.tickFont}
			/>
		</div>
	{/if}

	<div class="vit-plot__area" bind:this={plotEl}>
		<svg class="vit-plot__svg" width={frame.box.width} height={frame.box.height}>
			<defs>
				<pattern
					id="vit-plot-hatch"
					patternUnits="userSpaceOnUse"
					width="6"
					height="6"
					patternTransform="rotate(-45)"
				>
					<line
						x1="0"
						y1="0"
						x2="0"
						y2="6"
						stroke="var(--vit-chart-hatch-color, #00000020)"
						stroke-width="3"
					/>
				</pattern>
			</defs>

			{#if drawable}
				<g transform="translate({frame.margins.left},{frame.margins.top})">
					<PlotAxes {frame} {xLabel} {yLabel} {formatX} {formatY} />

					{#each highlights as h, i (i)}
						{#if h.to === undefined}
							{@const row = rows.find((r) => r.x === h.from)}
							{#if row}
								<circle
									cx={frame.x(h.from)}
									cy={frame.y(row.y)}
									r={Math.min(60, Math.max(24, frame.inner.height / 3))}
									fill="url(#vit-plot-hatch)"
									pointer-events="none"
								/>
							{/if}
						{:else}
							<rect
								x={frame.x(h.from)}
								y={0}
								width={frame.x(h.to) - frame.x(h.from)}
								height={frame.inner.height}
								fill="url(#vit-plot-hatch)"
								pointer-events="none"
							/>
						{/if}
					{/each}

					<MarkView {frame} {rows} {extents} style={markStyle} />

					{#if hovered}
						<circle
							cx={frame.x(hovered.x)}
							cy={frame.y(hovered.y)}
							r="5"
							fill={markStyle.color ?? 'currentColor'}
							stroke="var(--vit-chart-highlight-ring, #ffffff)"
							stroke-width="1.5"
							pointer-events="none"
						/>
					{/if}

					<!-- Hit-test surface, last so it sits above every mark. -->
					<rect
						width={frame.inner.width}
						height={frame.inner.height}
						fill="none"
						pointer-events="all"
						onpointermove={handleMove}
						onpointerleave={handleLeave}
					/>
				</g>
			{/if}
		</svg>
	</div>

	{@render overlay?.()}
</div>

<style>
	.vit-plot {
		position: relative;
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		font-family: var(--vit-chart-font, inherit);
	}
	.vit-plot__legend {
		margin-left: auto;
		margin-bottom: 0.5rem;
	}
	/* The plot takes whatever height the legend left over; the SVG is absolute
	   so it can never grow this box and feed its own measurement. */
	.vit-plot__area {
		position: relative;
		flex: 1;
		width: 100%;
		min-height: 180px;
	}
	.vit-plot__svg {
		position: absolute;
		inset: 0;
		display: block;
	}
</style>
