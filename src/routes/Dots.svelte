<!--
  @component Dots

  A mark that lives OUTSIDE the package — the point of the harness section that
  uses it. It implements `MarkProps` and nothing in `@vit-foundation/chart`
  knows it exists.

  @property frame - The resolved plot frame
  @property rows - The series to draw
  @property extents - Channel extents (unused here)
  @property style - Colour and opacity
-->
<script lang="ts">
	import type { MarkProps } from '$lib/marks/mark.js';

	let { frame, rows, style }: MarkProps = $props();
</script>

{#each rows as r (r.x)}
	<circle
		cx={frame.x(r.x)}
		cy={frame.y(r.y)}
		r="4"
		fill={style.color ?? 'currentColor'}
		opacity={style.opacity ?? 1}
	/>
{/each}
