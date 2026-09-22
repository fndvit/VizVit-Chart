/**
 * The inline-label collision rule.
 *
 * The chart this came from resolved it by rendering every tick, measuring it
 * with `getComputedTextLength()` and removing the ones that overlapped — correct,
 * but only executable inside a live SVG. Estimating instead makes the rule
 * assertable, which is what these tests are for.
 */

import { describe, it, expect } from 'vitest';
import { computePlotFrame } from './plotFrame.js';
import { estimateTextWidth, formatCompact, formatInteger, visibleXTicks } from './axisTicks.js';

const X: [number, number] = [2000, 2024];
const Y: [number, number] = [300, 800];

describe('estimateTextWidth', () => {
	it('grows with both length and font size', () => {
		expect(estimateTextWidth('2024', 12)).toBeGreaterThan(estimateTextWidth('24', 12));
		expect(estimateTextWidth('2024', 14)).toBeGreaterThan(estimateTextWidth('2024', 10));
	});

	it('is zero for an empty string', () => {
		expect(estimateTextWidth('', 12)).toBe(0);
	});
});

describe('visibleXTicks', () => {
	it('writes every tick when the label has its own row', () => {
		const frame = computePlotFrame({ width: 1200, height: 600 }, X, Y);
		expect(frame.inlineXLabel).toBe(false);
		expect(visibleXTicks(frame, formatInteger, 'year →')).toEqual(frame.x.ticks(frame.xTicks));
	});

	it('writes every tick when there is no label to collide with', () => {
		const frame = computePlotFrame({ width: 1200, height: 240 }, X, Y);
		expect(frame.inlineXLabel).toBe(true);
		expect(visibleXTicks(frame, formatInteger, '')).toEqual(frame.x.ticks(frame.xTicks));
	});

	it('drops the ticks the inline label would sit on top of', () => {
		const frame = computePlotFrame({ width: 1200, height: 240 }, X, Y);
		const all = frame.x.ticks(frame.xTicks);
		const shown = visibleXTicks(frame, formatInteger, 'year →');
		expect(shown.length).toBeLessThan(all.length);
		// Only from the right-hand end — the label is right-aligned.
		expect(shown).toEqual(all.slice(0, shown.length));
	});

	it('leaves no kept tick overlapping the label', () => {
		const frame = computePlotFrame({ width: 1200, height: 240 }, X, Y);
		const label = 'year →';
		const labelLeft =
			frame.inner.width +
			frame.margins.right -
			estimateTextWidth(label, frame.type.labelFont) -
			frame.type.labelGap;
		for (const t of visibleXTicks(frame, formatInteger, label)) {
			const half = estimateTextWidth(formatInteger(t), frame.type.tickFont) / 2;
			expect(frame.x(t) + half).toBeLessThanOrEqual(labelLeft);
		}
	});
});

describe('the default formatters', () => {
	it('writes large values compactly, so a 45px gutter can hold them', () => {
		expect(formatCompact(800_000_000)).toMatch(/800/);
		expect(formatCompact(800_000_000).length).toBeLessThan(6);
	});

	it('writes an x value as a plain year', () => {
		expect(formatInteger(2024)).toBe('2024');
		expect(formatInteger(2024.4)).toBe('2024');
	});
});
