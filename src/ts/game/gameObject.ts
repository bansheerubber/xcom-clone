import Game from "./game";
import GameObjectOptions from "./gameObjectOptions";
import { Frames, ScheduleObject } from "./scheduler";

// everything that needs to tick inherits from this object
export default abstract class GameObject {
	public game: Game
	public gameObjectOptions: GameObjectOptions
	public isDestroyed: boolean = false
	protected _onTick: (deltaTime: number) => void = null



	constructor(game: Game, gameObjectOptions: GameObjectOptions = {}) {
		this.game = game
		game.ticker.objects.add(this)
		this.gameObjectOptions = gameObjectOptions
	}
	
	/**
	 * called every frame if we can tick
	 * @param deltaTime seconds
	 */
	public tick(deltaTime: number) {
		if(this._onTick) {
			this._onTick(deltaTime)
		}
	}

	/**
	 * defines a callback that is called every tick
	 * @param callback 
	 */
	public onTick(callback: (deltaTime: number) => void) {
		this._onTick = callback
	}

	/**
	 * schedule a call with the Scheduler
	 * @param time amount of seconds or frames until method is called
	 * @param call the method that will be called on this object
	 * @param args the args supplied to the method
	 */
	public schedule(time: number | Frames, call: Function, ...args: any[]): ScheduleObject {
		return this.game.ticker.scheduler.schedule(time, call, args, this)
	}

	/**
	 * whether or not we can tick
	 */
	public get canTick() {
		return this.gameObjectOptions.canTick == undefined ? true : this.gameObjectOptions.canTick
	}

	public destroy(): void {
		this.game.ticker.objects.delete(this)
		this.isDestroyed = true
	}
}