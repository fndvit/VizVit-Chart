/**
 * @module legend/percentBar
 *
 * The percent legend's arithmetic, with no Svelte and no DOM: axis scaling,
 * class band edges, label thinning, and the CSS gradient the bar paints.
 *
 * ## Why this exists
 * All of this used to live in `$derived` blocks inside `PercentLegend.svelte`,
 * which meant the only way to test ~190 lines of arithmetic was to mount the
 * component and regex-parse `style.background` — the test's `stops()`, `px()`
 * and `rgb()` helpers existed purely to defeat serialization differences
 * between jsdom and chroma. The CSS string was the test surface.
 *
 * Now the interface is: a {@link PercentBarSpec} in, numbers and one gradient
 * string out. The component measures its own width, passes it in, and renders.
 *
 * Everything here is meant to mirror whatever renders the data: `classColors` and
 * `classOpacities` come from {@link ../scale/classBands}, so a renderer given
 * the same ramp and the same `k` paints exactly the classes this bar depicts.
 * That is the point of the two modules being in one package.
 */

import chroma from 'chroma-js';
import { classColors, classOpacities } from '../scale/classBands.js';

/** The opacity channel's alpha ramp; `breaks` classes it, `null` keeps it smooth. */
export type OpacitySpec = { min: number; max: number; breaks: number[] | null };

/** Everything the bar needs to resolve itself. */
export type PercentBarSpec = {
	/** Ramp stops, low→high (left→right). */
	colors: string[];
	/** Real domain max for the high-end label; nullish falls back to 100 (or 0 for `ha`). */
	max?: number | null;
	/** Field unit — drives the high-end label suffix. */
	unit?: 'ha' | 'pct';
	/** ckmeans class-boundary values; `null` = plain gradient. */
	breaks?: number[] | null;
	/** Opacity channel; `null` = opaque. */
	opacity?: OpacitySpec | null;
	/** Variant B: constant darkest colour, alpha encodes the value. */
	flat?: boolean;
	/** Class depiction. */
	mode?: 'ticks' | 'steps';
};

/** One boundary value on the axis. */
export type Tick = {
	/** The break's own value, in domain units. */
	value: number;
	/** Its position along the axis, 0–100. */
	pct: number;
	/** The formatted value. */
	label: string;
	/** Whether this tick's value is written out (see {@link pickLabels}). */
	labeled: boolean;
};

/** Digit advance at `text-[10px] tabular-nums`. */
const LABEL_CHAR_PX = 6;
/** Clear space kept between neighbouring labels. */
const LABEL_PAD_PX = 4;
/** Combinatorial guard; ckmeans class counts are tiny. */
const MAX_SUBSET_SCAN = 4000;

/**
 * Axis max for positioning ticks — the same value the high-end label reflects.
 *
 * @param spec - The bar spec.
 * @returns A positive finite max, defaulting to 100.
 */
export function axisMaxOf(spec: Pick<PercentBarSpec, 'max'>): number {
	const { max } = spec;
	return max != null && Number.isFinite(max) && max > 0 ? max : 100;
}

/**
 * The high-end label: percent clamps to a sane 1–100 whole percent + `%`; other
 * units show the raw domain max, compactly formatted, + unit.
 *
 * @param spec - The bar spec.
 */
export function maxLabelOf(spec: Pick<PercentBarSpec, 'max' | 'unit'>): string {
	const { max, unit = 'pct' } = spec;
	const m = max != null && Number.isFinite(max) ? max : unit === 'ha' ? 0 : 100;
	if (unit === 'ha') {
		return `${m.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 1 })} ha`;
	}
	return `${Math.min(100, Math.max(1, Math.round(m)))}%`;
}

/**
 * Format one break value. Values under 10 keep one decimal — whole-percent
 * rounding would collide on skewed fields whose first breaks sit near zero.
 *
 * @param n - The break value.
 */
export function formatBreak(n: number): string {
	return n.toLocaleString(undefined, { maximumFractionDigits: n >= 10 ? 0 : 1 });
}

/**
 * Band edges in axis % for the `breaks.length + 1` classes `breaks` delimits:
 * `[0, ...break positions, 100]`. Positions are clamped and forced monotonic,
 * so a break sitting past the axis max collapses its band to zero width instead
 * of inverting the ramp.
 *
 * @param breaks - Class boundary values, in domain units.
 * @param axisMax - The axis maximum (see {@link axisMaxOf}).
 */
export function bandEdges(breaks: number[], axisMax: number): number[] {
	const inner: number[] = [];
	let prev = 0;
	for (const b of breaks) {
		prev = Math.min(100, Math.max(prev, Number.isFinite(b) ? (b / axisMax) * 100 : 0));
		inner.push(prev);
	}
	return [0, ...inner, 100];
}

/**
 * Indexes of the candidates that get a written value.
 *
 * Ticks can land close together (ckmeans breaks cluster near zero on skewed
 * fields) and the bar can be as narrow as ~100px, so labels are thinned: every
 * break keeps its tick, but at most `maxLabels` values are written out. Takes
 * the largest subset up to `maxLabels` whose neighbours don't overlap, and among
 * those the one with the widest *narrowest* gap across the whole rendered row —
 * the fixed "0" and max labels included — so the values spread over the axis
 * instead of clumping at one end.
 *
 * @param cands - Candidate ticks, with their axis position and label text.
 * @param barWidth - Measured bar width in px. `0` means "not measured yet", in
 *   which case nothing is considered to collide and the spread alone decides.
 * @param maxLabels - Cap on written values.
 */
export function pickLabels(
	cands: { pct: number; label: string }[],
	barWidth: number,
	maxLabels: number
): Set<number> {
	const n = cands.length;
	const cap = Math.max(0, Math.min(Math.floor(maxLabels), n));
	if (cap === 0) return new Set();

	// Center-to-center distance (axis %) two labels need to clear each other.
	const need = (i: number, j: number) => {
		if (!(barWidth > 0)) return 0; // pre-measure: let the spread decide
		const px = ((cands[i].label.length + cands[j].label.length) / 2) * LABEL_CHAR_PX + LABEL_PAD_PX;
		return (px / barWidth) * 100;
	};
	const spread = (idx: number[]) => {
		const row = [0, ...idx.map((i) => cands[i].pct), 100];
		return Math.min(...row.slice(1).map((p, i) => p - row[i]));
	};

	let best: number[] = [];
	for (let size = cap; size >= 1 && !best.length; size--) {
		let bestScore = -Infinity;
		let scans = 0;
		const walk = (start: number, acc: number[]) => {
			if (++scans > MAX_SUBSET_SCAN) return;
			if (acc.length === size) {
				const s = spread(acc);
				if (s > bestScore) {
					bestScore = s;
					best = [...acc];
				}
				return;
			}
			for (let i = start; i < n; i++) {
				const prev = acc[acc.length - 1];
				if (acc.length && cands[i].pct - cands[prev].pct < need(prev, i)) continue;
				acc.push(i);
				walk(i + 1, acc);
				acc.pop();
			}
		};
		walk(0, []);
	}
	return new Set(best);
}

/**
 * The boundary values shown as ticks, each flagged with whether its value is
 * written out. The colour channel's breaks win; otherwise the opacity channel's
 * (variant B, where the alpha steps carry the classes).
 *
 * @param spec - The bar spec.
 * @param barWidth - Measured bar width in px (see {@link pickLabels}).
 * @param maxLabels - Cap on written values.
 */
export function ticksOf(spec: PercentBarSpec, barWidth: number, maxLabels: number): Tick[] {
	const axisMax = axisMaxOf(spec);
	const boundaries = spec.breaks ?? spec.opacity?.breaks ?? null;
	const cands = (boundaries ?? [])
		.filter((b) => Number.isFinite(b) && b > 0 && b < axisMax)
		.map((b) => ({ value: b, pct: (b / axisMax) * 100, label: formatBreak(b) }));
	const keep = pickLabels(cands, barWidth, maxLabels);
	return cands.map((c, i) => ({ ...c, labeled: keep.has(i) }));
}

/** Whether the bar depicts discrete classes rather than a smooth ramp. */
function isStepped(spec: PercentBarSpec, tickCount: number): boolean {
	return (spec.mode ?? 'steps') === 'steps' && tickCount > 0;
}

/**
 * Solid colour bands, one per ckmeans class — mirrors the renderer's
 * `steppedColorVisualVariable`. Uses the *unfiltered* breaks so class i always
 * gets the colour the globe gives it. `null` = keep the smooth ramp.
 */
function colorBandsOf(spec: PercentBarSpec, stepped: boolean) {
	if (spec.flat || !stepped || !spec.breaks?.length) return null;
	const edges = bandEdges(spec.breaks, axisMaxOf(spec));
	return classColors(spec.colors, spec.breaks.length + 1).map((color, i) => ({
		from: edges[i],
		to: edges[i + 1],
		color
	}));
}

/** Flat per-class alphas — the `steppedOpacityVisualVariable` counterpart. */
function alphaBandsOf(spec: PercentBarSpec, stepped: boolean) {
	const { opacity } = spec;
	if (!opacity || !stepped || !opacity.breaks?.length) return null;
	const edges = bandEdges(opacity.breaks, axisMaxOf(spec));
	return classOpacities(opacity.breaks.length + 1, opacity.min, opacity.max).map((alpha, i) => ({
		from: edges[i],
		to: edges[i + 1],
		alpha
	}));
}

/**
 * Continuous colour fallback — the ramp stops spread evenly. Used whenever the
 * colour channel isn't classed.
 */
function colorKeyframesOf(spec: PercentBarSpec): { pos: number; color: string }[] {
	const { colors, flat = false } = spec;
	const darkest = colors[colors.length - 1];
	if (flat) {
		return [
			{ pos: 0, color: darkest },
			{ pos: 100, color: darkest }
		];
	}
	return colors.map((c, i) => ({
		pos: colors.length === 1 ? 0 : (i / (colors.length - 1)) * 100,
		color: c
	}));
}

/** Continuous alpha fallback — linear min→max. */
function alphaKeyframesOf(spec: PercentBarSpec): { pos: number; alpha: number }[] | null {
	return spec.opacity
		? [
				{ pos: 0, alpha: spec.opacity.min },
				{ pos: 100, alpha: spec.opacity.max }
			]
		: null;
}

/** Colour at an axis position — sRGB blend between keyframes, like CSS does. */
function rampColorAt(cs: { pos: number; color: string }[], p: number): chroma.Color {
	if (p <= cs[0].pos) return chroma(cs[0].color);
	for (let i = 1; i < cs.length; i++) {
		if (p <= cs[i].pos) {
			const span = cs[i].pos - cs[i - 1].pos;
			const t = span === 0 ? 1 : (p - cs[i - 1].pos) / span;
			return chroma.mix(cs[i - 1].color, cs[i].color, t, 'rgb');
		}
	}
	return chroma(cs[cs.length - 1].color);
}

/** Alpha at an axis position — piecewise-linear between alpha keyframes. */
function rampAlphaAt(ks: { pos: number; alpha: number }[], p: number): number {
	if (p <= ks[0].pos) return ks[0].alpha;
	for (let i = 1; i < ks.length; i++) {
		if (p <= ks[i].pos) {
			const span = ks[i].pos - ks[i - 1].pos;
			const t = span === 0 ? 1 : (p - ks[i - 1].pos) / span;
			return ks[i - 1].alpha + (ks[i].alpha - ks[i - 1].alpha) * t;
		}
	}
	return ks[ks.length - 1].alpha;
}

/** The band covering `p` — `p` is always a band midpoint, never an edge. */
function bandAt<T extends { from: number; to: number }>(bands: T[], p: number): T {
	return bands.find((b) => p >= b.from && p <= b.to) ?? bands[bands.length - 1];
}

/**
 * The bar's CSS `background` — one `linear-gradient(to right, …)`.
 *
 * Cuts the axis at every band edge / keyframe of both channels, then emits a
 * stop at each end of every segment. A classed channel holds one value across
 * its segment, so the shared edge carries two different colours — the CSS
 * hard-stop idiom — while a continuous channel keeps blending.
 *
 * @param spec - The bar spec.
 * @param tickCount - How many ticks {@link ticksOf} produced; a classed bar with
 *   no visible tick falls back to the smooth ramp.
 */
export function barGradient(spec: PercentBarSpec, tickCount: number): string {
	const { colors, flat = false, opacity = null } = spec;
	const stepped = isStepped(spec, tickCount);
	const colorBands = colorBandsOf(spec, stepped);
	const alphaBands = alphaBandsOf(spec, stepped);
	const colorKeyframes = colorKeyframesOf(spec);
	const alphaKeyframes = alphaKeyframesOf(spec);

	// Untouched channels keep their exact pre-existing gradient strings.
	if (!colorBands && !alphaBands && !opacity) {
		if (flat) {
			const c = colors[colors.length - 1];
			return `linear-gradient(to right, ${c}, ${c})`;
		}
		return `linear-gradient(to right, ${colors.join(', ')})`;
	}

	const edges = [
		...(colorBands ? colorBands.map((b) => b.to) : colorKeyframes.map((k) => k.pos)),
		...(alphaBands ? alphaBands.map((b) => b.to) : (alphaKeyframes ?? []).map((k) => k.pos))
	];
	const cuts = [...new Set([0, 100, ...edges])]
		.filter((p) => Number.isFinite(p) && p >= 0 && p <= 100)
		.sort((a, b) => a - b);

	const stops: string[] = [];
	let last = '';
	for (let i = 0; i < cuts.length - 1; i++) {
		const [a, b] = [cuts[i], cuts[i + 1]];
		if (b <= a) continue; // zero-width band: break outside the axis
		const mid = (a + b) / 2;
		const solid = colorBands ? chroma(bandAt(colorBands, mid).color) : null;
		const alpha = alphaBands ? bandAt(alphaBands, mid).alpha : null;
		for (const p of [a, b]) {
			const c = solid ?? rampColorAt(colorKeyframes, p);
			const al = opacity ? (alpha ?? rampAlphaAt(alphaKeyframes!, p)) : null;
			const stop = `${al == null ? c.hex() : c.alpha(al).css()} ${p}%`;
			// A segment's opening stop repeats the previous one wherever the
			// channel is continuous — emit it only when it actually differs,
			// i.e. at a real class cut.
			if (stop !== last) stops.push((last = stop));
		}
	}
	return `linear-gradient(to right, ${stops.join(', ')})`;
}
