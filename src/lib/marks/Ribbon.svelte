<!--
  @component Ribbon

  A curve whose thickness follows the weight channel: the mark in the middle of
  a "production over time, thickened by area harvested" chart.

  An SVG `<path>` carries one `stroke-width` for its whole length, so a varying
  width cannot be one path. The curve is sampled into short segments by
  {@link ./catmullRom} and each is stroked at its own width, with round caps so
  the joins disappear. A halo, when asked for, is the same segments drawn
  underneath at a wider stroke.

  The width range comes from {@link ./mark}'s `weightRange`, which is also what
  the legend swatch reads — so the swatch can never advertise a thickness the
  curve does not draw.

  @property frame - The resolved plot frame (margins, scales, tick counts)
  @property rows - The series to draw, in order
  @property extents - Extents of the x, y and weight channels
  @property style - Colour, halo, opacity and the weight range overrides
-->
<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { sampleCurve, type Point } from './catmullRom.js';
	import { weightRange, type MarkProps } from './mark.js';

	let { frame, rows, extents, style }: MarkProps = $props();

	/** Plot-space control points, one per row. */
	const points = $derived<Point[]>(rows.map((r) => [frame.x(r.x), frame.y(r.y)]));

	/** Data weight -> stroke width in px, shared with the legend swatch. */
	const width = $derived(scaleLinear().domain(extents.weight).range(weightRange(frame, style)));

	/** The sampled curve: one stroked line per piece. */
	const segments = $derived(
		sampleCurve(
			points,
			rows.map((r) => r.weight ?? 0),
			style.samples ?? 60
		)
	);

	const hasHalo = $derived((style.outlineWidth ?? 0) > 0 && !!style.outlineColor);
</script>

{#if hasHalo}
	<g>
		{#each segments as seg, i (i)}
			<line
				x1={seg.from[0]}
				y1={seg.from[1]}
				x2={seg.to[0]}
				y2={seg.to[1]}
				stroke={style.outlineColor}
				stroke-width={width(seg.weight) + (style.outlineWidth ?? 0) * 2}
				stroke-linecap="round"
			/>
		{/each}
	</g>
{/if}

<g opacity={style.opacity ?? 1}>
	{#each segments as seg, i (i)}
		<line
			x1={seg.from[0]}
			y1={seg.from[1]}
			x2={seg.to[0]}
			y2={seg.to[1]}
			stroke={style.color ?? 'currentColor'}
			stroke-width={width(seg.weight)}
			stroke-linecap="round"
		/>
	{/each}
</g>
