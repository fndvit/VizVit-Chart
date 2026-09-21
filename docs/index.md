# @vit-foundation/chart

**Colour scales and the legends that describe them.** Two things live here, and
they are one package for one reason: a renderer that paints classed data and a
legend that explains it must agree on what a class _is_. `classColors` /
`classOpacities` are that agreement; everything else is the bar that draws it.

Extracted from the National Geographic _Food for Tomorrow_ explore globe, where
the same arithmetic already had four readers and drift between them was the
standing hazard.

It knows nothing about maps and nothing about any dataset. One dependency
(`chroma-js`) and one peer (`svelte`, and only for the component).

## Start here

|                                         |                                                             |
| --------------------------------------- | ----------------------------------------------------------- |
| [Getting started](./getting-started.md) | Install, the subpaths, and a legend on screen               |
| [The scale](./scale.md)                 | Class bands, and why the legend and the renderer share them |
| [The legend](./legend.md)               | The bar's two channels, its modes, and theming              |
| [Reference](./reference.md)             | Every entry point, what it exports, and when to import it   |
| [Changelog](./changelog/)               | What has landed, one page per version, newest first         |

## If you are new

1. **[Getting started](./getting-started.md)** — five minutes to a rendered
   legend, and the one decision you cannot avoid (which subpath).
2. **[The scale](./scale.md)** next, even if all you wanted was the bar. The
   two functions there are the contract the whole package exists to hold, and
   the section on **`k` is the shared number** is what keeps a legend honest.
3. **[The legend](./legend.md)** when you are placing the component, or writing
   your own bar on top of the exported arithmetic.
4. **[Reference](./reference.md)** is not for reading front to back — it is
   where you look up which entry point holds a symbol.

## The shape of it, in one picture

```
              breaks (k−1 boundary values)  ──►  k = breaks.length + 1
                                                     │
                     ┌───────────────────────────────┴───────────────────────┐
                     ▼                                                       ▼
      classColors(ramp, k)  ·  classOpacities(k, min, max)        classColors(ramp, k)
                     │            @vit-foundation/chart/scale                │
                     ▼                                                       ▼
        whatever paints the data                                  percentBar → one CSS
   (a GPU renderer, a choropleth, a CSS hover mirror)             linear-gradient string
                                                                             │
                                                                             ▼
                                                                    <PercentLegend>
```

Nothing below the scale line knows what is above it. That is the whole idea:
hand the **same ramp and the same `k`** to both sides and the picture and its
legend cannot disagree — not because someone kept them in sync, but because
there is only one piece of arithmetic.

## Three conventions worth knowing before you start

- **`k` classes, `k − 1` breaks.** Every function here counts classes, not
  boundaries. A `breaks` array of length 4 describes 5 bands, and the `k` you
  pass the renderer is the `breaks.length + 1` you passed the legend.
- **The two channels composite independently.** `breaks` classes the colour
  channel and `opacity` classes (or ramps) the alpha channel. They are resolved
  separately and cut together, so mismatched break sets still render correctly
  rather than one silently overriding the other.
- **Presentation is custom properties, not utility classes.** The component
  ships plain CSS with `--vit-legend-*` hooks and real fallbacks, so it renders
  standalone and restyles without adopting a CSS framework or a host's design
  tokens.
