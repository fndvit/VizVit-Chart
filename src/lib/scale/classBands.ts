/**
 * @module scale/classBands
 * What one **class** of a stepped (banded) channel looks like: its colour and
 * its alpha.
 *
 * A classed channel — ckmeans breaks, or an authored threshold banding — paints
 * `k = breaks.length + 1` flat bands, and everything that draws those bands has
 * to agree on what they are. In the app this was extracted from grew to four
 * readers: a GPU renderer's stepped visual variables, a CSS hover mirror, the
 * legend bar and the legend's tier dots. They had been reaching into the
 * *renderer* module for two lines of colour arithmetic, which made a legend
 * depend on a map SDK.
 *
 * So this is the smallest and most load-bearing module in the package: pure
 * arithmetic, one dependency, and the reason {@link ../legend/percentBar} and a
 * renderer can be written independently without drifting. A consumer that paints
 * classes on screen should call these and hand the same `k` to the legend.
 */

import chroma from 'chroma-js';

/**
 * `k` discrete ramp colors, one per class — the color analogue of
 * {@link classOpacities}. Samples the ramp in LAB at `i / (k−1)` so class 0 is
 * the lightest stop and class k−1 the darkest, matching the opacity direction.
 * Shared by the GPU's `steppedColorVisualVariable`, the hover mirror and the
 * legend bar, so all three pick exactly the same class color.
 *
 * @param colorStops - The ramp to sample (falls back to a neutral grey ramp when empty).
 * @param k - Number of classes.
 * @returns One hex color per class, lightest→darkest.
 */
export function classColors(colorStops: string[], k: number): string[] {
	const scale = chroma.scale(colorStops.length ? colorStops : ['#cccccc', '#333333']).mode('lab');
	return Array.from({ length: k }, (_, i) => scale(k === 1 ? 0 : i / (k - 1)).hex());
}

/**
 * Evenly-spaced per-class alphas across `[opMin, opMax]` for `k` classes.
 * Shared by the GPU's `steppedOpacityVisualVariable`, the hover mirror in
 * `computeDotStyle` and the legend bar, so all three classify identically.
 *
 * @param k - Number of classes.
 * @param opMin - Alpha of class 0.
 * @param opMax - Alpha of class k−1.
 * @returns One alpha per class, lowest→highest.
 */
export function classOpacities(k: number, opMin: number, opMax: number): number[] {
	return Array.from({ length: k }, (_, i) => opMin + ((opMax - opMin) * i) / (k - 1));
}
