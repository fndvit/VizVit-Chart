# @vit-foundation/chart

Charts, the scales behind them, and the legends that describe them.

Two ideas hold the package together.

**A renderer that paints classed data and a legend that explains it must agree
on what a class is.** `classColors` / `classOpacities` are that agreement for the
colour channel, and `weightRange` is the same agreement for a thickness channel.
Hand both sides the same function and they cannot drift.

**A chart's geometry and its appearance are different things.** A chart resolves
its box into a _plot frame_ — margins, scales, tick counts, which labels fit —
and a _mark_ decides what the series looks like in it. Adding a visual style is
one small component, never a branch inside a chart.

> Extracted from the National Geographic _Food for Tomorrow_ explore globe,
> where the same arithmetic already had four readers — a GPU renderer's stepped
> visual variables, a CSS hover mirror, the legend bar and the tier dots — and
> drift between them was the standing hazard.

It knows nothing about maps and nothing about any dataset. Two dependencies
(`chroma-js`, `d3-scale`) and one peer (`svelte`, for the components).

## Install

```sh
npm install @vit-foundation/chart
```

## A chart

```svelte
<script>
	import SeriesPlot from '@vit-foundation/chart/SeriesPlot.svelte';

	const rows = [
		{ x: 2000, y: 326121011, weight: 4804500 },
		{ x: 2001, y: 344292922, weight: 4957900 }
		// …
	];
</script>

<div style="height: 50vh">
	<SeriesPlot
		{rows}
		mark="ribbon"
		markStyle={{ color: '#FFD700', outlineColor: '#d9b700', outlineWidth: 2 }}
		yLabel="↑ million tonnes"
		xLabel="year →"
		legend={{ title: 'Area harvested' }}
	/>
</div>
```

Rows are `{ x, y, weight }` — deliberately not a dataset's column names. The
chart draws what it is given and fetches nothing, so the same component serves a
CSV, an API and a fixture.

## Marks

`mark` takes a name from the built-in table **or a component of your own**:

| name     | draws                                    |
| -------- | ---------------------------------------- |
| `ribbon` | a curve whose thickness follows `weight` |
| `line`   | a plain constant-width curve             |
| `area`   | a filled area down to the baseline       |

A mark is an ordinary Svelte component handed `{ frame, rows, extents, style }`.
It renders SVG into the plotting area and derives nothing: the frame already
resolved every measurement. Nothing in the package enumerates the marks, so a new
style never edits a file you do not own:

```svelte
<!-- Dots.svelte -->
<script>
	let { frame, rows, style } = $props();
</script>

{#each rows as r (r.x)}
	<circle cx={frame.x(r.x)} cy={frame.y(r.y)} r="3" fill={style.color} />
{/each}
```

```svelte
<SeriesPlot {rows} mark={Dots} />
```

## Hover

The chart owns hit-testing, because it is the only thing that knows which row a
pointer is over. It does not own the card — `onhover` reports the row and the
point, and the host draws whatever its design system draws.

```svelte
<SeriesPlot {rows} onhover={(row, point) => (tip = { row, point })} onleave={() => (tip = null)} />
```

## The scale

```ts
import { classColors, classOpacities } from '@vit-foundation/chart/scale';

const k = breaks.length + 1;
classColors(['#fff7bc', '#fec44f', '#d95f0e'], k); // one hex per class, light→dark
classOpacities(k, 0.2, 1); // one alpha per class, low→high
```

Hand the **same ramp and the same `k`** to whatever paints the data, and the
legend and the rendering cannot disagree.

## The legend

```svelte
<script>
	import PercentLegend from '@vit-foundation/chart/PercentLegend.svelte';
</script>

<PercentLegend colors={RAMP} max={72} breaks={[6.6, 18.7, 35.6, 58.4]} />
```

`breaks` classes the colour channel; `opacity` classes (or ramps) the alpha
channel; the two composite independently, so mismatched break sets still render
correctly. `flat` is the opacity-only variant — the bar holds the darkest ramp
colour and lets alpha carry the value. `mode="ticks"` draws break marks instead
of hard-edged bands.

The arithmetic is exported separately, so you can build your own bar:

```ts
import { bandEdges, barGradient, pickLabels, ticksOf } from '@vit-foundation/chart/legend';
```

## Theming

The component ships plain CSS with custom-property hooks, so it renders
standalone and restyles without a CSS framework:

| property                       | default        |
| ------------------------------ | -------------- |
| `--vit-legend-font`            | `inherit`      |
| `--vit-legend-label-color`     | `currentColor` |
| `--vit-legend-label-size`      | `0.75rem`      |
| `--vit-legend-tick-size`       | `0.625rem`     |
| `--vit-legend-stroke`          | `#424c5c`      |
| `--vit-legend-bar-height`      | `0.375rem`     |
| `--vit-legend-max-label-width` | `3.5rem`       |

The chart components read their own set:

| property                     | default        |
| ---------------------------- | -------------- |
| `--vit-chart-font`           | `inherit`      |
| `--vit-chart-axis-color`     | `currentColor` |
| `--vit-chart-grid-color`     | `#cacaca`      |
| `--vit-chart-grid-opacity`   | `0.5`          |
| `--vit-chart-hatch-color`    | `#00000020`    |
| `--vit-chart-highlight-ring` | `#ffffff`      |

## Subpaths

Import the narrow subpath, not the barrel:

| subpath                                      | holds                                  |
| -------------------------------------------- | -------------------------------------- |
| `@vit-foundation/chart/plot`                 | the plot frame + axis rules, no DOM    |
| `@vit-foundation/chart/series`               | the row contract and extents, no DOM   |
| `@vit-foundation/chart/marks`                | the mark contract, registry and kernel |
| `@vit-foundation/chart/scale`                | `classColors`, `classOpacities`        |
| `@vit-foundation/chart/legend`               | the bar arithmetic, no Svelte, no DOM  |
| `@vit-foundation/chart/SeriesPlot.svelte`    | the chart                              |
| `@vit-foundation/chart/PercentLegend.svelte` | the colour-scale legend                |
| `@vit-foundation/chart/WeightWedge.svelte`   | the thickness key                      |
| `@vit-foundation/chart/PlotAxes.svelte`      | grid, ticks and axis labels            |

The two `.ts` subpaths run in plain Node. The barrel (`@vit-foundation/chart`)
re-exports the component, so it needs a Svelte-aware bundler — reach for it only
from an app that has one.

## Scope

In: charts built on the plot-frame + mark seam, colour-scale arithmetic, and the
legends that depict either.

Out: anything that describes a _symbol_ rather than a scale or a mark (size
rings, alpha tiers — those are map vocabulary), and anything that knows where
data came from. Loading, parsing and a dataset's column names stay in the app.

This section used to read "a chart you built for one story is not a library",
which was the right rule for a chart with no seam in it: generalising one story's
graphic by adding props gives you a component with thirty of them and one caller.
The line moved on 2026-09-21 because the mark seam changes the economics — the
package holds the frame and the contract, and a style is a component anyone can
write without touching this repo.

## Documentation

The full site lives in [`docs/`](./docs/index.md) and is served by
`npm run dev:docs`:

- **[Getting started](./docs/getting-started.md)** — install, the subpaths, a legend on screen
- **[The scale](./docs/scale.md)** — class bands, and the contract they hold
- **[The legend](./docs/legend.md)** — the two channels, the modes, theming
- **[Reference](./docs/reference.md)** — every entry point and what it exports
- **[Changelog](./docs/changelog/index.md)** — one page per version, newest first

[CONTRIBUTING](./CONTRIBUTING.md) has the setup, the rules the tooling enforces,
and the release ritual.

## Package name

This package was published as `@vit-foundation/vizvit-chart` up to `0.0.3`,
which contained only the `ExampleChart` scaffold. It is `@vit-foundation/chart`
from `0.1.0`. `ExampleChart` is still exported from the barrel; nothing was
removed.

## License

Apache-2.0
