<!--
  Dev harness only — `vite dev` for eyeballing the components. Not packaged:
  `files` ships `dist` alone, and `svelte-package` only emits `src/lib`.
-->
<script lang="ts">
	import PercentLegend from '$lib/legend/PercentLegend.svelte';
	import SeriesPlot from '$lib/SeriesPlot.svelte';
	import Dots from './Dots.svelte';

	const RAMP = ['#fff7bc', '#fec44f', '#d95f0e'];

	/** A synthetic series with the shape of a production-vs-area curve. */
	const rows = Array.from({ length: 25 }, (_, i) => {
		const x = 2000 + i;
		const t = i / 24;
		return {
			x,
			y: 320_000_000 + 480_000_000 * (1 - Math.exp(-3.2 * t)) + Math.sin(i * 1.4) * 18_000_000,
			weight: 4_500_000 + 5_800_000 * t + Math.cos(i * 0.9) * 600_000
		};
	});

	const gold = { color: '#FFD700', outlineColor: '#d9b700', outlineWidth: 2 };
</script>

<main style="padding: 2rem; display: grid; gap: 3rem; max-width: 64rem;">
	<section>
		<h2>Ribbon — thickness follows the weight channel</h2>
		<div style="height: 26rem">
			<SeriesPlot
				{rows}
				mark="ribbon"
				markStyle={gold}
				yLabel="↑ million tonnes"
				xLabel="year →"
				legend={{ title: 'Area harvested' }}
				highlights={[{ from: 2013, to: 2024 }]}
			/>
		</div>
	</section>

	<section>
		<h2>Line — the same rows, a different mark</h2>
		<div style="height: 18rem">
			<SeriesPlot
				{rows}
				mark="line"
				markStyle={{ color: '#425380', minWeight: 3 }}
				xLabel="year →"
			/>
		</div>
	</section>

	<section>
		<h2>Area — and a third</h2>
		<div style="height: 18rem">
			<SeriesPlot {rows} mark="area" markStyle={{ color: '#7f9a4e' }} xLabel="year →" />
		</div>
	</section>

	<section>
		<h2>A mark the package has never heard of</h2>
		<div style="height: 18rem">
			<SeriesPlot {rows} mark={Dots} markStyle={{ color: '#c0392b' }} xLabel="year →" />
		</div>
	</section>

	<section>
		<h2>Short box — the axis label folds onto the tick row</h2>
		<div style="height: 12rem">
			<SeriesPlot {rows} mark="ribbon" markStyle={gold} xLabel="year →" yLabel="↑ tonnes" />
		</div>
	</section>

	<section>
		<h2>Plain ramp legend</h2>
		<PercentLegend colors={RAMP} max={72} />
	</section>
	<section>
		<h2>Classed (steps)</h2>
		<PercentLegend colors={RAMP} max={72} breaks={[6.6, 18.7, 35.6, 58.4]} />
	</section>
	<section>
		<h2>Classed (ticks)</h2>
		<PercentLegend colors={RAMP} max={72} breaks={[6.6, 18.7, 35.6, 58.4]} mode="ticks" />
	</section>
	<section>
		<h2>Opacity-only (flat)</h2>
		<PercentLegend colors={RAMP} max={72} flat opacity={{ min: 0.15, max: 1, breaks: null }} />
	</section>
	<section>
		<h2>Hectares</h2>
		<PercentLegend colors={RAMP} max={1250000} unit="ha" />
	</section>
</main>
