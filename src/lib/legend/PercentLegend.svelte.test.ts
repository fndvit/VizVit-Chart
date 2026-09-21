import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'svelte';
import { render } from 'vitest-browser-svelte';
import PercentLegend from './PercentLegend.svelte';
import { classColors, classOpacities } from '../scale/classBands.js';

/**
 * Mounts the legend and hands back the element to query.
 *
 * This suite runs in a real browser (the repo's `client` vitest project), so
 * the component is measured and styled for real rather than in jsdom — which
 * matters here: label thinning depends on the bar's rendered width.
 */
type LegendProps = ComponentProps<typeof PercentLegend>;

function mount(options: { props: LegendProps }): HTMLElement {
	render(PercentLegend, options.props);
	return document.body;
}

const COLORS: [string, string, string] = ['#fff7bc', '#fec44f', '#d95f0e'];

/**
 * The tick marks, by their semantic class. This used to select `div.w-px` — a
 * Tailwind utility — which coupled the test to a styling framework the package
 * does not ship and broke the moment the component was themed with CSS
 * properties instead.
 */
const TICK_SELECTOR = '.vit-legend__tick';
const BREAKS_5 = [6.6, 18.74, 35.55, 58.35]; // real r2 GLCFCS_11_12_20_pct k=5
const MAX = 72;
/** Break positions along the 0→max axis, in %. */
const POS = BREAKS_5.map((b) => (b / MAX) * 100);

/** Hex color as the DOM serializes it in inline styles — `rgb(r, g, b)`. */
function rgb(hex: string): string {
	const n = parseInt(hex.slice(1), 16);
	return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

/**
 * Canonical `r,g,b,a` for a color in any syntax the stack may serialize —
 * hex from the component, legacy `rgb(r, g, b)` / `rgba(r, g, b, a)` from
 * jsdom, modern `rgb(r g b / a)` from chroma. Keeps the assertions about
 * *which* color is painted independent of *how* it is written out.
 */
function px(color: string, alpha = 1): string {
	if (color.startsWith('#')) {
		const n = parseInt(color.slice(1), 16);
		return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha}`;
	}
	const [r, g, b, a = '1'] = color
		.replace(/rgba?\(|\)/g, '')
		.split(/[\s,/]+/)
		.filter(Boolean);
	return `${+r},${+g},${+b},${+a}`;
}

/**
 * How many decimals to trust in a position read back from the DOM.
 *
 * These assertions were written against jsdom, which echoes an inline style
 * verbatim; a real browser serializes a percentage to about six significant
 * digits, so `26.027777777777779%` comes back as `26.0278`. Three decimals on
 * an axis percentage is far finer than anything that can be seen, and it is the
 * precision the platform actually offers.
 */
const POS_PRECISION = 3;

/** The matching absolute tolerance, for positions compared by subtraction. */
const POS_EPSILON = 1e-3;

/** Positioned gradient stops, in order. */
function stops(bg: string): { color: string; pos: number }[] {
	return Array.from(bg.matchAll(/(rgba?\([^)]+\)|#[0-9a-f]{3,8})\s+([\d.]+)%/gi)).map((m) => ({
		color: px(m[1]),
		pos: parseFloat(m[2])
	}));
}

function background(container: HTMLElement): string {
	return container.querySelector<HTMLElement>('div[style*="linear-gradient"]')!.style.background;
}

/** Tick labels in DOM order with their `left` percentage positions. */
function tickLabels(container: HTMLElement): { text: string; left: number }[] {
	return Array.from(container.querySelectorAll<HTMLElement>('span[style*="left"]')).map((el) => ({
		text: el.textContent ?? '',
		left: parseFloat(el.style.left)
	}));
}

/**
 * Asserts the bar is `k` solid bands: every band is written as a pair of
 * stops holding one color from its start to its end, so CSS has nothing to
 * interpolate and each class reads as a flat block.
 *
 * @param expected - Per-band `[color, alpha]`, low→high.
 * @param edges - Band boundaries in axis %, `[0, …, 100]`, length k+1.
 */
function expectSolidBands(bg: string, expected: [string, number][], edges: number[]) {
	const s = stops(bg);
	expect(s).toHaveLength(expected.length * 2);
	expected.forEach(([color, alpha], i) => {
		const [start, end] = [s[i * 2], s[i * 2 + 1]];
		expect(start.color).toBe(px(color, alpha)); // band start
		expect(end.color).toBe(start.color); // …held flat to the band end
		expect(start.pos).toBeCloseTo(edges[i], POS_PRECISION);
		expect(end.pos).toBeCloseTo(edges[i + 1], POS_PRECISION);
	});
}

describe('PercentLegend (linear / no breaks)', () => {
	it('renders the gradient bar with 0 and max% labels and no ticks', () => {
		const container = mount({
			props: { colors: COLORS, max: MAX }
		});
		const bar = container.querySelector<HTMLElement>('div[style*="linear-gradient"]');
		expect(bar).not.toBeNull();
		expect(container.textContent).toContain('0');
		expect(container.textContent).toContain('72%');
		expect(tickLabels(container)).toHaveLength(0);
	});
});

describe('PercentLegend (unit-aware high-end label)', () => {
	it('shows a compact raw value + " ha" for unit="ha" (no percent clamp/suffix)', () => {
		const container = mount({
			props: { colors: COLORS, max: 1324495, unit: 'ha' }
		});
		expect(container.textContent).toContain('1.3M ha');
		expect(container.textContent).not.toContain('%');
	});

	it('clamps to a whole percent for unit="pct" (default)', () => {
		const container = mount({ props: { colors: COLORS, max: 150 } });
		expect(container.textContent).toContain('100%');
	});
});

describe('PercentLegend (ckmeans breaks, ticks mode)', () => {
	it('keeps the gradient and draws one tick line per break at proportional positions', () => {
		const container = mount({
			props: { colors: COLORS, max: MAX, breaks: BREAKS_5, mode: 'ticks' }
		});
		// gradient bar untouched
		expect(background(container)).toBe(`linear-gradient(to right, ${COLORS.map(rgb).join(', ')})`);
		// every break keeps its tick line — only labels are ever thinned
		expect(container.querySelectorAll(TICK_SELECTOR)).toHaveLength(BREAKS_5.length);
		// …of which `maxLabels` (3) are written out, at their proportional spots
		const labels = tickLabels(container);
		expect(labels.map((l) => l.text)).toEqual(['19', '36', '58']);
		labels.forEach((l, i) => expect(l.left).toBeCloseTo(POS[i + 1], POS_PRECISION));
	});

	it('drops breaks outside (0, max) instead of clamping them onto the endpoints', () => {
		const container = mount({
			props: { colors: COLORS, max: 40, breaks: [-2, 0, 10, 40, 55], mode: 'ticks' }
		});
		expect(tickLabels(container).map((l) => l.text)).toEqual(['10']);
	});

	it('renders no ticks for an empty breaks array', () => {
		const container = mount({
			props: { colors: COLORS, max: MAX, breaks: [] }
		});
		expect(tickLabels(container)).toHaveLength(0);
	});
});

describe('PercentLegend (steps mode, the default)', () => {
	it('paints k = breaks + 1 solid class bands, cut hard at the break positions', () => {
		const container = mount({
			props: { colors: COLORS, max: MAX, breaks: BREAKS_5 }
		});
		const bg = background(container);
		// The globe classes into breaks+1 classes and fills each with
		// `classColors(colors, k)`; the legend must sample the same count and
		// hold each color flat across its band — no blending between classes.
		const cols = classColors(COLORS, BREAKS_5.length + 1);
		expectSolidBands(
			bg,
			cols.map((c) => [c, 1] as [string, number]),
			[0, ...POS, 100]
		);
		// two stops share each boundary — that pair is what makes the cut hard
		POS.forEach((p) => {
			expect(stops(bg).filter((s) => Math.abs(s.pos - p) < POS_EPSILON)).toHaveLength(2);
		});
	});

	it('samples the ramp breaks+1 times, not breaks+2 (colors must match the globe)', () => {
		const container = mount({
			props: { colors: COLORS, max: MAX, breaks: BREAKS_5 }
		});
		const uniq = [...new Set(stops(background(container)).map((s) => s.color))];
		expect(uniq).toEqual(classColors(COLORS, BREAKS_5.length + 1).map((c) => px(c)));
		expect(uniq).not.toEqual(classColors(COLORS, BREAKS_5.length + 2).map((c) => px(c)));
		// the ramp's own mid stop lands on the middle class
		expect(uniq[2]).toBe(px(COLORS[1]));
	});

	it('draws no tick lines — the color cuts already mark the boundaries', () => {
		const container = mount({
			props: { colors: COLORS, max: MAX, breaks: BREAKS_5 }
		});
		expect(container.querySelectorAll(TICK_SELECTOR)).toHaveLength(0);
		expect(tickLabels(container).map((l) => l.text)).toEqual(['19', '36', '58']);
	});

	it('falls back to the smooth gradient without breaks', () => {
		const container = mount({
			props: { colors: COLORS, max: MAX, breaks: null, mode: 'steps' }
		});
		expect(background(container)).toBe(`linear-gradient(to right, ${COLORS.map(rgb).join(', ')})`);
	});

	it('collapses bands whose break sits past the axis max, keeping positions monotonic', () => {
		// max 40 with breaks up to 90: classes 2-4 live entirely off-axis.
		const container = mount({
			props: { colors: COLORS, max: 40, breaks: [10, 40, 55, 90] }
		});
		const s = stops(background(container));
		expect(s.map((x) => x.pos)).toEqual([...s.map((x) => x.pos)].sort((a, b) => a - b));
		expect(s[0].pos).toBe(0);
		expect(s[s.length - 1].pos).toBe(100);
		expect(s.every((x) => Number.isFinite(x.pos))).toBe(true);
	});
});

describe('PercentLegend (opacity channel)', () => {
	it('holds the alpha flat per class, like the color (variant A, steps mode)', () => {
		const container = mount({
			props: {
				colors: COLORS,
				max: MAX,
				breaks: BREAKS_5,
				opacity: { min: 0, max: 1, breaks: BREAKS_5 }
			}
		});
		const k = BREAKS_5.length + 1;
		const cols = classColors(COLORS, k);
		const alphas = classOpacities(k, 0, 1); // [0, .25, .5, .75, 1]
		expect(alphas).toEqual([0, 0.25, 0.5, 0.75, 1]);
		expectSolidBands(
			background(container),
			cols.map((c, i) => [c, alphas[i]] as [string, number]),
			[0, ...POS, 100]
		);
	});

	it('fades linearly when the opacity has no breaks (linear scale)', () => {
		const container = mount({
			props: { colors: COLORS, max: MAX, opacity: { min: 0, max: 1, breaks: null } }
		});
		// uniform ramp keyframes with linearly interpolated alphas — one stop
		// each, so CSS blends straight through
		expect(stops(background(container))).toEqual([
			{ color: px(COLORS[0], 0), pos: 0 },
			{ color: px(COLORS[1], 0.5), pos: 50 },
			{ color: px(COLORS[2], 1), pos: 100 }
		]);
		// no boundary labels — nothing is classed
		expect(tickLabels(container)).toHaveLength(0);
	});

	it('variant B (flat): constant darkest color, alpha carrying the classes', () => {
		const container = mount({
			props: {
				colors: COLORS,
				max: MAX,
				breaks: null,
				opacity: { min: 0, max: 1, breaks: BREAKS_5 },
				flat: true
			}
		});
		const dark = COLORS[2];
		const alphas = classOpacities(BREAKS_5.length + 1, 0, 1);
		expectSolidBands(
			background(container),
			alphas.map((a) => [dark, a] as [string, number]),
			[0, ...POS, 100]
		);
		// boundary labels come from the opacity breaks
		expect(tickLabels(container).map((l) => l.text)).toEqual(['19', '36', '58']);
	});

	it('merges color and opacity breaks when they differ', () => {
		const container = mount({
			props: {
				colors: COLORS,
				max: 100,
				breaks: [30, 60],
				opacity: { min: 0.2, max: 1, breaks: [45] }
			}
		});
		const cuts = [...new Set(stops(background(container)).map((s) => s.pos))];
		expect(cuts).toEqual([0, 30, 45, 60, 100]);
	});
});

describe('PercentLegend (maxLabels)', () => {
	// jsdom performs no layout, so `clientWidth` is 0 and the overlap
	// constraint is inert — selection here is decided purely by spread.
	it('writes at most 3 boundary values by default', () => {
		const container = mount({
			props: { colors: COLORS, max: MAX, breaks: BREAKS_5 }
		});
		expect(tickLabels(container)).toHaveLength(3);
	});

	it('keeps the subset that spreads widest, counting the fixed 0 and max ends', () => {
		const container = mount({
			props: { colors: COLORS, max: MAX, breaks: BREAKS_5 }
		});
		const row = [0, ...tickLabels(container).map((l) => l.left), 100];
		const minGap = Math.min(...row.slice(1).map((p, i) => p - row[i]));
		// beat every other 3-subset — 6.6 is dropped because it crowds the "0"
		for (let i = 0; i < 4; i++)
			for (let j = i + 1; j < 4; j++)
				for (let k = j + 1; k < 4; k++) {
					const alt = [0, POS[i], POS[j], POS[k], 100];
					// The tolerance absorbs the browser's percentage rounding, which is
					// coarser than jsdom's verbatim echo.
					expect(minGap).toBeGreaterThanOrEqual(
						Math.min(...alt.slice(1).map((p, x) => p - alt[x])) - 1e-4
					);
				}
	});

	it('honours a lower cap without touching the ticks', () => {
		const container = mount({
			props: { colors: COLORS, max: MAX, breaks: BREAKS_5, mode: 'ticks', maxLabels: 1 }
		});
		expect(tickLabels(container)).toHaveLength(1);
		expect(container.querySelectorAll(TICK_SELECTOR)).toHaveLength(BREAKS_5.length);
	});

	it('writes every value when the cap is lifted', () => {
		const container = mount({
			props: { colors: COLORS, max: MAX, breaks: BREAKS_5, maxLabels: Infinity }
		});
		expect(tickLabels(container).map((l) => l.text)).toEqual(['6.6', '19', '36', '58']);
	});

	it('never writes more values than there are breaks', () => {
		const container = mount({
			props: { colors: COLORS, max: MAX, breaks: [20, 50], maxLabels: 3 }
		});
		expect(tickLabels(container).map((l) => l.text)).toEqual(['20', '50']);
	});
});
