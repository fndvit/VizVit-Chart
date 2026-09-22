# Changelog

All notable changes to `@vit-foundation/chart` are documented here, **one page
per version**, newest first. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

| Version                       | Released   | What it is                                                              |
| ----------------------------- | ---------- | ----------------------------------------------------------------------- |
| [Unreleased](./unreleased.md) | —          | On `main`, not yet in a tagged version                                  |
| [0.2.0](./0.2.0.md)           | 2026-09-22 | A chart and the mark seam: `<SeriesPlot>`, the plot frame, marks        |
| [0.1.0](./0.1.0.md)           | 2026-09-21 | The first extraction: the class-band scale, `<PercentLegend>`, a rename |

Version numbers here describe a **package somebody installs**, so they describe
the API rather than a deployment: MAJOR when an existing import, type or
behaviour changes in a way that breaks a consumer, MINOR for a new entry point
or capability, PATCH for a fix that leaves the surface alone.

Until 1.0.0 the surface is still settling, and a MINOR may narrow it. Pin the
minor if that matters to you.

Versions before `0.1.0` were published under the package's old name,
`@vit-foundation/vizvit-chart`, and are not documented here — `0.0.3` contained
only the `ExampleChart` scaffold.

A released page is history and is never edited again; a correction lands in the
next version's page.
[CONTRIBUTING](https://github.com/fndvit/VizVit-Chart/blob/main/CONTRIBUTING.md#the-changelog-and-cutting-a-version)
has the whole ritual: which page an entry goes on while you work, and what
release day does to this directory.
