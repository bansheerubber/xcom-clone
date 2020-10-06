/**
 * @param input value to be clamped
 * @param min minimum value
 * @param max maximum value
 */
export default function clamp(input: number, min: number, max: number) {
	return Math.max(Math.min(input, max), min)
}