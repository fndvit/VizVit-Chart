<!--
  @component PercentLegend

  A colour-scale legend: a horizontal ramp bar from 0 to the domain max, with
  optional class breaks drawn as hard-edged bands (or as ticks), and the break
  values written along the axis where they fit.

  It describes a **colour scale**, not a map — the same bar sits under a
  choropleth, a heatmap or a histogram. What it depicts is decided by
  {@link ./percentBar}: `breaks` classes the colour channel, `opacity` classes
  (or ramps) the alpha channel, and the two are composited independently so
  mismatched break sets still render correctly. `flat` is the opacity-only
  variant — the bar holds the darkest ramp colour and lets alpha carry the value.

  When a renderer paints the same classes on screen, give it the same
  `classColors` / `classOpacities` from {@link ../scale/classBands} that this bar
  uses. That shared arithmetic is the whole reason the scale module is separate.

  ## Theming
  Presentation is CSS custom properties with plain fallbacks, so the component
  renders standalone and a consumer can restyle it without a CSS framework:

  | property                      | default        |
  |-------------------------------|----------------|
  | `--vit-legend-font`           | `inherit`      |
  | `--vit-legend-label-color`    | `currentColor` |
  | `--vit-legend-label-size`     | `0.75rem`      |
  | `--vit-legend-tick-size`      | `0.625rem`     |
  | `--vit-legend-stroke`         | `#424c5c`      |
  | `--vit-legend-bar-height`     | `0.375rem`     |
  | `--vit-legend-max-label-width`| `3.5rem`       |

  @property colors - Ramp stops, low→high (left→right)
  @property max - Real domain max for the high-end label; defaults to 100
  @property unit - Field unit; drives the high-end label suffix (`%` vs ` ha`)
  @property breaks - Class-boundary values; null = plain gradient
  @property opacity - Opacity channel alpha ramp ({min,max,breaks}); null = opaque
  @property flat - Constant darkest colour, alpha encodes the value
  @property mode - Class depiction: 'steps' (default) or 'ticks'
  @property maxLabels - Cap on written boundary values (default 3); pass a
    larger number (or Infinity) to write every value that fits
  @property class - Extra classes appended to the container
-->
<script lang="ts">
	import { barGradient, maxLabelOf, ticksOf, type PercentBarSpec } from './percentBar.js';

	let {
		colors,
		max = 100,
		unit = 'pct',
		breaks = null,
		opacity = null,
		flat = false,
		mode = 'steps',
		maxLabels = 3,
		class: className = ''
	}: {
		colors: string[];
		max?: number | null;
		/** Field unit — drives the high-end label suffix (`%` vs ` ha`). */
		unit?: 'ha' | 'pct';
		breaks?: number[] | null;
		opacity?: { min: number; max: number; breaks: number[] | null } | null;
		flat?: boolean;
		mode?: 'ticks' | 'steps';
		maxLabels?: number;
		class?: string;
	} = $props();

	// Label thinning needs the rendered width, so the bar measures itself and
	// hands the number to the arithmetic. 0 means "not measured yet".
	let barWidth = $state(0);

	const spec = $derived<PercentBarSpec>({ colors, max, unit, breaks, opacity, flat, mode });

	const maxLabel = $derived(maxLabelOf(spec));
	const ticks = $derived(ticksOf(spec, barWidth, maxLabels));
	const stepped = $derived(mode === 'steps' && ticks.length > 0);
	const barBackground = $derived(barGradient(spec, ticks.length));
</script>

<div class="vit-legend {className}">
	<span class="vit-legend__end">0</span>
	<div
		class="vit-legend__track"
		class:vit-legend__track--ticked={ticks.length > 0}
		bind:clientWidth={barWidth}
	>
		<div class="vit-legend__bar" style="background: {barBackground}"></div>
		{#each ticks as t (t.value)}
			{#if !stepped}
				<div class="vit-legend__tick" style="left: {t.pct}%"></div>
			{/if}
			{#if t.labeled}
				<span class="vit-legend__tick-label" style="left: {t.pct}%">{t.label}</span>
			{/if}
		{/each}
	</div>
	<!-- Fixed-width, left-aligned label so the gradient bar keeps a constant
	     length (value "9%"/"89%"/"100%" doesn't move the bar) while the number
	     stays snug against the end of the bar. -->
	<span class="vit-legend__end vit-legend__end--max">{maxLabel}</span>
</div>

<style>
	.vit-legend {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--vit-legend-font, inherit);
	}

	.vit-legend__end {
		font-size: var(--vit-legend-label-size, 0.75rem);
		color: var(--vit-legend-label-color, currentColor);
	}

	.vit-legend__end--max {
		width: var(--vit-legend-max-label-width, 3.5rem);
		text-align: left;
		font-variant-numeric: tabular-nums;
	}

	.vit-legend__track {
		position: relative;
		width: 100%;
		flex: 1 1 0%;
	}

	/* Room under the bar for the written break values. */
	.vit-legend__track--ticked {
		padding-bottom: 0.875rem;
	}

	.vit-legend__bar {
		height: var(--vit-legend-bar-height, 0.375rem);
		border: 1px solid var(--vit-legend-stroke, #424c5c);
		border-radius: 9999px;
	}

	.vit-legend__tick {
		position: absolute;
		top: 0;
		width: 1px;
		height: var(--vit-legend-bar-height, 0.375rem);
		transform: translateX(-50%);
		background: var(--vit-legend-stroke, #424c5c);
	}

	.vit-legend__tick-label {
		position: absolute;
		top: 0.5rem;
		transform: translateX(-50%);
		font-size: var(--vit-legend-tick-size, 0.625rem);
		color: var(--vit-legend-label-color, currentColor);
		font-variant-numeric: tabular-nums;
	}
</style>
