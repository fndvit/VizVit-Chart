# The scale

`@vit-foundation/chart/scale` is two functions and about fifty lines. It is also
the reason this package exists.

## The problem it solves

A classed channel paints `k` flat bands, where `k = breaks.length + 1`. Every
piece of code that draws those bands has to agree on what they are — the same
colour for class 3, the same alpha for class 0 — or the picture and its legend
tell the reader two different stories.

In the application this was extracted from, that arithmetic grew **four
readers**: a GPU renderer's stepped visual variables, a CSS hover mirror, the
legend bar, and the legend's tier dots. They had all been reaching into the
_renderer_ module for two lines of colour maths, which is how a legend ended up
depending on a map SDK.

So the arithmetic moved out and became the contract. Both sides call it; neither
side owns it.

## `classColors(colorStops, k)`

`k` discrete colours, one per class, sampled from the ramp in **LAB** at
`i / (k − 1)`.

```ts
import { classColors } from '@vit-foundation/chart/scale';

classColors(['#fff7bc', '#fec44f', '#d95f0e'], 5);
// ['#fff7bc', '#ffdd87', '#fec44f', '#ed9330', '#d95f0e']
```

- Class `0` is the lightest stop and class `k − 1` the darkest, which matches
  the direction [`classOpacities`](#classopacities-k-opmin-opmax) runs in. Low
  values read light and thin; high values read dark and solid.
- LAB rather than sRGB, because sampling a ramp in sRGB puts the perceptual
  midpoint in the wrong place — the middle classes of a three-stop ramp come out
  muddy and unevenly spaced.
- `k === 1` returns the ramp's first stop rather than dividing by zero.
- An empty `colorStops` falls back to a neutral grey ramp (`#cccccc` →
  `#333333`), so a missing ramp renders as legible grey instead of throwing
  inside a render pass.

## `classOpacities(k, opMin, opMax)`

`k` evenly spaced alphas across `[opMin, opMax]`.

```ts
classOpacities(5, 0.2, 1); // [0.2, 0.4, 0.6, 0.8, 1]
// Evenly spaced, in floating point: the third value arrives as 0.6000000000000001.
// Compare with a tolerance, not with `toEqual`.
```

Class `0` gets `opMin`, class `k − 1` gets `opMax`, and the rest are linear
between them — the same direction the colours run in, so the two channels
reinforce each other rather than fighting.

## `k` is the shared number

This is the convention to internalise: **everything here counts classes, not
boundaries.**

```ts
const breaks = [6.6, 18.7, 35.6, 58.4]; // 4 boundaries
const k = breaks.length + 1; // 5 classes
```

Pass that `k` to `classColors` and `classOpacities`, pass those same `breaks` to
the legend, and the bands the legend draws are the bands the renderer paints.
The legend derives `k` from `breaks` itself, which is why it needs the breaks
and not the colours you already computed — given the same two inputs it
recomputes exactly what you did.

Classify a value the same way on both sides:

```ts
const classOf = (v: number) => breaks.filter((b) => v >= b).length; // 0…k−1
```

## Where the breaks come from

Nowhere in this package. `breaks` are an input — ckmeans output, quantiles, an
authored threshold banding, a domain expert's list of round numbers. The scale
module has no opinion about how a domain is cut, only about what a cut domain
looks like once it is cut.

That is deliberate. Break-finding is a statistics question that depends on the
distribution and on editorial judgement; class rendering is arithmetic. Only the
second one belongs in a library that a legend and a renderer both depend on.

## What is not here

- **Anything that describes a _symbol_ rather than a scale.** Size rings, alpha
  tiers, dot legends: those describe symbology, which is map vocabulary, and a
  test in this repo fails the build if that vocabulary reappears in executable
  code. See [CONTRIBUTING](https://github.com/fndvit/VizVit-Chart/blob/main/CONTRIBUTING.md#architectural-rules-the-tooling-enforces).
- **Break-finding.** See above.
- **Colour-blindness checking or contrast scoring.** Judging a ramp is a
  different job from sampling one, and it does not belong in the hot path of a
  render.
