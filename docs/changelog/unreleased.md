---
title: Unreleased
---

# Unreleased

What is on `main` and not yet in a tagged version. When it ships, this page is
renamed to its version and a new, empty one takes its place — see
[all releases](./index.md).

[Compare against the last release on GitHub](https://github.com/fndvit/VizVit-Chart/compare/v0.1.0...main)

## Added

- **A chart, and the seam that makes a new style cheap.** `<SeriesPlot>` draws a
  series of `{ x, y, weight }`; a **mark** decides what it looks like. `mark`
  takes a built-in name (`ribbon`, `line`, `area`) **or a component of your
  own**, so a new visual style is one file outside this package and no branch
  inside it.
- `@vit-foundation/chart/plot` — `computePlotFrame(box, xExtent, yExtent)`
  resolves margins, scales and tick counts from the box before anything draws,
  plus the axis-tick rules (`visibleXTicks`, `estimateTextWidth`,
  `formatCompact`, `formatInteger`).
- `@vit-foundation/chart/series` — the row contract (`isSeriesRow`) and
  `seriesExtents`, so one `NaN` is dropped by a loader instead of collapsing a
  scale and blanking the chart.
- `@vit-foundation/chart/marks` — the `MarkProps` contract, the `MARKS`
  registry, and `sampleCurve` / `catmullRomPoint`: the variable-width curve
  kernel, which had never been callable outside a live SVG and is now covered
  by its own tests.
- `weightRange(frame, style)` — the thickness analogue of `classColors`: the
  mark and the legend swatch read the same function, so a swatch cannot
  advertise a width the curve never draws.
- `<WeightWedge>` (the thickness key) and `<PlotAxes>` (grid, ticks, axis
  labels) as their own subpaths.
- Chart theming tokens: `--vit-chart-font`, `--vit-chart-axis-color`,
  `--vit-chart-grid-color`, `--vit-chart-grid-opacity`, `--vit-chart-hatch-color`,
  `--vit-chart-highlight-ring`.

## Removed

- `ExampleChart` — a placeholder with a one-line README, reachable only through
  the barrel and written in Svelte 4 syntax. `<SeriesPlot>` is what the slot was
  being held for.
- `@vitfoundation/test` from `dependencies`. It arrived with the project
  skeleton, was imported nowhere, and every consumer of this package was
  installing it for nothing.

## Changed

- **Scope.** The README used to say "a chart you built for one story is not a
  library". The mark seam changes that trade, and the section now says why.
- `d3-scale` is a dependency (the only new one), and the packaging boundary test
  names it alongside `chroma-js` and `svelte`.
