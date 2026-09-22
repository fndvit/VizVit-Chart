<!--
  @component Area

  The series as a filled area down to the baseline — a third visual style of the
  same rows, and the second proof that a new mark costs one file.

  @property frame - The resolved plot frame (margins, scales, tick counts)
  @property rows - The series to draw, in order
  @property extents - Extents of the x, y and weight channels (unused here)
  @property style - Fill colour and opacity
-->
<script lang="ts">
	import { sampleCurve, type Point } from './catmullRom.js';
	import type { MarkProps } from './mark.js';

	let { frame, rows, style }: MarkProps = $props();

	const points = $derived<Point[]>(rows.map((r) => [frame.x(r.x), frame.y(r.y)]));

	const d = $derived.by(() => {
		const segs = sampleCurve(
			points,
			rows.map(() => 0),
			style.samples ?? 24
		);
		if (segs.length === 0) return '';
		const top = segs
			.map((s, i) =>
				i === 0 ? `M${s.from[0]},${s.from[1]}L${s.to[0]},${s.to[1]}` : `L${s.to[0]},${s.to[1]}`
			)
			.join('');
		const last = segs[segs.length - 1].to;
		const first = segs[0].from;
		// Close the shape down the right edge, along the baseline and back up.
		return `${top}L${last[0]},${frame.inner.height}L${first[0]},${frame.inner.height}Z`;
	});
</script>

<path {d} fill={style.color ?? 'currentColor'} opacity={style.opacity ?? 0.85} stroke="none" />
