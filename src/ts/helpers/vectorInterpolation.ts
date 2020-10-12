import GameObject from "../game/gameObject";
import Game from "../game/game";
import { gameClass } from "../network/networkDecorators";
import Vector from "./vector"

type callback = (vector: Vector) => void

@gameClass
export default class VectorInterpolation extends GameObject {
	public start: Vector
	public end: Vector
	public time: number

	/**
	 * called for each step
	 */
	public callback: callback

	/**
	 * called when we're finished
	 */
	public endCallback: callback

	protected interpolatedVector: Vector = new Vector(0, 0)
	public timeElapsed: number = 0


	
	constructor(game: Game, start: Vector, end: Vector, time: number, callback?: callback, endCallback?: callback) {
		super(game)

		this.start = start
		this.end = end
		this.time = time
		this.callback = callback
		this.endCallback = endCallback
	}
	
	public tick(deltaTime: number): void {
		super.tick(deltaTime)

		this.timeElapsed += deltaTime

		// figure out the linear interpolation of the vector based on how much time is remaining
		let percent = this.timeElapsed / this.time
		if(percent < 1) {
			this.interpolatedVector.x = (this.start.x * (1 - percent)) + (this.end.x * percent)
			this.interpolatedVector.y = (this.start.y * (1 - percent)) + (this.end.y * percent)
			if(this.callback) {
				this.callback(this.interpolatedVector)
			}
		}
		else {
			if(this.endCallback) {
				this.endCallback(this.end)
			}
			this.destroy()
		}
	}

	public destroy(): void {
		super.destroy()
	}
}

@gameClass
export class SmoothVectorInterpolation extends VectorInterpolation {
	public tick(deltaTime: number): void {
		GameObject.prototype.tick.apply(this, [deltaTime])

		this.timeElapsed += deltaTime

		// shoutout to avi who helped me out figure out how to smoothly ease in this camera
		let percent = -(((this.timeElapsed / this.time) - 1) ** 2) + 1
		if(this.timeElapsed < this.time) {
			this.interpolatedVector.x = (this.start.x * (1 - percent)) + (this.end.x * percent)
			this.interpolatedVector.y = (this.start.y * (1 - percent)) + (this.end.y * percent)
			if(this.callback) {
				this.callback(this.interpolatedVector)
			}
		}
		else {
			if(this.endCallback) {
				this.endCallback(this.end)
			}
			this.destroy()
		}
	}
}