/**
 * The plot frame's arithmetic, asserted without a plot.
 *
 * These bands used to live inside a chart's draw function, where the only way
 * to check that the x-axis label never lands on the tick labels was to resize a
 * browser. They are a pure function of the box now, so the bands can be added
 * up here.
 */

import { describe, it, expect } from 'vitest';
import {
	computePlotFrame,
	MIN_HEIGHT,
	MIN_PLOT_HEIGHT,
	NARROW_WIDTH,
	SHORT_HEIGHT
} from './plotFrame.js';

const X: [number, number] = [2000, 2024];
const Y: [number, number] = [300, 800];

describe('computePlotFrame — margins', () => {
	it('stacks the x-axis label under the ticks when there is height for it', () => {
		const f = computePlotFrame({ width: 1200, height: 600 }, X, Y);
		expect(f.inlineXLabel).toBe(false);
		// tickPad -> tick label -> labelGap -> axis label, plus 2px of slack.
		expect(f.margins.bottom).toBe(
			f.type.tickPad + f.type.tickFont + f.type.labelGap + f.type.labelFont + 2
		);
	});

	it('keeps the plot at least MIN_PLOT_HEIGHT tall, folding the label inline if not', () => {
		const tall = computePlotFrame({ width: 1200, height: 600 }, X, Y);
		expect(tall.inner.height).toBeGreaterThanOrEqual(MIN_PLOT_HEIGHT);

		const squat = computePlotFrame({ width: 1200, height: 240 }, X, Y);
		expect(squat.inlineXLabel).toBe(true);
		// Inline: one shared row, so the band is the taller of the two fonts.
		expect(squat.margins.bottom).toBe(
			squat.type.tickPad + Math.max(squat.type.tickFont, squat.type.labelFont) + 4
		);
		expect(squat.margins.bottom).toBeLessThan(tall.margins.bottom);
	});

	it('always reserves the band the label it draws will occupy', () => {
		for (const height of [180, 220, 260, 300, 400, 900]) {
			const f = computePlotFrame({ width: 1200, height }, X, Y);
			// Where the label's top edge goes: below the tick row when stacked,
			// on it when inline.
			const labelTop = f.inlineXLabel
				? f.type.tickPad
				: f.type.tickPad + f.type.tickFont + f.type.labelGap;
			expect(f.margins.bottom).toBeGreaterThanOrEqual(labelTop + f.type.labelFont);
		}
	});

	it('narrows the gutter and shrinks type on small boxes', () => {
		const wide = computePlotFrame({ width: 1200, height: 600 }, X, Y);
		const narrow = computePlotFrame({ width: NARROW_WIDTH - 1, height: 600 }, X, Y);
		expect(wide.narrow).toBe(false);
		expect(narrow.narrow).toBe(true);
		expect(narrow.margins.left).toBeLessThan(wide.margins.left);

		const short = computePlotFrame({ width: 1200, height: SHORT_HEIGHT - 1 }, X, Y);
		expect(short.short).toBe(true);
		expect(short.type.tickFont).toBeLessThan(wide.type.tickFont);
		expect(short.yTicks).toBeLessThan(wide.yTicks);
	});

	it('floors the height so a container with no height still draws', () => {
		const f = computePlotFrame({ width: 800, height: 0 }, X, Y);
		expect(f.box.height).toBe(MIN_HEIGHT);
	});
});

describe('computePlotFrame — scales', () => {
	it('pads the y domain so the curve never touches the frame edge', () => {
		const f = computePlotFrame({ width: 1200, height: 600 }, X, Y, { niceY: false });
		const [lo, hi] = f.y.domain();
		expect(lo).toBeLessThan(Y[0]);
		expect(hi).toBeGreaterThan(Y[1]);
	});

	it('honours yPad: 0 as no padding at all, not as the default', () => {
		const f = computePlotFrame({ width: 1200, height: 600 }, X, Y, { yPad: 0, niceY: false });
		expect(f.y.domain()).toEqual([Y[0], Y[1]]);
	});

	it('inverts y so the largest value is at the top of the plot', () => {
		const f = computePlotFrame({ width: 1200, height: 600 }, X, Y);
		expect(f.y(Y[1])).toBeLessThan(f.y(Y[0]));
	});

	it('insets the x range on a wide box and drops the inset when narrow', () => {
		const wide = computePlotFrame({ width: 1200, height: 600 }, X, Y, { xInset: 28 });
		expect(wide.x.range()[0]).toBe(28);
		const narrow = computePlotFrame({ width: 400, height: 600 }, X, Y, { xInset: 28 });
		expect(narrow.x.range()[0]).toBe(0);
	});

	it('never hands a mark a negative plotting area', () => {
		const f = computePlotFrame({ width: 10, height: 10 }, X, Y);
		expect(f.x.range()[1]).toBeGreaterThanOrEqual(0);
		expect(f.y.range()[0]).toBeGreaterThanOrEqual(0);
	});
});
