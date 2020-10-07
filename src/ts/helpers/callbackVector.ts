import Vector from "./vector"

export default class CallbackVector extends Vector {
	/**
	 * onModified is called when the x/y coordinates of this vector change
	 */
	public onModified: (vector?: CallbackVector) => void

	public add(input: Vector) {
		let value = super.add(input)
		this.onModified(this)
		return value
	}

	public sub(input: Vector) {
		let value = super.sub(input)
		this.onModified(this)
		return value
	}

	public mul(input: number) {
		let value = super.mul(input)
		this.onModified(this)
		return value
	}

	public unit() {
		let value = super.unit()
		this.onModified(this)
		return value
	}

	public copy(input: Vector) {
		let value = super.copy(input)
		this.onModified(this)
		return value
	}

	public set(x: number, y: number) {
		let value = super.set(x, y)
		this.onModified(this)
		return value
	}
}