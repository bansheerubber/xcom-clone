import Matter = require("matter-js");
import { networkClass } from "../network/networkDecorators";

@networkClass()
export default class Vector3d {
	public x: number
	public y: number
	public z: number

	private matterVector: Matter.Vector

	private static tempVectors: Vector3d[] = []


	
	constructor(x: number = 0, y: number = 0, z: number = 0) {
		this.x = x
		this.y = y
		this.z = z
	}

	/**
	 * perform an operation on the x, y, z components
	 * @param call operation performed
	 */
	public foreach(call: (input: number) => number): Vector3d {
		this.x = call(this.x)
		this.y = call(this.y)
		this.z = call(this.z)
		return this
	}

	/**
	 * adds the input vector to this one
	 * @param vector
	 */
	public add(vector: Vector3d): Vector3d {
		this.x += vector.x
		this.y += vector.y
		this.z += vector.z
		return this
	}

	/**
	 * adds together the supplied components to this vector
	 * @param x 
	 * @param y 
	 * @param z 
	 */
	public $add(x: number, y: number, z: number): Vector3d {
		this.x += x
		this.y += y
		this.z += z
		return this
	}

	/**
	 * subtract the input vector from this one
	 * @param vector
	 */
	public sub(vector: Vector3d): Vector3d {
		this.x -= vector.x
		this.y -= vector.y
		this.z -= vector.z
		return this
	}

	/**
	 * multiply a scalar into this vector
	 * @param scalar
	 */
	public mul(scalar: number): Vector3d {
		this.x *= scalar
		this.y *= scalar
		return this
	}

	/**
	 * convert this vector into a unit vector
	 */
	public unit(): Vector3d {
		let length = this.length()

		if(length != 0) {
			this.x /= length
			this.y /= length
			this.z /= length
			return this
		}
		else {
			this.x = 0
			this.y = 0
			this.z = 0
			return this
		}
	}

	/**
	 * clone us and add the input to our clone
	 * @param vector
	 */
	public add_(vector: Vector3d): Vector3d {
		return this.clone().add(vector)
	}

	/**
	 * clone us and subtract the input from our clone
	 * @param vector 
	 */
	public sub_(vector: Vector3d): Vector3d {
		return this.clone().sub(vector)
	}

	/**
	 * clone us and multiply a scalar into our clone
	 * @param scalar 
	 */
	public mul_(scalar: number): Vector3d {
		return this.clone().mul(scalar)
	}

	/**
	 * clone us and convert our clone into a unit vector
	 */
	public unit_(): Vector3d {
		return this.clone().unit()
	}

	/**
	 * copies a vector into us
	 * @param input
	 */
	public copy(input: Vector3d): Vector3d {
		this.x = input.x
		this.y = input.y
		this.z = input.z
		return this
	}

	/**
	 * makes a clone of us
	 */
	public clone(): Vector3d {
		return new Vector3d(this.x, this.y, this.z)
	}

	/**
	 * @return dot product with this vector and the input vector
	 * @param vector 
	 */
	public dot(vector: Vector3d): number {
		return this.x * vector.x + this.y * vector.y + this.z * vector.z
	}

	/**
	 * @return length of this vector
	 */
	public length(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
	}

	/**
	 * @return distance from this vector to another vector
	 * @param input
	 */
	public dist(input: Vector3d): number {
		return Math.sqrt(((this.x - input.x) ** 2) + ((this.y - input.y) ** 2) + ((this.z - input.z) ** 2))
	}

	/**
	 * linear interpolation by percent of distance between vectors
	 * @param end 
	 * @param percent 
	 */
	public lerp(end: Vector3d, percent: number): Vector3d {
		return Vector3d.getTempVector(200).set(
			this.x * (1 - percent) + end.x * percent,
			this.y * (1 - percent) + end.y * percent,
			this.z * (1 - percent) + end.z * percent,
		)
	}

	/**
	 * linear interpolation by 1 unit of distance between vectors
	 * @param end 
	 * @param percent 
	 */
	public lerpUnit(end: Vector3d, units: number): Vector3d {
		let percent = Math.min(1, units / this.dist(end))
		return Vector3d.getTempVector(200).set(
			this.x * (1 - percent) + end.x * percent,
			this.y * (1 - percent) + end.y * percent,
			this.z * (1 - percent) + end.z * percent,
		)
	}

	/**
	 * set the x/y coordinates of this vector
	 * @param x 
	 * @param y 
	 */
	public set(x: number, y: number, z: number): Vector3d {
		this.x = x
		this.y = y
		this.z = z
		return this
	}

	/**
	 * maps our x/y coordinates to a unique number
	 */
	public unique2d(): number {
		return ((this.x + this.y) * (this.x + this.y + 1)) / 2 + this.y
	}

	/**
	 * maps our x, y, and z coordinates to a unique number
	 */
	public unique(): number {
		let unique2d = this.unique2d()
		return ((unique2d + this.z) * (unique2d + this.z + 1)) / 2 + this.z
	}

	/**
	 * returns true if the vectors share the same unique number
	 * @param vector
	 */
	public equals(vector: Vector3d): boolean {
		return this.unique() == vector.unique()
	}

	/**
	 * create a temp vector which is reused
	 * @param index
	 */
	public static getTempVector(index: number): Vector3d {
		if(this.tempVectors[index] === undefined) {
			this.tempVectors[index] = new Vector3d(0, 0)
		}
		return this.tempVectors[index]
	}
}