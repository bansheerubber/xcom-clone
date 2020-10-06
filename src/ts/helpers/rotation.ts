import Vector from "./vector";

export const RAD_TO_EULER = 180 / Math.PI
export const EULER_TO_RAD = Math.PI / 180

export default class Rotation {
	private _angle: number = 0
	private _vector: Vector = new Vector(1, 0)



	constructor(angle: number = 0) {
		this.angle = angle
	}

	/**
	 * \!/ angle is in radius \!/
	 */
	set angle(angle: number) {
		this._angle = angle
		this._vector.x = Math.cos(angle)
		this._vector.y = Math.sin(angle)
	}

	get angle(): number {
		return this._angle
	}

	/**
	 * 2d vector representing the direction of our angle
	 */
	set vector(vector: Vector) {
		this._vector = vector.unit_()
		this._angle = Math.atan2(vector.y, vector.x)

		if(vector.y < 0) {
			this._angle += Math.PI * 2
		}
	}

	get vector(): Vector {
		return this._vector
	}
}