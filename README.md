# @vit-foundation/chart

Colour scales and the legends that describe them.

Two things live here, and they are one package for one reason: **a renderer that
paints classed data and a legend that explains it must agree on what a class
is.** `classColors` / `classOpacities` are that agreement; everything else is the
bar that draws it.

> Extracted from the National Geographic _Food for Tomorrow_ explore globe,
> where the same arithmetic already had four readers — a GPU renderer's stepped
> visual variables, a CSS hover mirror, the legend bar and the tier dots — and
> drift between them was the standing hazard.

It knows nothing about maps, and nothing about any dataset. One dependency
(`chroma-js`) and one peer (`svelte`, only for the component).

## Install

```sh
npm install @vit-foundation/chart
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

## Subpaths

Import the narrow subpath, not the barrel:

| subpath                                      | holds                                 |
| -------------------------------------------- | ------------------------------------- |
| `@vit-foundation/chart/scale`                | `classColors`, `classOpacities`       |
| `@vit-foundation/chart/legend`               | the bar arithmetic, no Svelte, no DOM |
| `@vit-foundation/chart/PercentLegend.svelte` | the component                         |

The two `.ts` subpaths run in plain Node. The barrel (`@vit-foundation/chart`)
re-exports the component, so it needs a Svelte-aware bundler — reach for it only
from an app that has one.

## Scope

In: colour-scale arithmetic and the legends that depict it.

Out: anything that describes a _symbol_ rather than a scale (size rings, alpha
tiers — those are map vocabulary), and bespoke one-off graphics. A chart you
built for one story is not a library.

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
