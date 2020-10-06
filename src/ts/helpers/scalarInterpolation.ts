import GameObject from "../game/gameObject";
import Game from "../game/game";
import { gameClass } from "../network/networkDecorators";
import Vector from "./vector"

type callback = (scalar: number) => void

@gameClass
export default class ScalarInterpolation extends GameObject {
	public start: number
	public end: number
	public time: number

	/**
	 * called each step
	 */
	public callback: callback

	/**
	 * called when we're complete
	 */
	public endCallback: callback

	public timeElapsed: number = 0


	
	constructor(game: Game, start: number, end: number, time: number, callback?: callback, endCallback?: callback) {
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
			let interpolationNumber = (this.start * (1 - percent)) + (this.end * percent)
			this.callback(interpolationNumber)
		}
		else {
			this.endCallback(this.end)
			this.destroy()
		}
	}

	public destroy(): void {
		super.destroy()
	}
}

@gameClass
export class SmoothScalarInterpolation extends ScalarInterpolation {
	public tick(deltaTime: number): void {
		GameObject.prototype.tick.apply(this, [deltaTime])

		this.timeElapsed += deltaTime

		// shoutout to avi who helped me out figure out how to smoothly ease in this camera
		let percent = -(((this.timeElapsed / this.time) - 1) ** 2) + 1
		if(this.timeElapsed < this.time) {
			let interpolationNumber = (this.start * (1 - percent)) + (this.end * percent)
			this.callback(interpolationNumber)
		}
		else {
			this.endCallback(this.end)
			this.destroy()
		}
	}
}