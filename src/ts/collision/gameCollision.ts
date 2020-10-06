import * as Matter from "matter-js"
import Game from "../game/game";
import Collidable from "./collidable";

// wrapper for handling various matter-js shit
export default class GameCollision {
	public engine: Matter.Engine = Matter.Engine.create()
	public game: Game
	public collidables: Set<Collidable> = new Set<Collidable>()
	public bodyMap: Map<Matter.Body, Collidable> = new Map<Matter.Body, Collidable>()



	constructor(game: Game) {
		this.game = game
		this.engine.world.gravity.x = 0
		this.engine.world.gravity.y = 0

		Matter.Events.on(this.engine, "collisionStart", (event) => {
			for(let pair of event.pairs) {
				this.bodyMap.get(pair.bodyA).collidingWith.add(this.bodyMap.get(pair.bodyB))
				this.bodyMap.get(pair.bodyB).collidingWith.add(this.bodyMap.get(pair.bodyA))
			}
		})

		Matter.Events.on(this.engine, "collisionEnd", (event) => {
			for(let pair of event.pairs) {
				this.bodyMap.get(pair.bodyA).collidingWith.delete(this.bodyMap.get(pair.bodyB))
				this.bodyMap.get(pair.bodyB).collidingWith.delete(this.bodyMap.get(pair.bodyA))
			}
		})
	}

	public tick(deltaTime: number, lastDeltaTime: number): void {
		Matter.Engine.update(this.engine, deltaTime * 1000, deltaTime / lastDeltaTime)
	}

	/**
	 * adds the collidable to our set and to Matter.js
	 * @param collidable
	 */
	public add(collidable: Collidable): void {
		Matter.World.add(this.engine.world, collidable.body)
		this.collidables.add(collidable)
		this.bodyMap.set(collidable.body, collidable)
	}

	/**
	 * removes the collidable from our set and from Matter.js
	 * @param collidable
	 */
	public remove(collidable: Collidable): void {
		Matter.World.remove(this.engine.world, collidable.body)
		this.collidables.delete(collidable)
		this.bodyMap.delete(collidable.body)
	}
}