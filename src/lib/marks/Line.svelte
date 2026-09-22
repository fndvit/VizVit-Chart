<!--
  @component Line

  A plain constant-width curve through the series — the same Catmull-Rom shape
  as {@link ./Ribbon.svelte}, ignoring the weight channel.

  It exists to prove the {@link ./mark} seam as much as to be used: it is a
  different visual style of the same data, and it is ~20 lines, none of which
  touch the chart that hosts it.

  @property frame - The resolved plot frame (margins, scales, tick counts)
  @property rows - The series to draw, in order
  @property extents - Extents of the x, y and weight channels (unused here)
  @property style - Colour, halo, opacity; `minWeight` sets the stroke width
-->
<script lang="ts">
	import { sampleCurve, type Point } from './catmullRom.js';
	import type { MarkProps } from './mark.js';

	let { frame, rows, style }: MarkProps = $props();

	const points = $derived<Point[]>(rows.map((r) => [frame.x(r.x), frame.y(r.y)]));

	/** Sampled at a coarser density: a constant width hides the joins anyway. */
	const d = $derived(
		sampleCurve(
			points,
			rows.map(() => 0),
			style.samples ?? 24
		)
			.map((s, i) =>
				i === 0 ? `M${s.from[0]},${s.from[1]}L${s.to[0]},${s.to[1]}` : `L${s.to[0]},${s.to[1]}`
			)
			.join('')
	);

	const stroke = $derived(style.minWeight ?? 2);
	const hasHalo = $derived((style.outlineWidth ?? 0) > 0 && !!style.outlineColor);
</script>

{#if hasHalo}
	<path
		{d}
		fill="none"
		stroke={style.outlineColor}
		stroke-width={stroke + (style.outlineWidth ?? 0) * 2}
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
{/if}
<path
	{d}
	fill="none"
	opacity={style.opacity ?? 1}
	stroke={style.color ?? 'currentColor'}
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
/>
