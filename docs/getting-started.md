# Getting started

## Install

```sh
npm install @vit-foundation/chart
```

`svelte` ^5 is a peer, and it is only needed for the component. `chroma-js` is
the package's one runtime dependency and comes with it.

::: tip Renaming note
This package was published as `@vit-foundation/vizvit-chart` up to `0.0.3`,
which contained only the `ExampleChart` scaffold. It is `@vit-foundation/chart`
from `0.1.0` onwards. See [the 0.1.0 release](./changelog/0.1.0.md).
:::

## The one decision: which subpath

Import the narrow subpath, not the barrel.

| subpath                                      | holds                                 | needs Svelte |
| -------------------------------------------- | ------------------------------------- | ------------ |
| `@vit-foundation/chart/scale`                | `classColors`, `classOpacities`       | no           |
| `@vit-foundation/chart/legend`               | the bar arithmetic, no Svelte, no DOM | no           |
| `@vit-foundation/chart/PercentLegend.svelte` | the component                         | yes          |
| `@vit-foundation/chart`                      | all of the above, re-exported         | yes          |

The two `.ts` subpaths run in plain Node — a build step, a test, a server
render, a script that emits colours for something that is not a browser at all.
The barrel re-exports the component, so reaching for it drags a Svelte-aware
bundler into whatever imports it. Reach for the barrel only from an app that
already has one.

## A legend on screen

```svelte
<script lang="ts">
	import PercentLegend from '@vit-foundation/chart/PercentLegend.svelte';

	const RAMP = ['#fff7bc', '#fec44f', '#d95f0e'];
</script>

<PercentLegend colors={RAMP} max={72} breaks={[6.6, 18.7, 35.6, 58.4]} />
```

That is a bar from `0` to `72%`, cut into **five** hard-edged colour bands by
four break values, with the break values written along the axis wherever they
fit. Drop `breaks` and you get a smooth ramp; add `mode="ticks"` and the classes
are drawn as break marks over a smooth bar instead of as bands.

The component measures its own rendered width and thins the written labels to
fit, so it behaves in a 100px sidebar and in a 900px panel without being told
which one it is in.

## The same classes, on whatever paints the data

This is the part that earns the package. Whatever renders your data — a GPU
renderer's stepped visual variables, a CSS hover state, an SVG choropleth — asks
the scale module for the same colours the legend just drew:

```ts
import { classColors, classOpacities } from '@vit-foundation/chart/scale';

const breaks = [6.6, 18.7, 35.6, 58.4];
const k = breaks.length + 1; // 5 classes

const colors = classColors(RAMP, k); // ['#fff7bc', …, '#d95f0e'], light→dark
const alphas = classOpacities(k, 0.2, 1); // [0.2, 0.4, 0.6, 0.8, 1], low→high

const classOf = (v: number) => breaks.filter((b) => v >= b).length;
fill(colors[classOf(value)], alphas[classOf(value)]);
```

Hand the **same ramp and the same `k`** to both sides and the two cannot
disagree. [The scale](./scale.md) is the whole argument for why this is one
function call and not two implementations.

## Building your own bar

The legend's arithmetic is exported on its own, with no Svelte and no DOM, so a
bar you draw yourself — in SVG, on a canvas, in another framework — can be the
same bar:

```ts
import { axisMaxOf, bandEdges, barGradient, ticksOf } from '@vit-foundation/chart/legend';

const spec = { colors: RAMP, max: 72, breaks: [6.6, 18.7, 35.6, 58.4] };

axisMaxOf(spec); // 72
bandEdges(spec.breaks, 72); // band edges in axis %: [0, 9.17…, 25.97…, 49.44…, 81.11…, 100]
ticksOf(spec, 240, 3); // the boundary ticks, each flagged `labeled` or not
barGradient(spec, 4); // 'linear-gradient(to right, …)'
```

See [the legend](./legend.md#the-arithmetic-on-its-own) for what each of those
answers and what it deliberately does not.
