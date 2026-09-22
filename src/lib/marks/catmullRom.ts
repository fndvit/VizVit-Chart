/**
 * @module marks/catmullRom
 * A Catmull-Rom spline, evaluated point by point.
 *
 * This is the kernel behind any mark whose thickness varies along its length.
 * An SVG `<path>` has one `stroke-width` for the whole path, so a curve whose
 * width follows a third data channel cannot be one path — it has to be many
 * short segments, each with its own width. Which means the curve has to be
 * *sampled*, not described, and something has to do the sampling.
 *
 * It lived inlined in a chart's draw loop for as long as it existed, where it
 * could not be called without a DOM. Out here it is two pure functions, and the
 * interpolation can be asserted against the control points it is supposed to
 * pass through.
 */

/** A point in plot space, `[x, y]` in px. */
export type Point = [number, number];

/** One sampled piece of a curve, with the weight interpolated at its midpoint. */
export type Segment = {
	/** Start point. */
	from: Point;
	/** End point. */
	to: Point;
	/**
	 * The weight channel interpolated at the segment's midpoint — what a mark
	 * turns into a stroke width.
	 */
	weight: number;
};

/**
 * Evaluates the centripetal-form Catmull-Rom basis at `t` for one span.
 *
 * The curve passes exactly through `p1` at `t = 0` and `p2` at `t = 1`; `p0` and
 * `p3` are the neighbouring control points that set the tangents. At the ends of
 * a series, callers clamp — passing `p1` as `p0` (and `p2` as `p3`) gives a
 * natural-looking end rather than a kink.
 *
 * @param p0 - Control point before the span.
 * @param p1 - Start of the span; the curve passes through it.
 * @param p2 - End of the span; the curve passes through it.
 * @param p3 - Control point after the span.
 * @param t - Position along the span, 0→1.
 * @returns The interpolated point.
 */
export function catmullRomPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
	const t2 = t * t;
	const t3 = t2 * t;
	const axis = (a: number, b: number, c: number, d: number) =>
		0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);

	return [axis(p0[0], p1[0], p2[0], p3[0]), axis(p0[1], p1[1], p2[1], p3[1])];
}

/**
 * Samples a whole series into drawable segments.
 *
 * Walks each span between consecutive points, cutting it into `samples` pieces
 * and interpolating the weight linearly across the span, so a mark can give
 * every piece its own thickness.
 *
 * @param points - The series in plot space, in draw order.
 * @param weights - One weight per point, same length and order as `points`.
 * @param samples - Pieces per span. Higher is smoother and costs more nodes;
 *   60 is the density at which the joins stop being visible at full width.
 * @returns `(points.length - 1) * samples` segments, or `[]` for fewer than two
 *   points, which cannot describe a curve.
 */
export function sampleCurve(
	points: readonly Point[],
	weights: readonly number[],
	samples = 60
): Segment[] {
	const n = points.length;
	if (n < 2 || samples < 1) return [];

	const out: Segment[] = [];
	for (let i = 0; i < n - 1; i++) {
		// Clamp at the ends: the first span has no point before it, the last
		// none after it.
		const p0 = points[Math.max(0, i - 1)];
		const p1 = points[i];
		const p2 = points[i + 1];
		const p3 = points[Math.min(n - 1, i + 2)];
		const w1 = weights[i] ?? 0;
		const w2 = weights[i + 1] ?? 0;

		for (let s = 0; s < samples; s++) {
			const t0 = s / samples;
			const t1 = (s + 1) / samples;
			const tMid = (t0 + t1) / 2;
			out.push({
				from: catmullRomPoint(p0, p1, p2, p3, t0),
				to: catmullRomPoint(p0, p1, p2, p3, t1),
				weight: w1 * (1 - tMid) + w2 * tMid
			});
		}
	}
	return out;
}
