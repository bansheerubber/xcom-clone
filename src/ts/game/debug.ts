import * as PIXI from "pixi.js"
import Game from "./game";
import Text from "../render/text";
import Matter = require("matter-js");
import { Keybind, KeybindModifier } from "./keybinds";
import ClientNetwork from "../network/clientNetwork";
import Network from "../network/network";

class Average {
	public averageArray: number[] = []
	public drops: number[] = [] // keeps track of the biggest drops we have over this period
	public static averageMax: number = 30

	
	public push(input: number): void {
		let oldAverage = this.getAverage()
		
		this.averageArray.push(input)

		if(this.averageArray.length > Average.averageMax) {
			this.averageArray.splice(0, 1)
		}

		if(this.averageArray.length > 0) {
			this.drops.push(oldAverage - this.getAverage())
		}

		if(this.drops.length > Average.averageMax) {
			this.drops.splice(0, 1)
		}
	}

	public getAverage(): number {
		let total = 0
		for(let element of this.averageArray) {
			total += element
		}
		return total / this.averageArray.length
	}

	// finds the lowest number, which correlates to the biggest drop in value
	public getBiggestDrop(): number {
		let smallest = Number.MAX_VALUE
		for(let element of this.drops) {
			if(element < smallest) {
				smallest = element
			}
		}
		return Math.abs(smallest)
	}
}

export default class Debug {
	public game: Game

	public shadowTime: number = 0
	
	private deltaAverage: Average = new Average()
	private totalDeltaAverage: Average = new Average()
	private tickAverage: Average = new Average()
	private renderAverage: Average = new Average()
	private collisionAverage: Average = new Average()
	private shadowAverage: Average = new Average()
	private text: Text
	private gpu: string
	private jsSpeed: number = this.getJSSpeed()
	public renderer: Matter.Render
	public shouldRenderCollisions: boolean = false

	private oldWidth: number = 0
	private oldHeight: number = 0
	private appliedMod: boolean = false



	constructor(game: Game) {
		this.game = game

		this.text = new Text(game, "big", true, new PIXI.TextStyle({
			fill: 0x00FF00,
			fontSize: 12
		}))

		this.gpu = this.game.renderer.getGPUName()

		this.renderer = Matter.Render.create({
			element: document.body,
			engine: this.game.collision.engine,
			options: {
				width: this.game.renderer.width,
				height: this.game.renderer.height,
				hasBounds: true,
				showVelocity: true,
				showPosition: true,
				showConvexHulls: true,
				showCollisions: true,
                showSeparations: true,
                showAxes: true,
				showPositions: true,
				showDebug: true,
				wireframeBackground: "rgba(0, 0, 0, 0)",
				background: "rgba(0, 0, 0, 0)",
				wireframes: false,
			} as any
		})
		
		this.oldWidth = this.game.renderer.width
		this.oldHeight = this.game.renderer.height

		// toggle rendering collision debug
		new Keybind("f2", KeybindModifier.NONE, "Toggle Matter.JS View").down((event: KeyboardEvent) => {
			if(this.shouldRenderCollisions) {
				let context = this.renderer.canvas.getContext("2d")
				context.clearRect(0, 0, this.renderer.canvas.width, this.renderer.canvas.height)
			}

			this.shouldRenderCollisions = !this.shouldRenderCollisions
		})
	}

	public updateCamera() {	
		if(this.game.renderer && this.game.renderer.camera) {
			(Matter.Render as any).lookAt(this.renderer, {
				min: {
					x: this.game.renderer.camera.position.x - (this.game.renderer.width / 2) / this.game.renderer.camera.zoom,
					y: this.game.renderer.camera.position.y - (this.game.renderer.height / 2) / this.game.renderer.camera.zoom,
				},
				max: {
					x: this.game.renderer.camera.position.x + (this.game.renderer.width / 2) / this.game.renderer.camera.zoom,
					y: this.game.renderer.camera.position.y + (this.game.renderer.height / 2) / this.game.renderer.camera.zoom,
				},
			})
		}
	}

	public update(deltaTime: number, tickedCount: number, maxTickedCount: number, tickTime: number, renderTime: number, collisionTime: number, totalDeltaTime: number): void {
		if(this.game.renderer && this.game.renderer.camera) {
			this.updateCamera()

			if(this.game.renderer.width != this.oldWidth || this.game.renderer.height != this.oldHeight) {
				this.renderer.options.width = this.game.renderer.width
				this.renderer.options.height = this.game.renderer.height

				this.renderer.canvas.width = this.game.renderer.width
				this.renderer.canvas.height = this.game.renderer.height
			}

			this.oldWidth = this.game.renderer.width
			this.oldHeight = this.game.renderer.height
		}

		this.deltaAverage.push(deltaTime)
		this.totalDeltaAverage.push(totalDeltaTime)
		this.tickAverage.push(tickTime)
		this.renderAverage.push(renderTime)
		this.collisionAverage.push(collisionTime)
		this.shadowAverage.push(this.shadowTime)
		this.shadowTime = 0

		let fps = 1000 / (this.deltaAverage.getAverage() * 1000 + this.tickAverage.getAverage() + this.renderAverage.getAverage() + this.collisionAverage.getAverage())
		
		let camera = "Camera: None"
		if(this.game.renderer.camera) {
			camera = `Camera: ${this.game.renderer.camera.position.x.toFixed(1)}, ${this.game.renderer.camera.position.y.toFixed(1)}, ${this.game.renderer.camera.zoom.toFixed(2)}`
		}
		

		let message = [
			`Version: ${this.game.version}`,
			`JSSpeed: ${this.jsSpeed.toFixed(3)}s`,
			`GPU: ${this.gpu}`,
			`FPS: ${fps.toFixed(0)}`,
			`Delta Time: ${(this.deltaAverage.getAverage() * 1000).toFixed(2)} (d${(this.deltaAverage.getBiggestDrop() * 1000).toFixed(2)}) ms`,
			`Total Delta Time: ${(this.totalDeltaAverage.getAverage() * 1000).toFixed(2)} (d${(this.totalDeltaAverage.getBiggestDrop() * 1000).toFixed(2)}) ms`,
			`Tick Time: ${this.tickAverage.getAverage().toFixed(2)} (d${this.tickAverage.getBiggestDrop().toFixed(2)}) ms`,
			`Render Time: ${this.renderAverage.getAverage().toFixed(2)} (d${this.renderAverage.getBiggestDrop().toFixed(2)}) ms`,
			`Shadow Map Gen Time: ${this.shadowAverage.getAverage().toFixed(2)} (d${this.shadowAverage.getBiggestDrop().toFixed(2)}) ms`,
			`Collision Time: ${this.collisionAverage.getAverage().toFixed(2)} (d${this.collisionAverage.getBiggestDrop().toFixed(2)}) ms`,
			`Resolution: ${this.game.renderer.width}x${this.game.renderer.height}, ${(this.game.renderer.width / this.game.renderer.height).toFixed(2)}`,
			camera,
			`# Objects Ticked: ${tickedCount}/${maxTickedCount}`,
			`# Rigid Bodies: ${this.game.collision.collidables.size}`,
			`Latency: ${Math.floor((this.game.network as ClientNetwork).client.ping)}`,
			`Connection: ${(this.game.network as ClientNetwork).client.getStatusString()}, ${(this.game.network as ClientNetwork).client.url} (${(this.game.network as ClientNetwork).client.serverName})`,
			`Bytes Received: ${(this.game.network as ClientNetwork).client.bytesReceived}`,
		]

		this.text.message = message.join("\n")
	}

	/** 
	 * determines how fast our JS environment is by performing some tests. returns a number representing the results of the tests. lower number is better
	 * <pre>
	 * note: does not equate to processor speed, but allows us to predict how long rendering/ticking will take
	 * </pre>
	*/
	public getJSSpeed(): number {
		let start = performance.now()
		let amount = 5000000 // 5,000,000. good amount because it won't stress computers too much but will still provide accurate results
		let testArray = []
		
		// just threw some bullshit operations together that should hopefully not be optimized by the javascript engine
		for(let i = amount; i > 0; i--) {
			let num = i * i / 2 + i * 31
			testArray[i % 50] = num
		}
		
		let end = performance.now()
		return (end - start) / 1000 // return speed in seconds
	}

	public getNetworkStatic(): typeof Network {
		return Network
	}
}