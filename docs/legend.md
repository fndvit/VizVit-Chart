# The legend

`<PercentLegend>` is a horizontal ramp bar from `0` to the domain max, with
optional class breaks drawn as hard-edged bands (or as ticks), and the break
values written along the axis wherever they fit.

It describes a **colour scale**, not a map. The same bar sits under a
choropleth, a heatmap, a histogram or a globe.

```svelte
<script lang="ts">
	import PercentLegend from '@vit-foundation/chart/PercentLegend.svelte';
</script>

<PercentLegend colors={RAMP} max={72} breaks={[6.6, 18.7, 35.6, 58.4]} />
```

## Props

| prop        | type                           | default   | what it does                                                          |
| ----------- | ------------------------------ | --------- | --------------------------------------------------------------------- |
| `colors`    | `string[]`                     | required  | Ramp stops, low→high (left→right)                                     |
| `max`       | `number \| null`               | `100`     | Real domain max; sets the axis and the high-end label                 |
| `unit`      | `'pct' \| 'ha'`                | `'pct'`   | Drives the high-end label's suffix                                    |
| `breaks`    | `number[] \| null`             | `null`    | Class boundaries for the **colour** channel; `null` = smooth ramp     |
| `opacity`   | `{ min, max, breaks } \| null` | `null`    | The **alpha** channel; `null` = opaque                                |
| `flat`      | `boolean`                      | `false`   | Constant darkest colour — alpha alone carries the value               |
| `mode`      | `'steps' \| 'ticks'`           | `'steps'` | Classes as hard-edged bands, or as marks over a smooth bar            |
| `maxLabels` | `number`                       | `3`       | Cap on written boundary values; `Infinity` writes every one that fits |
| `class`     | `string`                       | `''`      | Appended to the container's class list                                |

## Two channels, composited independently

The bar has a colour channel and an alpha channel, and each one is classed or
continuous on its own terms.

| you pass                                            | colour channel     | alpha channel     |
| --------------------------------------------------- | ------------------ | ----------------- |
| `colors` only                                       | smooth ramp        | opaque            |
| `colors`, `breaks`                                  | `k` solid bands    | opaque            |
| `colors`, `opacity` with `breaks: null`             | smooth ramp        | linear min→max    |
| `colors`, `breaks`, `opacity` with its own `breaks` | `k` bands          | its own bands     |
| `flat`, `opacity`                                   | darkest stop, flat | carries the value |

They are resolved separately and then cut together: the gradient is split at
every band edge and keyframe of **both** channels, and a stop is emitted at each
end of every segment. A classed channel holds one value across its segment — the
CSS hard-stop idiom — while a continuous one keeps blending through it.

The practical consequence is that the two break sets do **not** have to match.
Give the colour channel ckmeans breaks and the alpha channel a coarser authored
banding and you get exactly that picture, rather than one channel silently
winning.

### `flat`

The opacity-only variant: the bar holds the ramp's darkest colour from end to
end and lets alpha carry the value. Use it when colour is already spoken for —
when hue encodes a category and the scale has only intensity left to say.

### `mode`

- `'steps'` (the default) paints the classes as hard-edged bands.
- `'ticks'` keeps the smooth ramp and draws a 1px mark at each boundary.

A bar in `'steps'` mode with no visible tick falls back to the smooth ramp, so a
break set that lands entirely outside the axis degrades to something legible
rather than to one flat colour.

## The axis and its labels

The axis runs `0 → max`. `max` must be positive and finite or it falls back to
`100`, so a legend bound to a field that has not loaded yet renders a sane
percentage axis instead of an inverted or infinite one.

The **high-end label** depends on `unit`:

- `'pct'` clamps to a whole `1–100` and appends `%`. A domain max of `72.4`
  reads `72%`.
- `'ha'` shows the raw domain max compactly formatted — `1.2M ha` — because a
  hectare count is a real quantity and clamping it to 100 would be a lie.

**Break values** under `10` keep one decimal; from `10` up they are rounded to
whole numbers. Whole-percent rounding everywhere would collide on skewed fields,
whose first two or three ckmeans breaks often sit within a point of zero and of
each other.

### Label thinning

Every break keeps its tick. At most `maxLabels` of them get their value written
out, because ckmeans breaks cluster and a legend is often only ~100px wide.

The choice is not "the first three". `pickLabels` takes the largest subset up to
`maxLabels` whose neighbouring labels do not overlap at the bar's measured
width, and among those the one with the widest _narrowest_ gap across the whole
rendered row — the fixed `0` and max labels included. The values spread across
the axis instead of clumping at one end.

This needs the rendered width, so the component measures itself
(`bind:clientWidth`) and hands the number to the arithmetic. Before the first
measurement the width is `0`, which means "nothing collides" and lets the
spread alone decide — the first paint is already spread correctly, and the
measured pass only removes labels that turned out not to fit.

## Theming

Presentation is CSS custom properties with real fallbacks, so the component
renders standalone and restyles without a CSS framework or a host's design
tokens:

| property                       | default        |
| ------------------------------ | -------------- |
| `--vit-legend-font`            | `inherit`      |
| `--vit-legend-label-color`     | `currentColor` |
| `--vit-legend-label-size`      | `0.75rem`      |
| `--vit-legend-tick-size`       | `0.625rem`     |
| `--vit-legend-stroke`          | `#424c5c`      |
| `--vit-legend-bar-height`      | `0.375rem`     |
| `--vit-legend-max-label-width` | `3.5rem`       |

```css
.dark-panel {
	--vit-legend-label-color: #e6e6e6;
	--vit-legend-stroke: #8a94a6;
	--vit-legend-bar-height: 0.5rem;
}
```

The class names are BEM-ish and stable — `.vit-legend`, `__end`, `__track`,
`__bar`, `__tick`, `__tick-label` — so a host that needs more than the
properties offer has something to select. The max label is fixed-width and
left-aligned on purpose: `9%`, `89%` and `100%` must not change the bar's
length, or a legend that re-renders on a filter change jitters.

## The arithmetic on its own

`@vit-foundation/chart/legend` holds the whole computation, with no Svelte and
no DOM. It exists as its own module for a plain reason: all of it used to live
in `$derived` blocks inside the component, so the only way to test ~190 lines of
arithmetic was to mount the component and regex-parse `style.background`.

The interface is a `PercentBarSpec` in, numbers and one gradient string out.

| function                                 | answers                                           |
| ---------------------------------------- | ------------------------------------------------- |
| `axisMaxOf(spec)`                        | The positive, finite axis maximum (default `100`) |
| `maxLabelOf(spec)`                       | The high-end label, `%`-clamped or unit-formatted |
| `formatBreak(n)`                         | One break value, formatted                        |
| `bandEdges(breaks, axisMax)`             | `[0, …break positions, 100]` in axis %            |
| `pickLabels(cands, barWidth, maxLabels)` | Which candidate ticks get their value written     |
| `ticksOf(spec, barWidth, maxLabels)`     | The visible ticks, each flagged `labeled`         |
| `barGradient(spec, tickCount)`           | One `linear-gradient(to right, …)` string         |

Two behaviours are worth knowing before you build on them:

- **`bandEdges` clamps and forces monotonicity.** A break past the axis max
  collapses its band to zero width instead of inverting the ramp, and
  `barGradient` skips zero-width segments rather than emitting a degenerate
  stop.
- **`ticksOf` drops boundaries at or outside the axis.** Only `0 < b < axisMax`
  survives — a tick at either end would be drawn on top of the fixed `0` and max
  labels.

`barGradient` takes `tickCount` rather than deriving it, because "is this bar
classed?" and "does it have a visible class boundary?" are different questions,
and the component already knows the answer to the second.
