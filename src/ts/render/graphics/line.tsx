import RenderObject from "../renderObject";
import Game from "../../game/game";
import Vector from "../../helpers/vector";
import { RGBColor } from "../../helpers/color";
import * as PIXI from "pixi.js"

export default class Line extends RenderObject {
	private graphics: PIXI.Graphics = new PIXI.Graphics()
	private container: PIXI.Container
	private start_: Vector = new Vector()
	private end_: Vector = new Vector()
	private width_: number = 1
	private color_: RGBColor = new RGBColor(0, 0, 0, 1)
	private needsUpdate: boolean = true
	
	
	
	constructor(game: Game, customContainer: PIXI.Container = game.renderer.dynamic) {
		super(game)
		
		customContainer.addChild(this.graphics)
		this.container = customContainer
	}

	public tick(deltaTime: number): void {
		super.tick(deltaTime)

		if(this.needsUpdate) {
			this.graphics.clear()
			this.graphics.lineStyle(this.width, this.color.toHex(), 1)
			
			this.graphics.moveTo(this.start.x, this.start.y)
			this.graphics.lineTo(this.end.x, this.end.y)
		}
	}

	public set start(vector: Vector) {
		this.start_ = vector.clone()
		this.needsUpdate = true
	}

	public get start(): Vector {
		return this.start_
	}
	
	public set end(vector: Vector) {
		this.end_ = vector.clone()
		this.needsUpdate = true
	}

	public get end(): Vector {
		return this.end_
	}

	public set width(width: number) {
		this.width_ = width
		this.needsUpdate = true
	}
	
	public get width(): number {
		return this.width_
	}

	public set color(color: RGBColor) {
		this.color_ = color
		this.needsUpdate = true
	}

	public get color(): RGBColor {
		return this.color_
	}

	public get direction(): Vector {
		return this.end.sub_(this.start).unit()
	}

	public get length(): number {
		return this.start.dist(this.end)
	}

	public set isVisible(isVisible: boolean) {
		this.graphics.visible = isVisible
	}

	public get isVisible(): boolean {
		return this.graphics.visible
	}

	public destroy(): void {
		super.destroy()
		this.graphics.destroy()
	}
}