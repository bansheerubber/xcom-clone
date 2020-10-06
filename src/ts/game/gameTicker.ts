import Game from "./game";
import GameObject from "./gameObject";
import { performance } from "perf_hooks"

import Scheduler from "./scheduler";
import Matter = require("matter-js");

export default class GameTicker {
	public game: Game
	public isTicking: boolean
	public objects: Set<GameObject> = new Set<GameObject>() // all the game objects in our list
	public scheduler: Scheduler = new Scheduler()
	public timescale: number = 1

	private lastCollisionTime: number = 0
	private lastRenderTime: number = 0
	private lastTickTime: number = 0
	private lastTick: number = 0 // the last time we ticked
	private lastTotalDeltaTime: number = 16 / 1000 // the last amount of time it took to do an entire frame, including deltatime, tick time, and render time

	public static serverTickRate: number = 30



	constructor(game: Game) {
		this.game = game
	}

	/**
	 * starts ticking if we weren't already
	 */
	public start(): void {
		this.isTicking = true
		this.tick()
	}

	/**
	 * stops ticking if we were ticking already
	 */
	public stop(): void {
		this.isTicking = false
	}

	/**
	 * loop through all game objects and tick. also render and run Matter.js tick
	 */
	public tick(): void {
		let startTick = performance.now()
		let deltaTime = (startTick - this.lastTick) / 1000

		let totalDeltaTime = ((startTick - this.lastTick) + this.lastTickTime + this.lastRenderTime + this.lastCollisionTime) / 1000

		let usedDeltaTime = Math.min(totalDeltaTime, 0.033)
		let usedLastDeltaTime = Math.min(this.lastTotalDeltaTime, 0.033)

		// tick collision
		if(this.game.collision) {
			var collisionTime = performance.now()
			this.game.collision.tick(usedDeltaTime * this.timescale, usedLastDeltaTime * this.timescale)
			this.lastCollisionTime = performance.now() - collisionTime
		}

		// tick all the objects
		let tickTime = performance.now()
		this.scheduler.tick() // tick the scheduler
		let tickedCount = this.tickObjects(usedDeltaTime * this.timescale) // tick all the game objects
		let maxTickedCount = this.objects.size // how many objects we could've ticked
		this.lastTickTime = performance.now() - tickTime

		// tick renderer
		if(this.game.renderer && this.game.renderer.enabled) {
			var renderTime = performance.now()
			this.game.renderer.tick(usedDeltaTime * this.timescale)
			this.lastRenderTime = performance.now() - renderTime
		}

		// update debug info
		if(this.game.debug) {
			if(this.game.debug.shouldRenderCollisions) {
				this.game.debug.updateCamera()
				let time = performance.now()
				Matter.Render.world(this.game.debug.renderer)
				this.lastCollisionTime += performance.now() - time
			}
			
			this.game.debug.update(deltaTime, tickedCount, maxTickedCount, this.lastTickTime, this.lastRenderTime, this.lastCollisionTime, totalDeltaTime)
		}

		if(this.isTicking) {
			if(this.game.isClient) {
				window.requestAnimationFrame(this.tick.bind(this))
			}
			else {
				setTimeout(() => {
					this.tick()
				}, GameTicker.serverTickRate)
			}
		}

		this.lastTick = performance.now()
		this.lastTotalDeltaTime = totalDeltaTime
	}

	/**
	 * ticks all game objects
	 * @param deltaTime seconds
	 */
	private tickObjects(deltaTime: number): number {
		let tickedCount = 0
		for(let gameObject of this.objects.values()) {
			if(gameObject.canTick) {
				gameObject.tick(deltaTime)
				tickedCount++
			}
			else {
				this.objects.delete(gameObject)
			}
		}
		return tickedCount
	}
}