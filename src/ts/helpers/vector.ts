import Matter = require("matter-js");
import { networkClass } from "../network/networkDecorators";

type callback = (x: number, y: number) => void

@networkClass()
export default class Vector {
	public x: number
	public y: number

	public onModified: callback

	private matterVector: Matter.Vector

	private static tempVectors: Vector[] = []


	
	constructor(x: number = 0, y: number = 0) {
		this.x = x
		this.y = y
	}

	/**
	 * adds the input vector to this one
	 * @param vector
	 */
	public add(vector: Vector): Vector {
		this.x += vector.x
		this.y += vector.y
		return this
	}

	/**
	 * subtract the input vector from this one
	 * @param vector
	 */
	public sub(vector: Vector): Vector {
		this.x -= vector.x
		this.y -= vector.y
		return this
	}

	/**
	 * multiply a scalar into this vector
	 * @param scalar
	 */
	public mul(scalar: number): Vector {
		this.x *= scalar
		this.y *= scalar
		return this
	}

	/**
	 * convert this vector into a unit vector
	 */
	public unit(): Vector {
		let length = this.length()

		if(length != 0) {
			this.x /= length
			this.y /= length
			return this
		}
		else {
			this.x = 0
			this.y = 0
			return this
		}
	}

	// get the vector to the right of this vector

	/**
	 * gets the vector to the right of this vector
	 */
	public right(): Vector {
		let tempX = this.x
		let tempY = this.y
		this.x = tempY
		this.y = -tempX
		return this
	}

	/**
	 * clone us and add the input to our clone
	 * @param vector
	 */
	public add_(vector: Vector): Vector {
		return this.clone().add(vector)
	}

	/**
	 * clone us and subtract the input from our clone
	 * @param vector 
	 */
	public sub_(vector: Vector): Vector {
		return this.clone().sub(vector)
	}

	/**
	 * clone us and multiply a scalar into our clone
	 * @param scalar 
	 */
	public mul_(scalar: number): Vector {
		return this.clone().mul(scalar)
	}

	/**
	 * clone us and convert our clone into a unit vector
	 */
	public unit_(): Vector {
		return this.clone().unit()
	}

	/**
	 * clone us and determine the vector to the right of us
	 */
	public right_(): Vector {
		return this.clone().right()
	}

	/**
	 * copies a vector into us
	 * @param input
	 */
	public copy(input: Vector): Vector {
		this.x = input.x
		this.y = input.y
		return this
	}

	/**
	 * makes a clone of us
	 */
	public clone(): Vector {
		return new Vector(this.x, this.y)
	}

	/**
	 * @return dot product with this vector and the input vector
	 * @param vector 
	 */
	public dot(vector: Vector): number {
		return this.x * vector.x + this.y * vector.y
	}

	/**
	 * get the vector perpendicular to this one
	 */
	public perp(): Vector {
		return new Vector(this.y, -this.x) // TODO is this needed? we already have ._right()
	}

	/**
	 * @return length of this vector
	 */
	public length(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y)
	}

	/**
	 * @return distance from this vector to another vector
	 * @param input
	 */
	public dist(input: Vector): number {
		return Math.sqrt(((this.x - input.x) ** 2) + ((this.y - input.y) ** 2))
	}

	/**
	 * set the x/y coordinates of this vector
	 * @param x 
	 * @param y 
	 */
	public set(x: number, y: number): Vector {
		this.x = x
		this.y = y
		return this
	}

	/**
	 * what the fuck
	 * @param point1 
	 * @param direction1 
	 * @param point2 
	 * @param direction2 
	 */
	public static getIntersectionPoint(point1: Vector, direction1: Vector, point2: Vector, direction2: Vector): Vector {
		let output = new Vector()

		let end1 = point1.add_(direction1)
		let end2 = point2.add_(direction2)

		// slopes
		let slope1 = (end1.y - point1.y) / (end1.x - point1.x)
		let slope2 = (end2.y - point2.y) / (end2.x - point2.x)

		// y intercepts
		let intercept1 = point1.y - slope1 * point1.x
		let intercept2 = point2.y - slope2 * point2.x

		let finalX = (intercept2 - intercept1) / (slope1 - slope2)
		let finalY = slope1 * finalX + intercept1

		return output.set(finalX, finalY)
	}

	/**
	 * converts this to a MatterJS vector
	 */
	public toMatter(): Matter.Vector {
		if(!this.matterVector) {
			this.matterVector = Matter.Vector.create(this.x, this.y)
		}
		
		this.matterVector.x = this.x
		this.matterVector.y = this.y

		return this.matterVector
	}

	/**
	 * maps our x/y coordinates to a unique number
	 */
	public unique(): number {
		return ((this.x + this.y) * (this.x + this.y + 1)) / 2 + this.y
	}

	/**
	 * returns true if the vectors share the same unique number
	 * @param vector
	 */
	public equals(vector: Vector): boolean {
		return this.unique() == vector.unique()
	}

	/**
	 * create a temp vector which is reused
	 * @param index
	 */
	public static getTempVector(index: number): Vector {
		if(this.tempVectors[index] === undefined) {
			this.tempVectors[index] = new Vector(0, 0)
		}
		return this.tempVectors[index]
	}
}