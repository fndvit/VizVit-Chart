<!--
  @component WeightWedge

  The key for a weighted mark: a wedge that grows from the mark's thinnest
  stroke to its thickest, captioned low → high.

  It takes the *same* `[min, max]` that {@link ../marks/mark}'s `weightRange`
  gave the mark, which is the whole point — a swatch that advertises a thickness
  the curve never draws is a lie, and passing the range in is what makes that
  impossible. This is the same agreement {@link ../scale/classBands} enforces for
  the colour channel.

  | property                   | default        |
  |----------------------------|----------------|
  | `--vit-chart-font`         | `inherit`      |
  | `--vit-chart-axis-color`   | `currentColor` |

  @property range - `[min, max]` stroke width in px, from `weightRange`
  @property color - Fill of the wedge; matches the mark
  @property outlineColor - Halo colour beneath the wedge; omit for none
  @property outlineWidth - Halo thickness in px, matching the mark's
  @property width - Length of the wedge in px
  @property title - Caption above the wedge, e.g. the measure's name
  @property low - Label at the thin end
  @property high - Label at the thick end
  @property titleFont - Font size of the caption in px
  @property endFont - Font size of the end labels in px
-->
<script lang="ts">
	let {
		range,
		color = 'currentColor',
		outlineColor = undefined,
		outlineWidth = 0,
		width = 80,
		title = '',
		low = 'Low',
		high = 'High',
		titleFont = 14,
		endFont = 12
	}: {
		range: [number, number];
		color?: string;
		outlineColor?: string;
		outlineWidth?: number;
		width?: number;
		title?: string;
		low?: string;
		high?: string;
		titleFont?: number;
		endFont?: number;
	} = $props();

	const half0 = $derived(range[0] / 2);
	const half1 = $derived(range[1] / 2);
	const cy = $derived(range[1] / 2);
	const hasHalo = $derived(outlineWidth > 0 && !!outlineColor);

	/**
	 * The thick end's cap overflows the SVG box by its own radius, so the label
	 * beside it has to be pushed clear by that much or it sits on the wedge.
	 */
	const highOffset = $derived(Math.round(half1 + (hasHalo ? outlineWidth : 0) + 4));
</script>

<div class="vit-wedge">
	{#if title}
		<span class="title" style="font-size: {titleFont}px">{title}</span>
	{/if}
	<div class="row">
		<span style="font-size: {endFont}px">{low}</span>
		<svg {width} height={range[1]} style="overflow: visible; display: block">
			{#if hasHalo}
				<polygon
					points="0,{cy - half0 - outlineWidth} {width},{cy - half1 - outlineWidth} {width},{cy +
						half1 +
						outlineWidth} 0,{cy + half0 + outlineWidth}"
					fill={outlineColor}
				/>
				<circle cx={0} {cy} r={half0 + outlineWidth} fill={outlineColor} />
				<circle cx={width} {cy} r={half1 + outlineWidth} fill={outlineColor} />
			{/if}
			<polygon
				points="0,{cy - half0} {width},{cy - half1} {width},{cy + half1} 0,{cy + half0}"
				fill={color}
			/>
			<circle cx={0} {cy} r={half0} fill={color} />
			<circle cx={width} {cy} r={half1} fill={color} />
		</svg>
		<span style="font-size: {endFont}px; margin-left: {highOffset}px">{high}</span>
	</div>
</div>

<style>
	.vit-wedge {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-family: var(--vit-chart-font, inherit);
		color: var(--vit-chart-axis-color, currentColor);
	}
	.row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
</style>
