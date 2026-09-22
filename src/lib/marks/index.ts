/**
 * @module marks
 * The built-in {@link ./mark} registry.
 *
 * A chart takes `mark` as either a name from this table or a component of its
 * own, so the styles shipped here are a convenience, never a closed set. Adding
 * one is a component file plus a line in {@link MARKS} — nothing that hosts a
 * mark has to change, because nothing that hosts a mark enumerates them.
 */

import Area from './Area.svelte';
import Line from './Line.svelte';
import Ribbon from './Ribbon.svelte';
import type { Mark } from './mark.js';

/** Built-in marks, by name. */
export const MARKS = {
	/** A curve whose thickness follows the weight channel. */
	ribbon: Ribbon as Mark,
	/** A plain constant-width curve. */
	line: Line as Mark,
	/** A filled area down to the baseline. */
	area: Area as Mark
} satisfies Record<string, Mark>;

/** The name of a built-in mark. */
export type MarkName = keyof typeof MARKS;

export { Area, Line, Ribbon };
export { catmullRomPoint, sampleCurve, type Point, type Segment } from './catmullRom.js';
export { weightRange, type Mark, type MarkProps, type MarkStyle } from './mark.js';
