# Contributing to `@vit-foundation/chart`

## Setup

```sh
npm install
npx playwright install chromium   # the component suite runs in a real browser
npm run dev                       # the SvelteKit dev server
npm run dev:docs                  # the documentation site
```

## Everyday commands

| Command              | What it does                                                  |
| -------------------- | ------------------------------------------------------------- |
| `npm test`           | Both Vitest projects: `server` (node) and `client` (chromium) |
| `npm run check`      | `svelte-check` over the whole package                         |
| `npm run lint`       | prettier + eslint                                             |
| `npm run format`     | prettier, writing                                             |
| `npm run storybook`  | Storybook on :6006                                            |
| `npm run docs:build` | Builds the docs site — **fails on a dead link**               |
| `npm run prepack`    | `svelte-package` + `publint`; what `npm publish` runs         |

`npm run lint` is green across the whole repository, scaffold included, and it
is worth keeping that way: once it reports something, the next person stops
reading its output. Format what you add — `npm run format` on your own paths —
rather than letting a repository-wide sweep into your diff, which buries the
change you actually made.

## Where things live

| Path                | What it is                                                  |
| ------------------- | ----------------------------------------------------------- |
| `src/lib/scale/`    | The class-band arithmetic. No Svelte, no DOM.               |
| `src/lib/legend/`   | The bar's arithmetic, plus the one component.               |
| `src/lib/index.ts`  | The barrel. Every subpath is declared in `package.json`.    |
| `src/lib/*.test.ts` | Colocated with what they test.                              |
| `docs/`             | The documentation site. `docs/changelog/` is the changelog. |

A test that mounts a component is `*.svelte.test.ts` and runs in the `client`
project, in real Chromium. Everything else is `*.test.ts` and runs in node. The
split is not a preference: the legend thins its labels by the bar's **measured**
width, and jsdom measures nothing, so a component test there proves less than it
appears to.

## Architectural rules the tooling enforces

`src/lib/libraryBoundary.test.ts` fails the build on five things. This package
was carved out of a map application, so the failure mode is not hypothetical —
a convenient import pulls a map concept, a dataset's column name or a host's
design token back in.

1. **Nothing is imported but `chroma-js` and `svelte`.** The whole argument for
   this package is that a legend does not depend on a renderer; an import that
   makes it depend on anything else needs a better reason than convenience.
2. **Every relative specifier is fully spelled out** (`./percentBar.js`, not
   `./percentBar`). Node does not guess extensions, and `svelte-package` emits
   relative specifiers verbatim. Left bare, they build here and are unimportable
   from the published package — and `publint` does not catch it.
3. **No map vocabulary in executable code** (`basemap`, `arcgis`, `maplibre`,
   `h3`, `geojson`, `latitude`, `tier`, …). A legend describes a _scale_.
   Comments may cite anything; the rule is about what the code names.
4. **No dataset vocabulary in executable code** (the source project's crop, soil
   and provider names). A library that knows a column name is one dataset's
   library.
5. **No CSS framework classes or host design tokens** in a `class="…"`
   attribute. Presentation is `--vit-legend-*` custom properties with real
   fallbacks. The component shipped with Tailwind utilities and the host app's
   own tokens once, which made it unstyleable anywhere else.

## Writing doc comments

Every module opens with `@module` and a paragraph on what it owns and why. Every
exported function, type and component prop carries JSDoc with `@param`,
`@returns` or `@property`. Comments explain the _why_ — a reader can see the
what.

The doc comments and `docs/` answer different questions and both are load-bearing:
the comment tells you why this line is like this, the page tells a consumer what
the package is for. A change that alters behaviour updates both, in the same
pull request.

## Verify in a browser before you claim it renders

A passing test suite proves the arithmetic is right, never that the thing looks
correct. The legend's whole job is visual — band edges, label collisions, a bar
that must not change length when its max label goes from `9%` to `100%`. Look at
it.

## The changelog, and cutting a version

The changelog is **one page per version**, in
[`docs/changelog/`](./docs/changelog/index.md), newest first on
[its index](./docs/changelog/index.md). The root `CHANGELOG.md` is a pointer at
that directory, not a copy — the sidebar is derived from the directory listing
(`docs/.vitepress/config.ts`), so a new page appears there the moment it is
written and the list cannot go stale. It follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**While you work**, add the entry to
[`docs/changelog/unreleased.md`](./docs/changelog/unreleased.md) in the same PR
as the change, under one of Keep a Changelog's types — `Added`, `Changed`,
`Deprecated`, `Removed`, `Fixed`, `Security` — or `Other (dependencies, CI,
tools…)` for things a consumer never sees. Three rules keep a page readable:

- **One fact, one entry.** If a type already has an entry for the thing you
  changed, edit it so it describes the end state. Appending a second bullet is
  how a release ends up contradicting itself.
- **One `##` heading per type per page.**
- **Write what changed for the consumer.** An internal refactor with no visible
  effect belongs in the git history, not here. A change that needs action on
  upgrade carries an **Upgrading:** paragraph.

**What the version number means here.** This is a package somebody installs, so
the number describes the API, not a deployment: MAJOR when an existing import,
type or behaviour breaks a consumer; MINOR for a new entry point or capability;
PATCH for a fix that leaves the surface alone. Before 1.0.0 the surface is still
settling and a MINOR may narrow it — say so in the entry when it does.

**On release day**, in one commit (`chore(release): x.y.z`):

1. Read `unreleased.md` once as a whole and merge what individual PRs restated —
   it is written over weeks and read in a minute.
2. `git mv docs/changelog/unreleased.md docs/changelog/x.y.z.md`. Retitle it
   `# x.y.z`, date it, and point its compare link at the tag range rather than
   at `main`.
3. Write a fresh `docs/changelog/unreleased.md` with the same header and no
   entries. Copy the one you just renamed; do not invent a new shape.
4. Add the row to `docs/changelog/index.md` — version, date, one line on what
   the release is.
5. Bump `version` in `package.json` to match.
6. `npm run docs:build`. It fails on a dead link, which catches a mistyped
   filename in the index before a reader finds it.
7. Tag `vx.y.z` and push the tag. GitHub's release notes are the page you just
   cut, pasted — there is no automation between the two.

**Then publish**, after running the gate by hand:

```sh
npm run lint && npm run check && npm test   # the gate
npm publish                                 # prepack → publish
```

Publishing is manual on purpose. An npm release is effectively permanent —
unpublish is unavailable after 72 hours — so it is a decision somebody makes,
not a thing a merge does.

## Reporting issues

<https://github.com/fndvit/VizVit-Chart/issues>
