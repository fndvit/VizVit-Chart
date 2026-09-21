# Reference

Four entry points. They exist so a leaf component can import the one symbol it
needs without pulling the whole graph — and so the two pure-arithmetic modules
stay importable from plain Node, with no Svelte anywhere in the path.

**Rule of thumb:** import the narrow subpath in a component, a helper or a
script; reach for the barrel only from app-level code in a project that already
has a Svelte-aware bundler.

## Find it by task

| You want to…                           | Import from              |
| -------------------------------------- | ------------------------ |
| Colour a class the way the legend does | `…/scale`                |
| Put a legend on screen                 | `…/PercentLegend.svelte` |
| Build your own bar                     | `…/legend`               |
| Format one break value                 | `…/legend`               |
| Compute a gradient outside a browser   | `…/legend`               |
| Everything, in an app that can take it | `@vit-foundation/chart`  |

## The entry points

### `@vit-foundation/chart/scale`

```ts
function classColors(colorStops: string[], k: number): string[];
function classOpacities(k: number, opMin: number, opMax: number): number[];
```

The class-band arithmetic — one colour and one alpha per class, both running
light/thin → dark/solid. The smallest module here and the one everything else
agrees through. No Svelte, no DOM. See [the scale](./scale.md).

### `@vit-foundation/chart/legend`

```ts
function axisMaxOf(spec: Pick<PercentBarSpec, 'max'>): number;
function maxLabelOf(spec: Pick<PercentBarSpec, 'max' | 'unit'>): string;
function formatBreak(n: number): string;
function bandEdges(breaks: number[], axisMax: number): number[];
function pickLabels(
	cands: { pct: number; label: string }[],
	barWidth: number,
	maxLabels: number
): Set<number>;
function ticksOf(spec: PercentBarSpec, barWidth: number, maxLabels: number): Tick[];
function barGradient(spec: PercentBarSpec, tickCount: number): string;

type OpacitySpec = { min: number; max: number; breaks: number[] | null };
type PercentBarSpec = {
	colors: string[];
	max?: number | null;
	unit?: 'ha' | 'pct';
	breaks?: number[] | null;
	opacity?: OpacitySpec | null;
	flat?: boolean;
	mode?: 'ticks' | 'steps';
};
type Tick = { value: number; pct: number; label: string; labeled: boolean };
```

The percent legend's whole computation: axis scaling, band edges, label
thinning, and the CSS gradient. No Svelte, no DOM — it runs in a test, in Node,
or under any framework. See
[the arithmetic on its own](./legend.md#the-arithmetic-on-its-own).

### `@vit-foundation/chart/PercentLegend.svelte`

The component, by direct path — for a lazy `import()` that should not drag the
barrel with it, and for any consumer that wants the legend without the rest.
Props are on [the legend](./legend.md#props).

### `@vit-foundation/chart`

The barrel: everything above, plus `PercentLegend` and `ExampleChart` as named
exports. Because it re-exports components, importing it requires a Svelte-aware
bundler.

## `ExampleChart`

The `0.0.x` scaffold, still exported from the barrel and otherwise untouched. It
is not part of what this package is _for_ — it predates the argument the rest of
the package makes — and it is documented here only so that nobody reads its
absence from these pages as a removal. Nothing depends on it staying.

## What is deliberately not here

Named so that the next person does not go looking:

- **Break-finding.** ckmeans, quantiles, Jenks. `breaks` are an input; how a
  domain is cut is a statistics-and-editorial question. See
  [the scale](./scale.md#where-the-breaks-come-from).
- **Symbol legends.** Size rings, alpha tiers, dot swatches. Those describe
  symbology rather than a scale, which is map vocabulary — and a test fails the
  build if that vocabulary reappears in executable code.
- **Bespoke one-off graphics.** A chart built for one story is not a library.
